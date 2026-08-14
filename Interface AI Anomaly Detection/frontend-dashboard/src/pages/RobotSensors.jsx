import React from 'react';
import { Cpu, Wifi, Zap } from 'lucide-react';
import SensorMiniCard from '../components/SensorMiniCard';
import { useRobotData } from '../hooks/useRobotData';
import { MOTOR_GROUPS, GNSS_GROUP, BATTERY_GROUP, formatValue } from '../sensorConfig';

function GroupIcon({ groupId }) {
  if (groupId === 'gnss') return <Wifi size={20} />;
  if (groupId === 'battery') return <Zap size={20} />;
  return <Cpu size={20} />;
}

function SensorGroup({ group, reading, history, recentCriticalSensors, recentWarningSensors }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4 text-slate-700">
        <GroupIcon groupId={group.id} />
        <h2 className="text-lg font-bold">{group.label}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {group.sensors.map((sensor) => (
          <SensorMiniCard
            key={sensor.key}
            label={sensor.label}
            value={formatValue(reading[sensor.key])}
            unit={sensor.unit}
            status={
              recentCriticalSensors.has(sensor.key)
                ? 'alert'
                : recentWarningSensors.has(sensor.key)
                ? 'warning'
                : 'normal'
            }
            history={history[sensor.key] || []}
          />
        ))}
      </div>
    </section>
  );
}

export default function RobotSensors() {
  const { reading, history, connected, demo, recentCriticalSensors, recentWarningSensors } = useRobotData();
  const hasData = Object.keys(reading).length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Détail des capteurs du robot</h1>
        <div
          className={`px-3 py-1 font-semibold rounded-full text-sm ${
            demo.running
              ? 'bg-amber-100 text-amber-700'
              : connected
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {demo.running ? 'Mode démo' : connected ? 'Flux temps réel' : 'Déconnecté'}
        </div>
      </div>

      {!hasData && (
        <div className="p-6 bg-white rounded-xl border border-gray-200 text-gray-500">
          En attente d'un premier relevé — démarrez le robot (sensor_reader.py) ou lancez le
          mode démo depuis le tableau de bord.
        </div>
      )}

      {MOTOR_GROUPS.map((group) => (
        <SensorGroup
          key={group.id}
          group={group}
          reading={reading}
          history={history}
          recentCriticalSensors={recentCriticalSensors}
          recentWarningSensors={recentWarningSensors}
        />
      ))}
      <SensorGroup
        group={GNSS_GROUP}
        reading={reading}
        history={history}
        recentCriticalSensors={recentCriticalSensors}
        recentWarningSensors={recentWarningSensors}
      />
      <SensorGroup
        group={BATTERY_GROUP}
        reading={reading}
        history={history}
        recentCriticalSensors={recentCriticalSensors}
        recentWarningSensors={recentWarningSensors}
      />
    </div>
  );
}
