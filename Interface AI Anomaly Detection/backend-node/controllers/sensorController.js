const { state, setLatestReading } = require("../utils/store");
const { onNewReading } = require("../services/anomalyPipeline");
const { SENSOR_COLUMNS } = require("../utils/schema");

/** GET /api/sensors/latest — dernier relevé capteurs + historique pour les sparklines */
function getLatest(req, res) {
  if (!state.latestReading) {
    return res.status(503).json({ error: "Aucun relevé disponible pour le moment" });
  }
  res.json({
    reading: state.latestReading,
    history: state.history,
    columns: SENSOR_COLUMNS,
    robot: {
      ...state.robot,
      uptimeSeconds: Math.floor((Date.now() - state.robot.uptimeStart) / 1000),
    },
  });
}

/**
 * POST /api/sensors/ingest — reçoit un relevé réel envoyé par sensor_reader.py.
 * Corps attendu : un objet JSON plat avec (au moins) les clés de SENSOR_COLUMNS
 * (voir utils/schema.js), par exemple :
 *   { "motor_current": 1.2, "motor_power": 0.3, ..., "voltage": 53.1, "percentage": 77.1 }
 */
async function ingest(req, res) {
  const reading = req.body;
  if (!reading || typeof reading !== "object") {
    return res.status(400).json({ error: "Corps JSON invalide" });
  }

  const io = req.app.get("socketio");
  const now = Date.now();

  setLatestReading(reading);
  io.emit("sensor:update", { reading, timestamp: now, demo: false });

  // Ne bloque pas la réponse HTTP sur l'appel IA (qui peut prendre quelques dizaines de ms) :
  // on répond tout de suite, la pipeline pousse ses propres événements socket si besoin.
  onNewReading(io, reading, now).catch(() => {});

  res.json({ status: "ok" });
}

module.exports = { getLatest, ingest };
