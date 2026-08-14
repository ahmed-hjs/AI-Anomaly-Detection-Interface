import React, { useState } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

export default function SensorMiniCard({ label, value, unit, status = 'normal', history = [] }) {
  const [hovered, setHovered] = useState(false);
  const chartData = history.map((v, idx) => ({ idx, value: v }));
  const hasHistory = chartData.length > 1;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-emerald-400 transition-colors cursor-default">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</h4>
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'alert' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          ></span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          <span className="text-sm font-medium text-gray-500">{unit}</span>
        </div>
      </div>

      {hovered && hasHistory && (
        <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500">{label} — évolution récente</p>
            <p className="text-[11px] text-gray-400">
              {Math.min(...history).toFixed(2)} → {Math.max(...history).toFixed(2)} {unit}
            </p>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: -18 }}>
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  tickFormatter={(v) => Number(v).toFixed(1)}
                  width={40}
                />
                <Tooltip
                  labelFormatter={() => ''}
                  formatter={(v) => [`${Number(v).toFixed(2)} ${unit || ''}`, label]}
                />
                <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {hovered && !hasHistory && (
        <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-400">
          Pas encore assez de données pour un historique.
        </div>
      )}
    </div>
  );
}
