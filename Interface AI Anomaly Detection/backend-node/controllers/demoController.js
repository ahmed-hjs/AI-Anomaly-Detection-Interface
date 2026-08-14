const demoReplay = require("../services/demoReplay");

/** POST /api/demo/start — démarre le rejeu de database.txt comme un flux temps réel */
async function startDemo(req, res) {
  const io = req.app.get("socketio");
  const intervalMs = Number(req.body?.intervalMs) || Number(process.env.DEMO_INTERVAL_MS) || 100;
  const stepSize = Number(req.body?.stepSize) || Number(process.env.DEMO_STEP_SIZE) || 5;
  try {
    const result = await demoReplay.start(io, intervalMs, stepSize);
    res.json({ status: "ok", ...result, intervalMs, stepSize });
  } catch (err) {
    res.status(500).json({ error: `Impossible de démarrer la démo : ${err.message}` });
  }
}

/** POST /api/demo/stop */
function stopDemo(req, res) {
  const io = req.app.get("socketio");
  const result = demoReplay.stop(io);
  res.json({ status: "ok", ...result });
}

/** GET /api/demo/status */
function getDemoStatus(req, res) {
  res.json(demoReplay.status());
}

module.exports = { startDemo, stopDemo, getDemoStatus };
