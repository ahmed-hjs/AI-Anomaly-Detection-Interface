import React, { useState } from 'react';
import { LineChart as LineChartIcon } from 'lucide-react';
import AnomalySnapshotModal from './AnomalySnapshotModal';

const SEVERITY_STYLE = {
  critical: { dot: 'bg-red-500', text: 'text-red-600', label: 'CRITIQUE' },
  warning: { dot: 'bg-amber-500', text: 'text-amber-600', label: 'AVERTISSEMENT' },
  info: { dot: 'bg-indigo-500', text: 'text-indigo-600', label: 'INFO' },
};

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function AlertsTable({ alerts, emptyLabel = 'Aucune alerte pour le moment.' }) {
  const [selectedAlert, setSelectedAlert] = useState(null);

  if (!alerts.length) {
    return (
      <div className="p-8 text-center text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
            <th className="px-5 py-3 font-semibold">Statut</th>
            <th className="px-5 py-3 font-semibold">Message</th>
            <th className="px-5 py-3 font-semibold">Moteur</th>
            <th className="px-5 py-3 font-semibold text-right">Heure</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a) => {
            const style = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.info;
            const hasSnapshot = Boolean(a.snapshot);
            return (
              <tr
                key={a.id}
                onClick={() => hasSnapshot && setSelectedAlert(a)}
                className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 ${
                  hasSnapshot ? 'cursor-pointer' : ''
                }`}
                title={hasSnapshot ? 'Cliquer pour voir les graphes des capteurs à cet instant' : undefined}
              >
                <td className="px-5 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-2 text-xs font-semibold ${style.text}`}>
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                    {style.label}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-800 flex items-center gap-2">
                    {a.title}
                    {hasSnapshot && <LineChartIcon size={13} className="text-gray-400 shrink-0" />}
                  </p>
                  <p className="text-xs text-gray-500">{a.message}</p>
                </td>
                <td className="px-5 py-3">
                  {a.motor ? (
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap">
                      {a.motor.replace(/_/g, ' ')}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right text-xs text-gray-400 whitespace-nowrap">
                  {formatTime(a.timestamp)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedAlert && (
        <AnomalySnapshotModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </div>
  );
}
