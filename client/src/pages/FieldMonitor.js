import React, { useState } from 'react';
import { useSensor } from '../context/SensorContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function GaugeCard({ label, value, max, unit, color, icon, description }) {
  const pct = Math.min((value / max) * 100, 100);
  const angle = (pct / 100) * 180;
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>{label}</div>
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

/* ── Simple ON/OFF toggle card (Relay & Motor share this) ── */
function ToggleCard({ label, icon, isOn, onToggle }) {
  return (
    <div style={{
      background: '#1e293b',
      border: `2px solid ${isOn ? '#16a34a' : '#ef4444'}`,
      borderRadius: '12px', padding: '20px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
    }}>
      {/* Label */}
      <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {icon} {label}
      </div>

      {/* Round toggle button */}
      <button
        onClick={onToggle}
        style={{
          width: '70px', height: '70px', borderRadius: '50%', border: 'none',
          cursor: 'pointer',
          background: isOn
            ? 'radial-gradient(circle, #16a34a, #15803d)'
            : 'radial-gradient(circle, #dc2626, #b91c1c)',
          color: '#fff', fontSize: '1.7rem',
          boxShadow: isOn
            ? '0 0 20px rgba(22,163,74,0.8)'
            : '0 0 20px rgba(220,38,38,0.7)',
          transition: 'all 0.25s'
        }}
      >
        {isOn ? '✅' : '❌'}
      </button>

      {/* Status */}
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isOn ? '#4ade80' : '#ef4444' }}>
        {isOn ? 'ON' : 'OFF'}
      </div>

      {/* Dot indicator */}
      <div style={{
        width: '10px', height: '10px', borderRadius: '50%',
        background: isOn ? '#4ade80' : '#ef4444',
        boxShadow: isOn ? '0 0 8px #4ade80' : '0 0 8px #ef4444'
      }} />
    </div>
  );
}

export default function FieldMonitor() {
  const { sensorData, history } = useSensor();
  const f = sensorData.field;

  // ── Web Serial state ──────────────────────────────────────
  const [serialConnected, setSerialConnected] = useState(false);
  const [arduinoSoil, setArduinoSoil]         = useState(null);   // raw ADC
  const [serialStatus, setSerialStatus]        = useState('');
  const readerRef = React.useRef(null);
  const portRef   = React.useRef(null);

  // Soil moisture % from Arduino raw (0–1023, dry > 580)
  const arduinoSoilPct = arduinoSoil !== null
    ? Math.round(constrain(map(arduinoSoil, 1023, 0, 0, 100), 0, 100))
    : null;

  function map(x, inMin, inMax, outMin, outMax) {
    return ((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }
  function constrain(x, lo, hi) { return Math.min(Math.max(x, lo), hi); }

  // Connect to Arduino via Web Serial API
  async function connectSerial() {
    if (!('serial' in navigator)) {
      alert('Web Serial API not supported!\nUse Chrome or Edge browser.');
      return;
    }
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      setSerialConnected(true);
      setSerialStatus('Connected ✅');

      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable);
      const reader = decoder.readable.getReader();
      readerRef.current = reader;

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          parseLine(line.trim());
        }
      }
    } catch (e) {
      setSerialStatus('Disconnected');
      setSerialConnected(false);
    }
  }

  async function disconnectSerial() {
    try {
      if (readerRef.current) await readerRef.current.cancel();
      if (portRef.current) await portRef.current.close();
    } catch (_) {}
    setSerialConnected(false);
    setSerialStatus('Disconnected');
    setArduinoSoil(null);
  }

  // Parse Arduino serial lines:
  //   "Soil Moisture Value: 450"
  function parseLine(line) {
    if (line.startsWith('Soil Moisture Value:')) {
      const raw = parseInt(line.split(':')[1]);
      if (!isNaN(raw)) setArduinoSoil(raw);
    }
  }

  // Use Arduino value if connected, else fall back to MQTT sensor
  const soilMoisture = arduinoSoilPct !== null ? arduinoSoilPct : f.soilMoisture;

  // Relay / Motor auto based on soil
  const [relayOn, setRelayOn] = useState(false);
  const [motorOn, setMotorOn] = useState(false);

  React.useEffect(() => {
    if (soilMoisture !== null) {
      setRelayOn(soilMoisture < 30);
      setMotorOn(soilMoisture < 30);
    }
  }, [soilMoisture]);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>🌾 Field Monitor</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Real-time soil and environmental data</p>
        </div>

        {/* Arduino USB Connect Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {serialConnected && arduinoSoilPct !== null && (
            <span style={{ color: '#4ade80', fontSize: '0.78rem', fontWeight: 600 }}>
              🌱 Arduino: {arduinoSoil} raw → {arduinoSoilPct}%
            </span>
          )}
          <button
            onClick={serialConnected ? disconnectSerial : connectSerial}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.8rem',
              background: serialConnected ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
              color: serialConnected ? '#f87171' : '#4ade80',
              border: `1px solid ${serialConnected ? '#ef4444' : '#22c55e'}`
            }}
          >
            {serialConnected ? '🔌 Disconnect Arduino' : '🔌 Connect Arduino USB'}
          </button>
        </div>
      </div>

      {/* 5 cards — Soil Moisture, Humidity, Light, Relay, Motor */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <GaugeCard icon="💧" label="Soil Moisture" value={f.soilMoisture} max={100} unit="%" color="#3b82f6"
          description={f.soilMoisture < 30 ? '⚠️ Needs irrigation' : f.soilMoisture > 70 ? '✓ Well watered' : '✓ Optimal'} />
        <GaugeCard icon="💦" label="Humidity"      value={f.humidity}      max={100} unit="%" color="#06b6d4"
          description="Relative humidity" />
        <ToggleCard label="Relay"  icon="🔌" isOn={relayOn} onToggle={() => setRelayOn(v => !v)} />
        <ToggleCard label="Motor"  icon="⚙️" isOn={motorOn} onToggle={() => setMotorOn(v => !v)} />
      </div>

      {/* Chart */}
      <div style={{ marginBottom: '24px' }}>
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
      </div>

      {/* Irrigation Status */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>💧 Irrigation System</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{
            padding: '14px', background: '#0f172a', borderRadius: '8px',
            border: `1px solid ${sensorData.irrigation.zone1 ? '#16a34a44' : '#334155'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Zone 1 — North Field</span>
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
              background: sensorData.irrigation.zone1 ? 'rgba(22,163,74,0.15)' : 'rgba(100,116,139,0.15)',
              color: sensorData.irrigation.zone1 ? '#4ade80' : '#64748b'
            }}>{sensorData.irrigation.zone1 ? '💧 ON' : 'OFF'}</span>
          </div>
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
