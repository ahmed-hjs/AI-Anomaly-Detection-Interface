// Schéma RÉEL des capteurs (doit rester cohérent avec backend-node/utils/schema.js
// et ai-backend/schema.py). 4 moteurs, chacun avec le même jeu de mesures, plus un
// bloc GNSS/batterie partagé.

const MOTOR_FIELDS = [
  { base: "motor_current", label: "Courant moteur", unit: "A" },
  { base: "motor_power", label: "Puissance moteur", unit: "W" },
  { base: "commanded_velocity", label: "Vitesse commandée", unit: "rad/s" },
  { base: "measured_velocity", label: "Vitesse mesurée", unit: "rad/s" },
  { base: "measured_position", label: "Position mesurée", unit: "" },
  { base: "supply_voltage", label: "Tension alim.", unit: "V" },
  { base: "supply_current", label: "Courant alim.", unit: "A" },
  { base: "motor_temperature", label: "Température moteur", unit: "°C" },
  { base: "channel_temperature", label: "Température carte", unit: "°C" },
];

const MOTOR_SUFFIXES = ["", "1", "2", "3"];

export const MOTOR_GROUPS = MOTOR_SUFFIXES.map((suffix, idx) => ({
  id: `motor${idx}`,
  label: `Moteur ${idx + 1}`,
  sensors: MOTOR_FIELDS.map((f) => ({
    key: `${f.base}${suffix}`,
    label: f.label,
    unit: f.unit,
  })),
}));

export const GNSS_GROUP = {
  id: "gnss",
  label: "GNSS",
  sensors: [
    { key: "lat", label: "Latitude", unit: "°" },
    { key: "lon", label: "Longitude", unit: "°" },
    { key: "height", label: "Altitude", unit: "m" },
    { key: "numSV", label: "Satellites (numSV)", unit: "" },
    { key: "fixType", label: "Type de fix", unit: "" },
  ],
};

export const BATTERY_GROUP = {
  id: "battery",
  label: "Batterie",
  sensors: [
    { key: "voltage", label: "Tension", unit: "V" },
    { key: "Current", label: "Courant", unit: "A" },
    { key: "percentage", label: "Charge", unit: "%" },
  ],
};

export const ALL_GROUPS = [...MOTOR_GROUPS, GNSS_GROUP, BATTERY_GROUP];

export const ALL_SENSOR_KEYS = ALL_GROUPS.flatMap((g) => g.sensors.map((s) => s.key));

// Lookup rapide capteur -> { label, unit }, indépendant du groupe auquel il appartient.
// Utile pour afficher un capteur (ex. dans un snapshot d'alerte) sans connaître son groupe.
export const SENSOR_META = Object.fromEntries(
  ALL_GROUPS.flatMap((g) => g.sensors.map((s) => [s.key, s]))
);

export function formatValue(raw) {
  if (raw === undefined || raw === null || Number.isNaN(raw)) return "—";
  if (typeof raw === "number") {
    return Number.isInteger(raw) ? raw.toString() : raw.toFixed(2);
  }
  return String(raw);
}
