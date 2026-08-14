const { state } = require("../utils/store");
const { MOTOR_IDS, MOTOR_DISPLAY_NAMES } = require("../utils/schema");

/**
 * GET /api/ai/latest — dernier verdict IA + historique des scores par moteur
 * (utilisé pour l'affichage initial de la page "AI Robot" ; les mises à jour
 * suivantes arrivent en direct via l'événement socket "ai:scores").
 */
function getLatest(req, res) {
  const groups = [
    ...MOTOR_IDS.map((id, i) => ({ id, label: MOTOR_DISPLAY_NAMES[i] })),
    { id: "gnss_battery", label: "GNSS / Battery" },
  ];

  res.json({
    groups,
    latestVerdict: state.latestAiVerdict,
    history: state.aiScoreHistory,
  });
}

module.exports = { getLatest };
