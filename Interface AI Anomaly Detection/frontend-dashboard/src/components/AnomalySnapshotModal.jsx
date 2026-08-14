import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { LineChart, Line, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SENSOR_META } from '../sensorConfig';

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function AnomalySnapshotModal({ alert, onClose }) {
  const snap = alert?.snapshot;
  if (!snap) return null;

  const culprits = new Set(snap.culprits || []);
  const entries = Object.entries(snap.series || {});

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <AlertTriangle
              size={18}
              className={alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}
            />
            <h2 className="text-lg font-bold text-gray-900">{alert.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-1">{alert.message}</p>
        <p className="text-xs text-gray-400 mb-4">
          {snap.groupLabel} — état des capteurs au moment de l'alerte ({formatTime(alert.timestamp)})
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map(([key, values]) => {
            const meta = SENSOR_META[key] || { label: key, unit: '' };
            const isCulprit = culprits.has(key);
            const chartData = (values || []).map((v, idx) => ({ idx, value: v }));
            const hasData = chartData.length > 1;

            return (
              <div
                key={key}
                className={`rounded-lg border p-3 ${
                  isCulprit ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <p className={`text-xs font-semibold truncate ${isCulprit ? 'text-red-600' : 'text-gray-500'}`}>
                    {meta.label}
                  </p>
                  {isCulprit && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      CAUSE
                    </span>
                  )}
                </div>
                <div className="h-24">
                  {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: -18 }}>
                        <YAxis
                          domain={['auto', 'auto']}
                          tick={{ fill: '#9CA3AF', fontSize: 9 }}
                          tickFormatter={(v) => Number(v).toFixed(1)}
                          width={36}
                        />
                        <Tooltip
                          labelFormatter={() => ''}
                          formatter={(v) => [`${Number(v).toFixed(2)} ${meta.unit || ''}`, meta.label]}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={isCulprit ? '#EF4444' : '#6366F1'}
                          strokeWidth={isCulprit ? 2.5 : 1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[11px] text-gray-300">
                      Pas assez de données
                    </div>
                  )}
                </div>
                {values && values.length ? (
                  <p className="text-[10px] text-gray-400 mt-1">
                    {Math.min(...values).toFixed(2)} → {Math.max(...values).toFixed(2)} {meta.unit}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
