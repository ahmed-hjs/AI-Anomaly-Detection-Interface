import React, { useState } from 'react';
import { SlidersHorizontal, Save, ChevronRight } from 'lucide-react';

export default function Settings() {
  const [selectedComponent, setSelectedComponent] = useState('battery');
  const [thresholds, setThresholds] = useState({
    battery: { min: 20, max: 60, unit: 'V' },
    motor1: { min: -10, max: 80, unit: '°C' },
    motor2: { min: -10, max: 80, unit: '°C' },
    motor3: { min: -10, max: 80, unit: '°C' },
    motor4: { min: -10, max: 80, unit: '°C' },
    rtk: { min: 0, max: 5, unit: 'm' },
    gnss: { min: 10, max: 40, unit: 'satellites' }
  });

  const handleThresholdChange = (type, value) => {
    setThresholds(prev => ({
      ...prev,
      [selectedComponent]: {
        ...prev[selectedComponent],
        [type]: parseFloat(value) || 0
      }
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Paramètres des Composants</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
            Composants
          </div>
          <div className="flex flex-col">
            {Object.keys(thresholds).map(comp => (
              <button
                key={comp}
                onClick={() => setSelectedComponent(comp)}
                className={`flex items-center justify-between p-4 text-left border-b border-gray-100 transition-colors ${
                  selectedComponent === comp 
                    ? 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-500' 
                    : 'hover:bg-gray-50 text-gray-600 border-l-4 border-l-transparent'
                }`}
              >
                <span className="capitalize">{comp.replace(/([A-Z0-9])/g, ' $1').trim()}</span>
                <ChevronRight size={16} className={selectedComponent === comp ? 'text-emerald-500' : 'text-gray-300'} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200 flex items-center gap-3">
            <SlidersHorizontal className="text-emerald-500" />
            <h2 className="text-xl font-bold text-gray-800 capitalize">
              Configuration : {selectedComponent.replace(/([A-Z0-9])/g, ' $1').trim()}
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Valeur Minimale ({thresholds[selectedComponent].unit})
                </label>
                <input 
                  type="number" 
                  value={thresholds[selectedComponent].min}
                  onChange={(e) => handleThresholdChange('min', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Valeur Maximale ({thresholds[selectedComponent].unit})
                </label>
                <input 
                  type="number" 
                  value={thresholds[selectedComponent].max}
                  onChange={(e) => handleThresholdChange('max', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-colors">
                <Save size={18} />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
