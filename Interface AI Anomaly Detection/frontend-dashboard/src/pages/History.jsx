import React from 'react';
import { History as HistoryIcon } from 'lucide-react';
import { useRobotData } from '../hooks/useRobotData';
import AlertsTable from '../components/AlertsTable';

export default function History() {
  const { alerts, demo } = useRobotData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <HistoryIcon className="text-gray-500" size={22} />
          <h1 className="text-2xl font-bold text-gray-900">Historique</h1>
        </div>
        {demo.running && (
          <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
            Mode démo — relevé {demo.index ?? 0} / {demo.total ?? '?'}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Journal complet des événements (capteurs figés, anomalies IA par moteur, changements de
        mode), du plus récent au plus ancien.
      </p>

      <AlertsTable alerts={alerts} emptyLabel="Aucun événement enregistré pour le moment." />
    </div>
  );
}
