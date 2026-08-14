import React from 'react';
import { AlertOctagon, CheckCircle2, Cpu, Radio } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useRobotData } from '../hooks/useRobotData';

const FALLBACK_GROUPS = [
  { id: 'right_front_motor', label: 'Right Front Motor' },
  { id: 'left_front_motor', label: 'Left Front Motor' },
  { id: 'right_rear_motor', label: 'Right Rear Motor' },
  { id: 'left_rear_motor', label: 'Left Rear Motor' },
];

const SHARED_GROUP = { id: 'gnss_battery', label: 'GNSS / Battery' };

/** Point rouge si anomalie détectée sur cette fenêtre, sinon petit point vert discret. */
function AnomalyDot(props) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined) return null;
  if (payload.is_anomaly) {
    return <circle cx={cx} cy={cy} r={4} fill="#EF4444" stroke="#7F1D1D" strokeWidth={1} />;
  }
  return <circle cx={cx} cy={cy} r={1.5} fill="#10B981" />;
}

function MotorPanel({ group, points, latest }) {
  const isAnomaly = latest?.is_anomaly;
  const chartData = points.map((p, idx) => ({
    idx,
    score: p.score,
    is_anomaly: p.is_anomaly,
  }));

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-5 transition-colors ${
        isAnomaly ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu size={18} className={isAnomaly ? 'text-red-500' : 'text-gray-400'} />
          <h3 className="font-semibold text-gray-800">{group.label}</h3>
        </div>
        {isAnomaly ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
            <AlertOctagon size={13} /> Anomalie
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <CheckCircle2 size={13} /> Nominal
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-2xl font-bold ${isAnomaly ? 'text-red-600' : 'text-gray-900'}`}>
          {latest ? latest.score.toFixed(2) : '—'}
        </span>
        <span className="text-xs text-gray-400">
          score / seuil {latest ? `(MAE ${latest.mae.toFixed(4)} vs ${latest.threshold.toFixed(4)})` : ''}
        </span>
      </div>

      <div className="h-28">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <YAxis
                domain={[0, 'auto']}
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                width={34}
              />
              <Tooltip formatter={(v) => Number(v).toFixed(3)} labelFormatter={() => ''} />
              <ReferenceLine y={1} stroke="#F59E0B" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="score"
                stroke={isAnomaly ? '#EF4444' : '#10B981'}
                strokeWidth={2}
                dot={<AnomalyDot />}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-gray-400">
            En attente de suffisamment de relevés (fenêtre de 30)…
          </div>
        )}
      </div>

      {latest && latest.top_contributors?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1.5">Capteurs suspects</p>
          <div className="flex flex-wrap gap-1.5">
            {latest.top_contributors.map((c) => (
              <span
                key={c.feature}
                className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
              >
                {c.feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIRobot() {
  const { aiGroups, aiHistory, latestAiVerdict, demo, connected } = useRobotData();

  const groups = aiGroups.length ? aiGroups.filter((g) => g.id !== 'gnss_battery') : FALLBACK_GROUPS;
  const sharedGroup = aiGroups.find((g) => g.id === 'gnss_battery') || SHARED_GROUP;

  const latestById = {};
  if (latestAiVerdict) {
    (latestAiVerdict.motors || []).forEach((m) => (latestById[m.id] = m));
    if (latestAiVerdict.shared) latestById[latestAiVerdict.shared.id] = latestAiVerdict.shared;
  }

  const anyReady = Object.keys(aiHistory).some((k) => (aiHistory[k] || []).length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">AI Robot — Détection par moteur</h1>
          <span
            className={`w-3 h-3 rounded-full ${
              demo.running ? 'bg-amber-500' : connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'
            }`}
          />
          <span className="text-sm text-gray-500">
            {demo.running ? 'Mode démo' : connected ? 'Flux temps réel' : 'Déconnecté'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Radio size={14} />
          Autoencodeur LSTM — fenêtre glissante de 30 relevés
        </div>
      </div>

      {!anyReady && (
        <div className="p-6 bg-white rounded-xl border border-gray-200 text-gray-500">
          Aucun score IA pour le moment — il faut au moins 30 relevés consécutifs pour la première
          prédiction. Lancez la démo depuis le tableau de bord ou démarrez sensor_reader.py.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {groups.map((group) => (
          <MotorPanel
            key={group.id}
            group={group}
            points={aiHistory[group.id] || []}
            latest={latestById[group.id]}
          />
        ))}
      </div>

      <div className="grid grid-cols-1">
        <MotorPanel
          group={sharedGroup}
          points={aiHistory[sharedGroup.id] || []}
          latest={latestById[sharedGroup.id]}
        />
      </div>
    </div>
  );
}
