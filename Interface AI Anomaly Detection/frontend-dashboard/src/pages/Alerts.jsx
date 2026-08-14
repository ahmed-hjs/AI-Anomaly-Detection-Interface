import React, { useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useRobotData } from '../hooks/useRobotData';
import AlertsTable from '../components/AlertsTable';

const FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'critical', label: 'Critiques' },
  { id: 'warning', label: 'Avertissements' },
  { id: 'info', label: 'Info' },
];

export default function Alerts() {
  const { alerts } = useRobotData();
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return alerts;
    return alerts.filter((a) => a.severity === filter);
  }, [alerts, filter]);

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-red-500" size={22} />
          <h1 className="text-2xl font-bold text-gray-900">Alertes</h1>
          {criticalCount > 0 && (
            <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
              {criticalCount} critique{criticalCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === f.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <AlertsTable alerts={filtered} emptyLabel="Aucune alerte pour ce filtre." />
    </div>
  );
}
