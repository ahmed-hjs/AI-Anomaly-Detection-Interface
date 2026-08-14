const { state, pushAlert } = require("../utils/store");

const VALID_SEVERITIES = new Set(["critical", "warning", "info"]);

/** GET /api/alerts?limit=50 */
function getAlerts(req, res) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  res.json({
    alerts: state.alerts.slice(0, limit),
    total: state.alerts.length,
    criticalCount: state.alerts.filter((a) => a.severity === "critical").length,
  });
}

/**
 * POST /api/alerts/ingest — reçoit des alertes générées hors ligne
 * (ex : lsdm_moving_label.py après une analyse par lots) et les injecte
 * dans le même store que le pipeline temps réel, pour qu'elles apparaissent
 * dans AlertFeed.jsx / la page Alertes.
 *
 * Corps attendu : { "alerts": [{ severity, title, message, sensor?, timestamp? }, ...] }
 */
function ingestAlerts(req, res) {
  const body = req.body;
  if (!body || !Array.isArray(body.alerts) || body.alerts.length === 0) {
    return res.status(400).json({ error: "Corps JSON invalide : tableau 'alerts' manquant ou vide" });
  }

  const now = Date.now();
  const accepted = [];

  for (const raw of body.alerts) {
    if (!raw || typeof raw !== "object" || !raw.title || !raw.message) {
      continue; // on ignore silencieusement les entrées mal formées plutôt que de tout rejeter
    }
    const severity = VALID_SEVERITIES.has(raw.severity) ? raw.severity : "info";
    const alert = {
      severity,
      title: String(raw.title),
      message: String(raw.message),
      sensor: raw.sensor ? String(raw.sensor) : undefined,
      timestamp: Number.isFinite(raw.timestamp) ? raw.timestamp : now,
    };
    pushAlert(alert);
    accepted.push(alert);
  }

  if (accepted.length === 0) {
    return res.status(400).json({ error: "Aucune alerte valide dans le tableau reçu" });
  }

  const io = req.app.get("socketio");
  if (io) io.emit("alert:new", state.alerts.slice(0, accepted.length));

  res.json({ status: "ok", accepted: accepted.length, rejected: body.alerts.length - accepted.length });
}

module.exports = { getAlerts, ingestAlerts };
