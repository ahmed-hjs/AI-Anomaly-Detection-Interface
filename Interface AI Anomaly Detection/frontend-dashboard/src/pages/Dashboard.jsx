import React from 'react';
import { CheckCircle2, Thermometer, Activity, Battery, PlayCircle, StopCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useRobotData } from '../hooks/useRobotData';
import { formatValue } from '../sensorConfig';

const MOTOR_TEMP_KEYS = ['motor_temperature', 'motor_temperature1', 'motor_temperature2', 'motor_temperature3'];

function average(reading, keys) {
  const values = keys.map((k) => reading[k]).filter((v) => typeof v === 'number');
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function toChartData(historySeries, label) {
  if (!historySeries) return [];
  return historySeries.map((value, idx) => ({ idx, [label]: value }));
}

export default function Dashboard() {
  const { reading, history, alerts, connected, demo, startDemo, stopDemo } = useRobotData();

  const hasData = Object.keys(reading).length > 0;
  const avgMotorTemp = average(reading, MOTOR_TEMP_KEYS);
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const recentAlerts = alerts.slice(0, 6);

  const voltageChart = toChartData(history.voltage, 'voltage');
  const motorTempChart = MOTOR_TEMP_KEYS.map((k) => history[k] || []).reduce((acc, series, motorIdx) => {
    series.forEach((v, idx) => {
      acc[idx] = { ...(acc[idx] || { idx }), [`moteur${motorIdx + 1}`]: v };
    });
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <span
            className={`w-3 h-3 rounded-full ${
              demo.running ? 'bg-amber-500' : connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'
            }`}
          ></span>
          <span className="text-sm text-gray-500">
            {demo.running ? `Démo en cours (${demo.index ?? 0}/${demo.total ?? '?'})` : connected ? 'Connecté' : 'Déconnecté'}
          </span>
        </div>

        {demo.running ? (
          <button
            onClick={stopDemo}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
          >
            <StopCircle size={18} /> Arrêter la démo
          </button>
        ) : (
          <button
            onClick={() => startDemo()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
          >
            <PlayCircle size={18} /> Lancer la démo
          </button>
        )}
      </div>

      {!hasData && (
        <div className="p-6 bg-white rounded-xl border border-gray-200 text-gray-500">
          Aucun relevé pour le moment. Démarrez sensor_reader.py sur le robot, ou cliquez sur
          "Lancer la démo" pour rejouer des données d'exemple.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-gray-500">État du robot</h3>
            <CheckCircle2 className={criticalAlerts.length ? 'text-red-500' : 'text-emerald-500'} size={20} />
          </div>
          <div>
            <span className="text-3xl font-bold text-gray-900">
              {criticalAlerts.length ? 'Alerte' : hasData ? 'Sain' : '—'}
            </span>
            <p className="text-sm text-gray-400">{criticalAlerts.length} alerte(s) critique(s)</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-gray-500">Temp. moteurs (moy.)</h3>
            <Thermometer className="text-gray-400" size={20} />
          </div>
          <span className="text-3xl font-bold text-gray-900">
            {avgMotorTemp !== null ? `${formatValue(avgMotorTemp)}°C` : '—'}
          </span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-gray-500">GNSS</h3>
            <Activity className="text-gray-400" size={20} />
          </div>
          <div>
            <span className="text-3xl font-bold text-gray-900 block mb-1">
              {formatValue(reading.numSV)} sats
            </span>
            <span className="text-sm text-gray-500 font-medium">fixType {formatValue(reading.fixType)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-gray-500">Batterie</h3>
            <Battery className="text-emerald-500" size={20} />
          </div>
          <span className="text-3xl font-bold text-gray-900 block mb-1">
            {reading.percentage !== undefined ? `${formatValue(reading.percentage)}%` : '—'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-6">Température moteurs (temps réel)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={motorTempChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="idx" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="moteur1" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="moteur2" stroke="#1E40AF" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="moteur3" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="moteur4" stroke="#F59E0B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-6">Alertes récentes</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentAlerts.length === 0 && <p className="text-sm text-gray-400">Aucune alerte.</p>}
            {recentAlerts.map((a) => (
              <div key={a.id} className="border-l-4 pl-3 py-1" style={{ borderColor: a.severity === 'critical' ? '#EF4444' : '#9CA3AF' }}>
                <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                <p className="text-xs text-gray-500">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-6">Tension batterie (temps réel)</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={voltageChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="idx" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} domain={['auto', 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="voltage" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
