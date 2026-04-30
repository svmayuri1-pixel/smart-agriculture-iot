import React, { useState, useEffect } from 'react';
import { useSensor } from '../context/SensorContext';
import axios from 'axios';

const pestHistory = [
  { date: '2024-01-15', type: 'Aphids',      zone: 'North Field', confidence: 94, action: 'Sprayed' },
  { date: '2024-01-12', type: 'Whitefly',    zone: 'South Field', confidence: 87, action: 'Sprayed' },
  { date: '2024-01-08', type: 'Caterpillar', zone: 'East Field',  confidence: 91, action: 'Manual'  },
  { date: '2024-01-03', type: 'Aphids',      zone: 'West Field',  confidence: 78, action: 'Sprayed' },
];

const pestInfo = {
  Aphids:      { icon: '🦗', color: '#ef4444', treatment: 'Apply neem oil or insecticidal soap. Spray in early morning.', severity: 'High' },
  Whitefly:    { icon: '🦋', color: '#f59e0b', treatment: 'Use yellow sticky traps and apply pyrethrin spray.', severity: 'Medium' },
  Caterpillar: { icon: '🐛', color: '#f97316', treatment: 'Apply Bt (Bacillus thuringiensis) biological pesticide.', severity: 'High' },
  None:        { icon: '✅', color: '#16a34a', treatment: 'No treatment needed. Continue monitoring.', severity: 'None' },
};

// Camera feed component — shows real ESP32-CAM stream or offline placeholder
function CameraFeed({ camera }) {
  const [imgError, setImgError] = useState(false);
  const isOnline = camera.status === 'online' && camera.streamUrl && !imgError;

  // Proxy the stream through our server to avoid CORS/mixed-content issues
  const proxyUrl = camera.streamUrl
    ? `/api/cameras/proxy-stream?url=${encodeURIComponent(camera.streamUrl)}`
    : null;

  return (
    <div style={{
      borderRadius: '10px', overflow: 'hidden', border: '1px solid #334155',
      background: '#0f172a', position: 'relative'
    }}>
      {/* Header bar */}
      <div style={{
        padding: '8px 12px', background: '#1e293b', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
          📷 {camera.label || camera.id}
        </span>
        <span style={{
          padding: '2px 7px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700,
          background: isOnline ? 'rgba(22,163,74,0.15)' : 'rgba(100,116,139,0.15)',
          color: isOnline ? '#4ade80' : '#64748b'
        }}>
          {isOnline ? '● LIVE' : '○ OFFLINE'}
        </span>
      </div>

      {/* Stream or placeholder */}
      <div style={{ height: '180px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isOnline ? (
          // Real MJPEG stream from ESP32-CAM
          <img
            src={proxyUrl}
            alt={`Camera ${camera.id}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setImgError(true)}
          />
        ) : (
          // Offline placeholder
          <div style={{ textAlign: 'center', color: '#334155' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📷</div>
            <div style={{ fontSize: '0.75rem' }}>
              {camera.streamUrl ? 'Stream unavailable' : 'No camera connected'}
            </div>
            {camera.streamUrl && (
              <div style={{ fontSize: '0.65rem', marginTop: '4px', color: '#475569' }}>
                {camera.streamUrl}
              </div>
            )}
          </div>
        )}

        {/* Live indicator pulse */}
        {isOnline && (
          <div style={{
            position: 'absolute', top: '8px', right: '8px',
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#16a34a', boxShadow: '0 0 8px #16a34a',
            animation: 'pulse 2s infinite'
          }} />
        )}
      </div>
    </div>
  );
}

export default function PestPage() {
  const { sensorData } = useSensor();
  const pest = sensorData.pest;
  const info = pestInfo[pest.type] || pestInfo['None'];
  const [sprayActive, setSprayActive] = useState(pest.sprayActive);
  const [cameras, setCameras] = useState([]);

  // Load camera list from server
  useEffect(() => {
    axios.get('/api/cameras')
      .then(res => setCameras(res.data))
      .catch(() => {
        // Fallback demo cameras
        setCameras([
          { id: 'CAM-NORTH-01', status: 'offline', streamUrl: null, label: 'North Field' },
          { id: 'CAM-SOUTH-01', status: 'offline', streamUrl: null, label: 'South Field' },
          { id: 'CAM-BARN-01',  status: 'offline', streamUrl: null, label: 'Barn / Livestock' },
        ]);
      });
  }, []);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>🐛 Pest Management</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
          ML-powered pest detection · ESP32-CAM live feeds · Automated spray control
        </p>
      </div>

      {/* Detection + Spray */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Detection card */}
        <div style={{
          background: '#1e293b', border: `1px solid ${pest.detected ? '#ef444433' : '#16a34a33'}`,
          borderRadius: '12px', padding: '24px',
          boxShadow: pest.detected ? '0 0 30px rgba(239,68,68,0.1)' : '0 0 30px rgba(22,163,74,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '2.5rem' }}>{info.icon}</div>
            <div>
              <div style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700 }}>
                {pest.detected ? `${pest.type} Detected` : 'No Pest Detected'}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>ML Camera Analysis</div>
            </div>
          </div>

          {pest.detected && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Detection Confidence</span>
                <span style={{ color: '#f1f5f9', fontSize: '0.8rem', fontWeight: 700 }}>{pest.confidence}%</span>
              </div>
              <div style={{ height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pest.confidence}%`, background: info.color, borderRadius: '4px' }} />
              </div>
            </div>
          )}

          <div style={{ padding: '12px', background: '#0f172a', borderRadius: '8px', border: `1px solid ${info.color}22` }}>
            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, marginBottom: '6px' }}>💊 TREATMENT RECOMMENDATION</div>
            <div style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>{info.treatment}</div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <span style={{
              padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
              background: `${info.color}22`, color: info.color
            }}>Severity: {info.severity}</span>
          </div>
        </div>

        {/* Spray control */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '20px' }}>🚿 Automated Spray System</h3>

          <div style={{
            padding: '20px', background: '#0f172a', borderRadius: '10px', textAlign: 'center', marginBottom: '16px',
            border: `1px solid ${sprayActive ? '#16a34a44' : '#334155'}`
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>{sprayActive ? '💦' : '⏸'}</div>
            <div style={{ color: sprayActive ? '#4ade80' : '#64748b', fontSize: '1rem', fontWeight: 700 }}>
              {sprayActive ? 'Spraying Active' : 'System Standby'}
            </div>
          </div>

          <button
            onClick={() => setSprayActive(!sprayActive)}
            style={{
              width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
              background: sprayActive ? 'rgba(239,68,68,0.15)' : 'rgba(22,163,74,0.15)',
              color: sprayActive ? '#f87171' : '#4ade80',
              fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', marginBottom: '12px',
              borderWidth: '1px', borderStyle: 'solid',
              borderColor: sprayActive ? '#ef444433' : '#16a34a33'
            }}
          >
            {sprayActive ? '⏹ Stop Spray' : '▶ Start Spray'}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['Zone 1 — North Field', 'Zone 2 — South Field', 'Zone 3 — East Field'].map((zone, i) => (
              <div key={zone} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', background: '#0f172a', borderRadius: '6px'
              }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{zone}</span>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                  background: sprayActive && i === 0 ? 'rgba(22,163,74,0.15)' : 'rgba(100,116,139,0.1)',
                  color: sprayActive && i === 0 ? '#4ade80' : '#64748b'
                }}>{sprayActive && i === 0 ? '💦 Spraying' : 'Idle'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Camera Feeds */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600 }}>📷 Live Camera Feeds (ESP32-CAM)</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
              {cameras.filter(c => c.status === 'online').length}/{cameras.length} online
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {cameras.map(cam => (
            <CameraFeed key={cam.id} camera={cam} />
          ))}
        </div>

        {/* Connection instructions */}
        <div style={{
          marginTop: '14px', padding: '12px 14px', background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.15)', borderRadius: '8px'
        }}>
          <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
            🔌 HOW TO CONNECT YOUR ESP32-CAM
          </p>
          <p style={{ color: '#475569', fontSize: '0.75rem', lineHeight: 1.6 }}>
            1. Flash <code style={{ color: '#60a5fa' }}>hardware/esp32_cam_pest/esp32_cam_pest.ino</code> to your ESP32-CAM<br/>
            2. Set your WiFi credentials and MQTT broker in the sketch<br/>
            3. Power on — the camera will auto-register via MQTT and appear here as LIVE<br/>
            4. Stream URL format: <code style={{ color: '#60a5fa' }}>http://&lt;ESP32_IP&gt;/stream</code>
          </p>
        </div>
      </div>

      {/* Detection history */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>📋 Detection History</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Date', 'Pest Type', 'Zone', 'Confidence', 'Action'].map(h => (
                  <th key={h} style={{
                    color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left',
                    padding: '8px 12px', borderBottom: '1px solid #334155', textTransform: 'uppercase'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pestHistory.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '0.82rem' }}>{row.date}</td>
                  <td style={{ padding: '10px 12px', color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600 }}>{row.type}</td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '0.82rem' }}>{row.zone}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ color: row.confidence > 90 ? '#f87171' : '#fbbf24', fontSize: '0.82rem', fontWeight: 600 }}>
                      {row.confidence}%
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600,
                      background: 'rgba(22,163,74,0.15)', color: '#4ade80'
                    }}>{row.action}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
