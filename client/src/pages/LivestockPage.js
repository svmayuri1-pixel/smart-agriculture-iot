import React, { useState, useEffect } from 'react';
import { useSensor } from '../context/SensorContext';
import { io } from 'socket.io-client';

function LogEntry({ entry }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px', background: '#0f172a', borderRadius: '8px',
      border: `1px solid ${entry.detected ? '#ef444433' : '#16a34a22'}`
    }}>
      <span style={{ fontSize: '1.2rem' }}>{entry.detected ? '🐄' : '✅'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: entry.detected ? '#f87171' : '#4ade80', fontSize: '0.82rem', fontWeight: 600 }}>
          {entry.detected ? 'Motion Detected' : 'Area Clear'}
        </div>
        <div style={{ color: '#475569', fontSize: '0.72rem' }}>{entry.time}</div>
      </div>
      <span style={{
        padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700,
        background: entry.detected ? 'rgba(239,68,68,0.15)' : 'rgba(22,163,74,0.15)',
        color: entry.detected ? '#f87171' : '#4ade80'
      }}>{entry.detected ? 'MOTION' : 'CLEAR'}</span>
    </div>
  );
}

export default function LivestockPage() {
  const { sensorData } = useSensor();
  const intrusion = sensorData.intrusion;

  const [motionData, setMotionData]     = useState(null);
  const [detectionLog, setDetectionLog] = useState([]);
  const [sensorConnected, setSensorConnected] = useState(false);

  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] });

    socket.on('intrusion_update', (data) => {
      setSensorConnected(true);
      setMotionData(data);
      setDetectionLog(prev => [{
        detected: data.detected,
        time:     new Date().toLocaleTimeString(),
        id:       Date.now()
      }, ...prev.slice(0, 19)]);
    });

    socket.on('mqtt_message', ({ topic, data }) => {
      if (topic === 'farm/livestock/motion') {
        setSensorConnected(true);
        setMotionData(data);
      }
    });

    return () => socket.disconnect();
  }, []);

  const motion      = motionData || intrusion;
  const isDetected  = motion?.detected || false;
  const motionCount = motionData?.motionCount ?? '--';

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>🐄 Livestock Monitor</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
            PIR Motion Sensor · Real-time animal monitoring
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
            {sensorConnected ? 'ESP32 Connected' : 'Waiting for Sensor'}
          </span>
        </div>
      </div>

      {/* Stat cards — 2 only */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {/* Detection status */}
        <div style={{
          background: '#1e293b',
          border: `1px solid ${isDetected ? '#ef444444' : '#16a34a33'}`,
          borderRadius: '12px', padding: '20px',
          boxShadow: isDetected ? '0 0 24px rgba(239,68,68,0.15)' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '54px', height: '54px', borderRadius: '50%',
              background: isDetected ? 'rgba(239,68,68,0.15)' : 'rgba(22,163,74,0.15)',
              border: `2px solid ${isDetected ? '#ef4444' : '#16a34a'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem'
            }}>
              {isDetected ? '🐄' : '🌿'}
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Detection Status</div>
              <div style={{ color: isDetected ? '#f87171' : '#4ade80', fontSize: '1.2rem', fontWeight: 800 }}>
                {isDetected ? 'Animal Detected!' : 'Area Clear'}
              </div>
            </div>
          </div>
        </div>

        {/* Total detections */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>📊</div>
          <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Total Detections</div>
          <div style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700 }}>{motionCount}</div>
          <div style={{ color: '#475569', fontSize: '0.72rem' }}>this session</div>
        </div>
      </div>

      {/* PIR Motion Panel — full width */}
      <div style={{
        background: '#1e293b',
        border: `1px solid ${isDetected ? '#ef444433' : '#334155'}`,
        borderRadius: '12px', padding: '24px', marginBottom: '20px'
      }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '20px' }}>
          🔍 PIR Motion Sensor
        </h3>

        {/* Big indicator */}
        <div style={{
          padding: '30px', background: '#0f172a', borderRadius: '14px',
          textAlign: 'center', marginBottom: '16px',
          border: `2px solid ${isDetected ? '#ef444455' : '#16a34a33'}`,
          position: 'relative', overflow: 'hidden'
        }}>
          {isDetected && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)'
            }} />
          )}
          <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>
            {isDetected ? '🐄' : '🌿'}
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: isDetected ? '#f87171' : '#4ade80' }}>
            {isDetected ? '⚠️ Motion Detected!' : '✅ No Motion'}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '6px' }}>HC-SR501 · GPIO 27</div>
        </div>

        {/* Status rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#0f172a', borderRadius: '10px' }}>
            <span style={{ color: '#64748b', fontSize: '0.82rem' }}>📡 Sensor</span>
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
              background: sensorConnected ? 'rgba(22,163,74,0.15)' : 'rgba(100,116,139,0.15)',
              color: sensorConnected ? '#4ade80' : '#64748b'
            }}>{sensorConnected ? '● Active' : '○ Offline'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#0f172a', borderRadius: '10px' }}>
            <span style={{ color: '#64748b', fontSize: '0.82rem' }}>📌 PIR Signal</span>
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
              background: isDetected ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)',
              color: isDetected ? '#f87171' : '#64748b'
            }}>{isDetected ? '🔴 HIGH' : '⚫ LOW'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#0f172a', borderRadius: '10px' }}>
            <span style={{ color: '#64748b', fontSize: '0.82rem' }}>🕒 Last Update</span>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
              {motionData ? new Date().toLocaleTimeString() : '--'}
            </span>
          </div>
        </div>

        {isDetected && (
          <div style={{
            marginTop: '14px', padding: '12px 14px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px'
          }}>
            <div style={{ color: '#fca5a5', fontSize: '0.82rem', fontWeight: 700, marginBottom: '3px' }}>⚠️ Alert: Animal Detected!</div>
            <div style={{ color: '#f87171', fontSize: '0.75rem' }}>Motion in Livestock Area.</div>
          </div>
        )}
      </div>

      {/* Detection Log */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>
          📋 Detection Log
        </h3>
        {detectionLog.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px', color: '#475569' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📡</div>
            <div style={{ fontSize: '0.82rem' }}>Waiting for motion sensor data...</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
            {detectionLog.map(entry => <LogEntry key={entry.id} entry={entry} />)}
          </div>
        )}
      </div>

    </div>
  );
}
