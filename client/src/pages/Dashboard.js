import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSensor } from '../context/SensorContext';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function StatCard({ icon, label, value, unit, color, status, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: '#1e293b', border: `1px solid ${color}22`, borderRadius: '12px',
      padding: '18px', cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s',
      position: 'relative', overflow: 'hidden'
    }}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = color; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}22`; }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px',
        background: `radial-gradient(circle at top right, ${color}15, transparent 70%)` }} />
      <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700 }}>
        {value}<span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '4px' }}>{unit}</span>
      </div>
      {status && (
        <div style={{
          marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600,
          background: status === 'Good' || status === 'Normal' ? 'rgba(22,163,74,0.15)' : status === 'Alert' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
          color: status === 'Good' || status === 'Normal' ? '#4ade80' : status === 'Alert' ? '#f87171' : '#fbbf24'
        }}>
          <span>{status === 'Good' || status === 'Normal' ? '✓' : status === 'Alert' ? '⚠' : '!'}</span> {status}
        </div>
      )}
    </div>
  );
}

function QuickControl({ icon, label, active, onToggle }) {
  return (
    <div style={{
      background: '#1e293b', border: `1px solid ${active ? '#16a34a44' : '#334155'}`,
      borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s'
    }} onClick={onToggle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{
        width: '40px', height: '22px', borderRadius: '11px',
        background: active ? '#16a34a' : '#334155', position: 'relative', transition: 'background 0.3s'
      }}>
        <div style={{
          position: 'absolute', top: '3px', left: active ? '21px' : '3px',
          width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.3s'
        }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { sensorData, history } = useSensor();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [controls, setControls] = React.useState({ irrigation: true, pestSpray: false });

  const toggle = key => setControls(c => ({ ...c, [key]: !c[key] }));
  const d = sensorData;

  const alertCount = [
    d.pest.detected,
    d.intrusion.detected,
    d.livestock.some(l => l.status === 'Alert'),
    d.field.soilMoisture < 30
  ].filter(Boolean).length;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 700 }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
          {user?.farm} · Last updated: {new Date(d.timestamp).toLocaleTimeString()}
          {alertCount > 0 && <span style={{ marginLeft: '12px', color: '#f87171', fontWeight: 600 }}>⚠️ {alertCount} active alert{alertCount > 1 ? 's' : ''}</span>}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <StatCard icon="💧" label="Soil Moisture" value={d.field.soilMoisture} unit="%" color="#3b82f6"
          status={d.field.soilMoisture < 30 ? 'Low' : d.field.soilMoisture > 70 ? 'High' : 'Good'}
          onClick={() => navigate('/field')} />
        <StatCard icon="💦" label="Humidity" value={d.field.humidity} unit="%" color="#06b6d4"
          status="Normal" onClick={() => navigate('/field')} />
        <StatCard icon="🌤️" label="Weather" value={d.weather.condition} unit="" color="#8b5cf6"
          status={d.weather.condition} onClick={() => navigate('/weather')} />
        <StatCard icon="🐛" label="Pest Alert" value={d.pest.detected ? 'YES' : 'Clear'} unit="" color={d.pest.detected ? '#ef4444' : '#16a34a'}
          status={d.pest.detected ? 'Alert' : 'Good'} onClick={() => navigate('/pest')} />
        <StatCard icon="🐄" label="Livestock" value={d.livestock.length} unit="animals" color="#16a34a"
          status={d.livestock.some(l => l.status === 'Alert') ? 'Alert' : 'Good'} onClick={() => navigate('/livestock')} />
        <StatCard icon="🚜" label="Vehicles" value={d.vehicles.filter(v => v.status === 'Active').length} unit="active" color="#f97316"
          status="Normal" onClick={() => navigate('/vehicles')} />
        <StatCard icon="🌊" label="Tank Level" value={d.irrigation.tankLevel} unit="%" color="#0ea5e9"
          status={d.irrigation.tankLevel < 30 ? 'Low' : 'Good'} onClick={() => navigate('/field')} />
      </div>

      {/* Charts + Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', marginBottom: '24px' }}>
        {/* Chart */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>
            📈 Real-Time Sensor Trends (Last 24 readings)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history.length > 1 ? history : [{ time: '0:00', soilMoisture: 50, humidity: 65 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="soilMoisture" stroke="#3b82f6" strokeWidth={2} dot={false} name="Soil Moisture %" />
              <Line type="monotone" dataKey="humidity"     stroke="#06b6d4" strokeWidth={2} dot={false} name="Humidity %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Controls */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>⚙️ Quick Controls</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <QuickControl icon="💧" label="Auto Irrigation"  active={controls.irrigation}  onToggle={() => toggle('irrigation')} />
            <QuickControl icon="🐛" label="Pest Spray"       active={controls.pestSpray}   onToggle={() => toggle('pestSpray')} />
          </div>

          {/* Irrigation zones */}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
            <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginBottom: '10px' }}>IRRIGATION ZONES</p>
            {['Zone 1', 'Zone 2', 'Zone 3'].map((zone, i) => (
              <div key={zone} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{zone}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600,
                  background: [d.irrigation.zone1, d.irrigation.zone2, d.irrigation.zone3][i] ? 'rgba(22,163,74,0.15)' : 'rgba(100,116,139,0.15)',
                  color: [d.irrigation.zone1, d.irrigation.zone2, d.irrigation.zone3][i] ? '#4ade80' : '#64748b'
                }}>
                  {[d.irrigation.zone1, d.irrigation.zone2, d.irrigation.zone3][i] ? 'ON' : 'OFF'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: Livestock summary + Inventory */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Livestock */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>🐄 Livestock Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {d.livestock.map(animal => (
              <div key={animal.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', background: '#0f172a', borderRadius: '8px',
                border: `1px solid ${animal.status === 'Alert' ? '#ef444433' : '#1e293b'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{animal.id.startsWith('COW') ? '🐄' : '🐐'}</span>
                  <div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 600 }}>{animal.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{animal.id}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>❤️ {animal.heartRate} bpm</div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600,
                    color: animal.status === 'Alert' ? '#f87171' : '#4ade80'
                  }}>{animal.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>📦 Inventory Levels</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Fertilizer', value: d.inventory.fertilizer, color: '#16a34a' },
              { label: 'Seeds',      value: d.inventory.seeds,      color: '#3b82f6' },
              { label: 'Pesticide',  value: d.inventory.pesticide,  color: '#f59e0b' },
              { label: 'Water',      value: d.inventory.water,      color: '#06b6d4' },
              { label: 'Fuel',       value: d.inventory.fuel,       color: '#f97316' }
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{item.label}</span>
                  <span style={{ color: item.value < 30 ? '#f87171' : '#e2e8f0', fontSize: '0.8rem', fontWeight: 600 }}>{item.value}%</span>
                </div>
                <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${item.value}%`, borderRadius: '3px',
                    background: item.value < 30 ? '#ef4444' : item.value < 50 ? '#f59e0b' : item.color,
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
