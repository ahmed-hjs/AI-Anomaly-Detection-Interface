/**
 * Store en mémoire (suffisant pour la démo — à remplacer par Redis/Postgres en prod).
 */

const MAX_ALERTS = 200;
const MAX_HISTORY_POINTS = 120;
const MAX_AI_HISTORY_POINTS = 200;

const state = {
  latestReading: null,
  lastChangedAt: {}, // { sensorName: timestampMs }
  lastValues: {},    // { sensorName: valeur }
  history: {},       // { sensorName: [valeurs...] } pour les sparklines
  windowBuffer: [],  // dernières WINDOW_SIZE lectures (vecteurs numériques) pour l'IA
  alerts: [],        // liste des alertes, la plus récente en premier
  // Historique des scores d'anomalie IA, par moteur + bloc partagé, pour le graphe
  // de la page "AI Robot" : { motorId: [{ timestamp, mae, threshold, score, is_anomaly }, ...] }
  aiScoreHistory: {},
  latestAiVerdict: null,
  robot: {
    name: "R-07",
    connected: true,
    uptimeStart: Date.now(),
  },
};

function setLatestReading(reading) {
  state.latestReading = reading;
  Object.entries(reading).forEach(([key, value]) => {
    if (!state.history[key]) state.history[key] = [];
    state.history[key].push(value);
    if (state.history[key].length > MAX_HISTORY_POINTS) state.history[key].shift();
  });
}

function pushAlert(alert) {
  state.alerts.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...alert });
  if (state.alerts.length > MAX_ALERTS) state.alerts.pop();
}

/** Enregistre un verdict IA (voir ai-backend/predict.py) dans l'historique par groupe. */
function pushAiScore(verdict, timestamp = Date.now()) {
  state.latestAiVerdict = verdict;

  const groups = [...verdict.motors, verdict.shared];
  groups.forEach((g) => {
    if (!state.aiScoreHistory[g.id]) state.aiScoreHistory[g.id] = [];
    const arr = state.aiScoreHistory[g.id];
    arr.push({
      timestamp,
      mae: g.mae,
      threshold: g.threshold,
      score: g.score,
      is_anomaly: g.is_anomaly,
    });
    if (arr.length > MAX_AI_HISTORY_POINTS) arr.shift();
  });
}

module.exports = { state, setLatestReading, pushAlert, pushAiScore };
