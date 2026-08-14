#!/usr/bin/env python3
"""
sensor_reader.py — lit les topics ROS du robot et pousse chaque relevé vers backend-node,
qui relaie ensuite vers ai-backend (scoring IA) et le frontend (Socket.IO) tout seul.

IMPORTANT — ce que ce script NE doit PAS faire :
  - Ne poste QUE vers backend-node (`/api/sensors/ingest`). C'est backend-node qui
    interroge ai-backend et qui pousse au frontend en websocket — jamais l'inverse.
  - N'applique AUCUN scaling ici : le StandardScaler est déjà appliqué côté ai-backend
    (voir ai-backend/predict.py, `scaler.transform(window)`). Envoyer des données déjà
    scalées ici les ferait scaler deux fois -> scores d'anomalie totalement faux.

Le payload envoyé est un objet JSON PLAT (pas de sous-objets imbriqués). Il contient :
  - les 45 clés utilisées par le modèle IA (voir backend-node/utils/schema.js /
    ai-backend/schema.py) : pour chaque moteur i in [0,1,2,3] (suffixe "" pour i=0)
    motor_current{i}, motor_power{i}, commanded_velocity{i}, measured_velocity{i},
    measured_position{i}, supply_voltage{i}, supply_current{i}, motor_temperature{i},
    channel_temperature{i}, plus le bloc partagé GNSS/batterie :
    data, lat, lon, height, numSV, fixType, voltage, Current, percentage
  - des clés "étendues", affichage uniquement, NON utilisées par le modèle (elles sont
    ignorées par ai-backend, qui ne lit que les 45 ci-dessus) mais lues par
    frontend-dashboard/src/sensorConfig.js : gnss_hMSL, gnss_gSpeed, gnss_velN,
    gnss_velE, gnss_velD, gnss_horAcc, gnss_verAcc, gnss_motionHeading,
    gnss_vehiculeHeading, gnss_diffMode, gnss_diffSource, gnss_carrierStatus,
    battery_charge, battery_capacity, battery_power_supply_status,
    battery_power_supply_health, {left,right}_driver_fault, {left,right}_driver_status,
    {left,right}_ic_temperature, {left,right}_internal_voltage, {left,right}_adc_voltage

Mapping moteur -> suffixe (voir README.md, section "Mapping position des moteurs" —
⚠️ hypothèse à vérifier avec le câblage réel du robot) :
    right_front -> ""   left_front -> "1"   right_rear -> "2"   left_rear -> "3"

Le champ partagé "data" (voir sensorConfig.js : "RTK correction") est mappé sur le topic
booléen /ublox/rtk_correction -> 1.0 si True, 0.0 si False. ⚠️ À confirmer : si "data"
est censé représenter autre chose (ex. diffMode), dis-le moi et j'ajuste.
"""

import threading

import requests
import rospy
from enova_msgs.msg import GnssFix, GnssStatus
from roboteq_msgs.msg import Feedback, Status
from sensor_msgs.msg import BatteryState
from std_msgs.msg import Bool

# Mapping identique à backend-node/utils/schema.js (MOTOR_IDS) et ai-backend/schema.py.
# Ne pas changer sans mettre à jour ces deux fichiers en même temps.
MOTOR_NAME_TO_SUFFIX = {
    "right_front": "",
    "left_front": "1",
    "right_rear": "2",
    "left_rear": "3",
}

MOTOR_FIELD_BASES = [
    "motor_current", "motor_power", "commanded_velocity", "measured_velocity",
    "measured_position", "supply_voltage", "supply_current", "motor_temperature",
    "channel_temperature",
]


class DetailedRobotCollector:
    def __init__(self):
        rospy.init_node("detailed_robot_collector", anonymous=True)

        # Utilise rosparam plutôt qu'argparse : plus fiable avec roslaunch/rosrun, qui
        # injectent leurs propres arguments (__name, __log, ...) dans sys.argv.
        # Override : rosparam set /detailed_robot_collector/backend_url "http://..."
        self.backend_url = rospy.get_param(
            "~backend_url", "http://host.docker.internal:4000"
        )
        self.ingest_url = f"{self.backend_url}/api/sensors/ingest"

        self.battery_data = {}
        self.motors_data = {
            "left_front": {},
            "left_rear": {},
            "right_front": {},
            "right_rear": {},
        }
        self.status = {"left": {}, "right": {}}

        self.rtk_fix = False
        self.gnss_fix_data = {}
        self.gnss_status_data = {}

        # Session HTTP réutilisée + envoi dans un thread séparé pour ne jamais bloquer
        # le thread des callbacks/timer ROS, même si le backend est lent/injoignable.
        self._session = requests.Session()

        rospy.Subscriber("/battery/state", BatteryState, self.battery_callback)

        rospy.Subscriber(
            "/left/front/feedback", Feedback,
            lambda msg: self.motor_feedback_callback(msg, "left_front"),
        )
        rospy.Subscriber(
            "/left/rear/feedback", Feedback,
            lambda msg: self.motor_feedback_callback(msg, "left_rear"),
        )
        rospy.Subscriber(
            "/right/front/feedback", Feedback,
            lambda msg: self.motor_feedback_callback(msg, "right_front"),
        )
        rospy.Subscriber(
            "/right/rear/feedback", Feedback,
            lambda msg: self.motor_feedback_callback(msg, "right_rear"),
        )

        rospy.Subscriber("/ublox/rtk_correction", Bool, self.rtk_callback)
        rospy.Subscriber(
            "/left_roboteq_driver/status", Status,
            lambda msg: self.status_callback(msg, "left"),
        )
        rospy.Subscriber(
            "/right_roboteq_driver/status", Status,
            lambda msg: self.status_callback(msg, "right"),
        )
        rospy.Subscriber("/ublox/gnss_fix", GnssFix, self.gnss_fix_callback)
        rospy.Subscriber("/ublox/gnss_status", GnssStatus, self.gnss_status_callback)

        rospy.Timer(rospy.Duration(0.1), self.timer_callback)
        rospy.loginfo(f"[sensor_reader] Envoi vers {self.ingest_url} toutes les 0.1s")

    # ---------------------------------------------------------------- callbacks ROS

    def battery_callback(self, msg):
        self.battery_data = {
            "voltage": msg.voltage,
            "current": msg.current,
            "charge": msg.charge,
            "capacity": msg.capacity,
            "percentage": msg.percentage,
            "power_supply_status": msg.power_supply_status,
            "power_supply_health": msg.power_supply_health,
        }

    def motor_feedback_callback(self, msg, motor_name):
        self.motors_data[motor_name] = {
            "motor_current": msg.motor_current,
            "motor_power": msg.motor_power,
            "commanded_velocity": msg.commanded_velocity,
            "measured_velocity": msg.measured_velocity,
            "measured_position": msg.measured_position,
            "supply_voltage": msg.supply_voltage,
            "supply_current": msg.supply_current,
            "motor_temperature": msg.motor_temperature,
            "channel_temperature": msg.channel_temperature,
        }

    def status_callback(self, msg, side_name):
        self.status[side_name] = {
            "fault": msg.fault,
            "status": msg.status,
            "ic_temperature": msg.ic_temperature,
            "internal_voltage": msg.internal_voltage,
            "adc_voltage": msg.adc_voltage,
        }

    def rtk_callback(self, msg):
        self.rtk_fix = msg.data

    def gnss_fix_callback(self, msg):
        self.gnss_fix_data = {
            "lon": msg.lon,
            "lat": msg.lat,
            "height": msg.height,
            "hMSL": msg.hMSL,
            "velN": msg.velN,
            "velE": msg.velE,
            "velD": msg.velD,
            "gSpeed": msg.gSpeed,
            "horAcc": msg.horAcc,
            "verAcc": msg.verAcc,
            "velAcc": msg.velAcc,
            "motionHeading": msg.motionHeading,
            "vehiculeHeading": msg.vehiculeHeading,
        }

    def gnss_status_callback(self, msg):
        self.gnss_status_data = {
            "numSV": msg.numSV,
            "fixType": msg.fixType,
            "diffMode": msg.diffMode,
            "diffSource": msg.diffSource,
            "carrierStatus": msg.carrierStatus,
        }

    # ------------------------------------------------------- construction du payload

    def build_payload(self) -> dict:
        """Aplati tout l'état courant en un seul dict plat, aux noms de clés EXACTS
        attendus par backend-node/utils/schema.js (les 45 utilisées par le modèle) et
        frontend-dashboard/src/sensorConfig.js (le reste, affichage seulement)."""
        reading = {}

        # --- 45 clés modèle : moteurs -------------------------------------------
        for motor_name, suffix in MOTOR_NAME_TO_SUFFIX.items():
            motor = self.motors_data.get(motor_name, {})
            for base in MOTOR_FIELD_BASES:
                reading[f"{base}{suffix}"] = float(motor.get(base, 0.0))

        # --- 45 clés modèle : bloc GNSS/batterie partagé ------------------------
        reading["lat"] = float(self.gnss_fix_data.get("lat", 0.0))
        reading["lon"] = float(self.gnss_fix_data.get("lon", 0.0))
        reading["height"] = float(self.gnss_fix_data.get("height", 0.0))
        reading["numSV"] = float(self.gnss_status_data.get("numSV", 0.0))
        reading["fixType"] = float(self.gnss_status_data.get("fixType", 0.0))
        reading["voltage"] = float(self.battery_data.get("voltage", 0.0))
        # attention à la casse : le schema attend "Current" (majuscule), pas "current"
        reading["Current"] = float(self.battery_data.get("current", 0.0))
        reading["percentage"] = float(self.battery_data.get("percentage", 0.0))
        reading["data"] = 1.0 if self.rtk_fix else 0.0  # RTK correction, voir docstring

        # --- Clés étendues, affichage seulement (ignorées par ai-backend) ------
        reading["gnss_hMSL"] = float(self.gnss_fix_data.get("hMSL", 0.0))
        reading["gnss_gSpeed"] = float(self.gnss_fix_data.get("gSpeed", 0.0))
        reading["gnss_velN"] = float(self.gnss_fix_data.get("velN", 0.0))
        reading["gnss_velE"] = float(self.gnss_fix_data.get("velE", 0.0))
        reading["gnss_velD"] = float(self.gnss_fix_data.get("velD", 0.0))
        reading["gnss_horAcc"] = float(self.gnss_fix_data.get("horAcc", 0.0))
        reading["gnss_verAcc"] = float(self.gnss_fix_data.get("verAcc", 0.0))
        reading["gnss_motionHeading"] = float(self.gnss_fix_data.get("motionHeading", 0.0))
        reading["gnss_vehiculeHeading"] = float(self.gnss_fix_data.get("vehiculeHeading", 0.0))
        reading["gnss_diffMode"] = float(self.gnss_status_data.get("diffMode", 0.0))
        reading["gnss_diffSource"] = float(self.gnss_status_data.get("diffSource", 0.0))
        reading["gnss_carrierStatus"] = float(self.gnss_status_data.get("carrierStatus", 0.0))

        reading["battery_charge"] = float(self.battery_data.get("charge", 0.0))
        reading["battery_capacity"] = float(self.battery_data.get("capacity", 0.0))
        reading["battery_power_supply_status"] = self.battery_data.get("power_supply_status", 0)
        reading["battery_power_supply_health"] = self.battery_data.get("power_supply_health", 0)

        for side in ("left", "right"):
            s = self.status.get(side, {})
            reading[f"{side}_driver_fault"] = s.get("fault", 0)
            reading[f"{side}_driver_status"] = s.get("status", 0)
            reading[f"{side}_ic_temperature"] = float(s.get("ic_temperature", 0.0))
            reading[f"{side}_internal_voltage"] = float(s.get("internal_voltage", 0.0))
            reading[f"{side}_adc_voltage"] = float(s.get("adc_voltage", 0.0))

        return reading

    # ------------------------------------------------------------------- envoi

    def _post(self, payload: dict):
        try:
            self._session.post(self.ingest_url, json=payload, timeout=2.0)
        except requests.exceptions.RequestException as e:
            rospy.logwarn_throttle(5, f"[sensor_reader] Échec d'envoi au backend : {e}")

    def timer_callback(self, event):
        payload = self.build_payload()
        # Fire-and-forget dans un thread : ne bloque jamais le timer ROS, même si le
        # backend est lent/injoignable (avec l'ancien timeout=0.05 en synchrone, une
        # requête un peu lente aurait retardé/loupé le tick suivant).
        threading.Thread(target=self._post, args=(payload,), daemon=True).start()


if __name__ == "__main__":
    try:
        collector = DetailedRobotCollector()
        rospy.spin()
    except rospy.ROSInterruptException:
        pass
