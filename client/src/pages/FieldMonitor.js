import React from 'react';
import { useSensor } from '../context/SensorContext';
import { RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function GaugeCard({ label, value, max, unit, color, icon, description }) {
  const pct = Math.min((value / max) * 100, 100);
  const angle = (pct / 100) * 180;
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>{label}</div>
      {/* Simple arc gauge */}
      <div style={{ position: 'relative', width: '120px', height: '70px', margin: '0 auto 12px' }}>
        <svg viewBox="0 0 120 70" style={{ width: '100%', height: '100%' }}>
          <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
          <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${(angle / 180) * 157} 157`} />
        </svg>
        <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
          <div style={{ color: '#f1f5f9', fontSize: '1.3rem', fontWeight: 700 }}>{value}</div>
          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{unit}</div>
        </div>
      </div>
      {description && <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{description}</div>}
    </div>
  );
}

function SoilNutrient({ label, value, max, color }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{label}</span>
        <span style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600 }}>{value} mg/kg</span>
      </div>
      <div style={{ height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: '4px', transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

export default function FieldMonitor() {
  const { sensorData, history } = useSensor();
  const f = sensorData.field;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>🌾 Field Monitor</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Real-time soil and environmental data</p>
      </div>

      {/* Gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <GaugeCard icon="💧" label="Soil Moisture" value={f.soilMoisture} max={100} unit="%" color="#3b82f6"
          description={f.soilMoisture < 30 ? '⚠️ Needs irrigation' : f.soilMoisture > 70 ? '✓ Well watered' : '✓ Optimal'} />
        <GaugeCard icon="💦" label="Humidity"       value={f.humidity}     max={100} unit="%" color="#06b6d4"
          description="Relative humidity" />
        <GaugeCard icon="☀️" label="Light"          value={f.lightIntensity} max={1200} unit="lux" color="#fbbf24"
          description="Solar radiation" />
        <GaugeCard icon="⚗️" label="Soil pH"        value={f.ph}           max={14}  unit="pH" color="#8b5cf6"
          description={f.ph < 6 ? 'Acidic' : f.ph > 7.5 ? 'Alkaline' : '✓ Neutral'} />
      </div>

      {/* Chart + Nutrients */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>📊 Sensor History</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={history.length > 1 ? history : [{ time: '0:00', soilMoisture: 50, humidity: 65 }]}>
              <defs>
                <linearGradient id="sm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="soilMoisture" stroke="#3b82f6" fill="url(#sm)" strokeWidth={2} name="Soil Moisture %" />
              <Area type="monotone" dataKey="humidity"     stroke="#06b6d4" fill="url(#hum)" strokeWidth={2} name="Humidity %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>🧪 Soil Nutrients</h3>
          <SoilNutrient label="Nitrogen (N)"   value={f.nitrogen}   max={80} color="#16a34a" />
          <SoilNutrient label="Phosphorus (P)" value={f.phosphorus} max={60} color="#3b82f6" />
          <SoilNutrient label="Potassium (K)"  value={f.potassium}  max={70} color="#f59e0b" />

          <div style={{ marginTop: '16px', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
            <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px' }}>💡 RECOMMENDATION</p>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.5 }}>
              {f.nitrogen < 20 ? '⚠️ Low nitrogen — apply urea fertilizer' :
               f.phosphorus < 10 ? '⚠️ Low phosphorus — apply DAP' :
               f.soilMoisture < 30 ? '💧 Soil dry — activate irrigation' :
               '✅ Soil conditions are optimal for crop growth'}
            </p>
          </div>
        </div>
      </div>

      {/* Irrigation Status */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>💧 Irrigation System</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Zone 1 — North Field', active: sensorData.irrigation.zone1 },
            { label: 'Zone 2 — South Field', active: sensorData.irrigation.zone2 },
            { label: 'Zone 3 — East Field',  active: sensorData.irrigation.zone3 }
          ].map(zone => (
            <div key={zone.label} style={{
              padding: '14px', background: '#0f172a', borderRadius: '8px',
              border: `1px solid ${zone.active ? '#16a34a44' : '#334155'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{zone.label}</span>
              <span style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                background: zone.active ? 'rgba(22,163,74,0.15)' : 'rgba(100,116,139,0.15)',
                color: zone.active ? '#4ade80' : '#64748b'
              }}>{zone.active ? '💧 ON' : 'OFF'}</span>
            </div>
          ))}
          <div style={{ padding: '14px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '4px' }}>Water Flow</div>
            <div style={{ color: '#3b82f6', fontSize: '1.1rem', fontWeight: 700 }}>{sensorData.irrigation.waterFlow} L/min</div>
          </div>
          <div style={{ padding: '14px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '4px' }}>Tank Level</div>
            <div style={{ color: sensorData.irrigation.tankLevel < 30 ? '#ef4444' : '#4ade80', fontSize: '1.1rem', fontWeight: 700 }}>
              {sensorData.irrigation.tankLevel}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
