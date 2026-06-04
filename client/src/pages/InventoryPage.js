import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function getStatus(level) {
  if (level === null || level === undefined) return { label: 'No Data', color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
  if (level < 30) return { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
  if (level < 50) return { label: 'Low',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  return              { label: 'Good',     color: '#16a34a', bg: 'rgba(22,163,74,0.1)' };
}

// Circular level indicator
function CircleLevel({ level, color, size = 80 }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const fill = level !== null ? (circ - (circ * level) / 100) : circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#0f172a" strokeWidth="7" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={level !== null ? color : '#334155'}
        strokeWidth="7" strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        style={{ fill: level !== null ? color : '#475569', fontSize: size * 0.22, fontWeight: 700, transform: 'rotate(90deg)', transformOrigin: 'center' }}>
        {level !== null ? `${level}%` : '--'}
      </text>
    </svg>
  );
}

export default function InventoryPage() {
  // Storage box — HC-SR04 real data
  const [storageLevel, setStorageLevel]   = useState(null);  // 0-100%
  const [distanceCm, setDistanceCm]       = useState(null);
  const [sensorConnected, setSensorConnected] = useState(false);
  const [lastUpdated, setLastUpdated]     = useState(null);

  // Box height — match with your ESP32 code BOX_HEIGHT value
  const BOX_HEIGHT = 30; // cm

  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] });

    // Real HC-SR04 data from ESP32
    socket.on('mqtt_message', ({ topic, data }) => {
      if (topic === 'farm/inventory/storage') {
        setSensorConnected(true);
        setStorageLevel(Math.round(data.storageLevel));
        setDistanceCm(Math.round(data.distanceCm * 10) / 10);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    });

    return () => socket.disconnect();
  }, []);

  const status = getStatus(storageLevel);

  // Other inventory items — manual/static (no sensor)
  const staticItems = [
    { name: 'Seeds',      icon: '🌾', color: '#3b82f6', level: null },
    { name: 'Pesticide',  icon: '🧪', color: '#f59e0b', level: null },
    { name: 'Water',      icon: '💧', color: '#06b6d4', level: null },
    { name: 'Fuel',       icon: '⛽', color: '#f97316', level: null },
  ];

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>📦 Inventory Monitor</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
            HC-SR04 Ultrasonic Sensor · Real-time storage level
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '20px',
          background: sensorConnected ? 'rgba(22,163,74,0.15)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${sensorConnected ? '#16a34a44' : '#ef444433'}`
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: sensorConnected ? '#4ade80' : '#f87171', display: 'inline-block',
            boxShadow: sensorConnected ? '0 0 6px #4ade80' : 'none'
          }} />
          <span style={{ color: sensorConnected ? '#4ade80' : '#f87171', fontSize: '0.78rem', fontWeight: 600 }}>
            {sensorConnected ? 'Sensor Connected' : 'Waiting for Sensor'}
          </span>
        </div>
      </div>

      {/* MAIN — Storage Box (HC-SR04) — full attention */}
      <div style={{
        background: '#1e293b',
        border: `2px solid ${status.color}44`,
        borderRadius: '16px', padding: '28px',
        marginBottom: '24px',
        boxShadow: storageLevel !== null && storageLevel < 30
          ? '0 0 30px rgba(239,68,68,0.15)' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              📦 Storage Box — HC-SR04
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>
              Ultrasonic distance sensor · Box top-ல mount பண்ணியிருக்கு
            </p>
          </div>
          <span style={{
            padding: '5px 14px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700,
            background: status.bg, color: status.color
          }}>{status.label}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '32px', alignItems: 'center' }}>

          {/* Circle indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <CircleLevel level={storageLevel} color={status.color} size={160} />
            <div style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center' }}>
              Storage Level
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Visual box representation */}
            <div style={{
              background: '#0f172a', borderRadius: '12px', padding: '16px',
              border: '1px solid #334155', marginBottom: '4px'
            }}>
              <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, marginBottom: '10px' }}>
                📐 BOX VISUALIZATION
              </div>
              {/* Box diagram */}
              <div style={{
                height: '80px', background: '#0a0f1a', borderRadius: '6px',
                border: '2px solid #334155', position: 'relative', overflow: 'hidden'
              }}>
                {/* Sensor beam */}
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: '2px', height: distanceCm !== null ? `${(distanceCm / BOX_HEIGHT) * 100}%` : '60%',
                  background: 'rgba(59,130,246,0.5)',
                  transition: 'height 0.5s'
                }} />
                {/* Fill level */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: storageLevel !== null ? `${storageLevel}%` : '0%',
                  background: `linear-gradient(to top, ${status.color}44, ${status.color}22)`,
                  borderTop: `2px solid ${status.color}88`,
                  transition: 'height 0.8s ease'
                }} />
                {/* Sensor icon top */}
                <div style={{
                  position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)',
                  fontSize: '0.7rem', color: '#3b82f6'
                }}>📡</div>
                {/* Level text */}
                {storageLevel !== null && (
                  <div style={{
                    position: 'absolute', bottom: '4px', width: '100%', textAlign: 'center',
                    color: status.color, fontSize: '0.7rem', fontWeight: 700
                  }}>{storageLevel}% Full</div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', background: '#0f172a', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 600, marginBottom: '4px' }}>DISTANCE</div>
                <div style={{ color: '#60a5fa', fontSize: '1.1rem', fontWeight: 700 }}>
                  {distanceCm !== null ? `${distanceCm}` : '--'}
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}> cm</span>
                </div>
              </div>
              <div style={{ padding: '10px', background: '#0f172a', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 600, marginBottom: '4px' }}>LEVEL</div>
                <div style={{ color: status.color, fontSize: '1.1rem', fontWeight: 700 }}>
                  {storageLevel !== null ? `${storageLevel}%` : '--'}
                </div>
              </div>
              <div style={{ padding: '10px', background: '#0f172a', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 600, marginBottom: '4px' }}>UPDATED</div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
                  {lastUpdated || '--'}
                </div>
              </div>
            </div>

            {/* Alert */}
            {storageLevel !== null && storageLevel < 30 && (
              <div style={{
                padding: '10px 14px', background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px'
              }}>
                <span style={{ color: '#fca5a5', fontSize: '0.82rem', fontWeight: 700 }}>
                  🚨 Critical: Storage only {storageLevel}% — Refill immediately!
                </span>
              </div>
            )}
            {storageLevel !== null && storageLevel >= 30 && storageLevel < 50 && (
              <div style={{
                padding: '10px 14px', background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px'
              }}>
                <span style={{ color: '#fbbf24', fontSize: '0.82rem', fontWeight: 700 }}>
                  ⚠️ Low: Storage at {storageLevel}% — Consider refilling soon
                </span>
              </div>
            )}

            {/* No sensor */}
            {!sensorConnected && (
              <div style={{
                padding: '10px 14px', background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px'
              }}>
                <div style={{ color: '#60a5fa', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                  🔌 HC-SR04 Wiring
                </div>
                <div style={{ color: '#475569', fontSize: '0.72rem', lineHeight: 1.8 }}>
                  TRIG → GPIO 5 &nbsp;|&nbsp; ECHO → GPIO 18 &nbsp;|&nbsp; VCC → 5V &nbsp;|&nbsp; GND → GND
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bar chart — storage only */}
      {storageLevel !== null && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>
            📊 Storage Level
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={[{ name: 'Storage Box', level: storageLevel }]}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                formatter={(v) => [`${v}%`, 'Storage Level']}
              />
              <Bar dataKey="level" radius={[6, 6, 0, 0]} fill={status.color} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
