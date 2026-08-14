/**
 * Schéma RÉEL des capteurs du robot (remplace l'ancien schéma factice
 * motor_current_max / ic_temperature / rtk_correction_ok, etc.).
 *
 * Basé sur les colonnes utilisées par les scripts IA (lsdm.py, lsdm_moving_label.py)
 * et le fichier de données réel database.txt : 4 moteurs, chacun avec le même
 * jeu de 9 mesures, plus un bloc GNSS/batterie partagé.
 *
 * IMPORTANT : l'ordre est positionnel et doit rester identique à celui utilisé
 * pour l'entraînement du modèle IA (voir ai-backend/train_model.py).
 */

const MOTOR_FIELD_BASES = [
  "motor_current",
  "motor_power",
  "commanded_velocity",
  "measured_velocity",
  "measured_position",
  "supply_voltage",
  "supply_current",
  "motor_temperature",
  "channel_temperature",
];

// 4 moteurs : le premier sans suffixe, puis 1, 2, 3 (comme dans database.txt)
const MOTOR_SUFFIXES = ["", "1", "2", "3"];

// Position physique de chaque moteur, MÊME ORDRE que MOTOR_SUFFIXES et MÊME mapping
// que ai-backend/schema.py (les deux fichiers doivent rester synchronisés).
const MOTOR_IDS = ["right_front_motor", "left_front_motor", "right_rear_motor", "left_rear_motor"];
const MOTOR_DISPLAY_NAMES = ["Right Front Motor", "Left Front Motor", "Right Rear Motor", "Left Rear Motor"];

const SHARED_FIELDS = [
  "data",
  "lat",
  "lon",
  "height",
  "numSV",
  "fixType",
  "voltage",
  "Current",
  "percentage",
];

// Colonnes du CSV brut (avec "time" en première position), dans l'ordre exact
// utilisé par database.txt / lsdm.py.
const FULL_COLUMNS = [
  "time",
  ...MOTOR_SUFFIXES.flatMap((suffix) => MOTOR_FIELD_BASES.map((f) => `${f}${suffix}`)),
  ...SHARED_FIELDS,
];

// Colonnes du "reading" tel que stocké/diffusé par le backend (sans "time",
// qui est géré séparément comme timestamp de la mesure).
const SENSOR_COLUMNS = FULL_COLUMNS.filter((c) => c !== "time");

// Groupes utilisés pour l'affichage (un groupe par moteur + un groupe GNSS/Batterie)
const MOTOR_GROUPS = MOTOR_SUFFIXES.map((suffix, idx) => ({
  id: MOTOR_IDS[idx],
  label: MOTOR_DISPLAY_NAMES[idx],
  fields: MOTOR_FIELD_BASES.map((f) => `${f}${suffix}`),
}));

const SHARED_GROUP = {
  id: "gnss_battery",
  label: "GNSS / Batterie",
  fields: SHARED_FIELDS,
};

/** Parse une ligne CSV (déjà splittée en tableau de strings) en objet { time, ...reading } */
function parseRow(values) {
  if (values.length !== FULL_COLUMNS.length) {
    throw new Error(
      `Colonnes attendues: ${FULL_COLUMNS.length}, reçues: ${values.length}`
    );
  }
  const row = {};
  FULL_COLUMNS.forEach((col, i) => {
    row[col] = Number(values[i]);
  });
  return row;
}

/** Sépare un objet complet ({time, ...}) en { time, reading } */
function splitTimeAndReading(row) {
  const { time, ...reading } = row;
  return { time, reading };
}

module.exports = {
  MOTOR_FIELD_BASES,
  MOTOR_SUFFIXES,
  MOTOR_IDS,
  MOTOR_DISPLAY_NAMES,
  SHARED_FIELDS,
  FULL_COLUMNS,
  SENSOR_COLUMNS,
  MOTOR_GROUPS,
  SHARED_GROUP,
  parseRow,
  splitTimeAndReading,
};
