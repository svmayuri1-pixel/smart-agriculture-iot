import React, { useState, useEffect } from 'react';
import { useSensor } from '../context/SensorContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:34px;height:34px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 12px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;
      font-size:16px;
    ">🐄</div>`,
    iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -20],
  });
}

function MapController({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

// Detection log entry
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
        <div style={{ color: '#475569', fontSize: '0.72rem' }}>{entry.zone} · {entry.time}</div>
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

  const [motionData, setMotionData]   = useState(null);   // latest from socket
  const [detectionLog, setDetectionLog] = useState([]);
  const [sensorConnected, setSensorConnected] = useState(false);
  const [mapCenter, setMapCenter]     = useState([11.0168, 76.9558]);

  // Subscribe to real-time motion updates via socket
  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] });

    socket.on('intrusion_update', (data) => {
      setSensorConnected(true);
      setMotionData(data);

      // Add to log
      setDetectionLog(prev => [{
        detected: data.detected,
        zone:     data.zone || 'Livestock Area',
        time:     new Date().toLocaleTimeString(),
        id:       Date.now()
      }, ...prev.slice(0, 19)]); // keep last 20
    });

    // Also listen to raw MQTT messages for livestock/motion topic
    socket.on('mqtt_message', ({ topic, data }) => {
      if (topic === 'farm/livestock/motion') {
        setSensorConnected(true);
        setMotionData(data);
      }
    });

    return () => socket.disconnect();
  }, []);

  // Use socket data if available, else fallback to context
  const motion = motionData || intrusion;
  const isDetected = motion?.detected || false;
  const zone       = motion?.zone || 'Livestock Area';
  const motionCount = motionData?.motionCount ?? '--';

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>🐄 Livestock Monitor</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
            PIR Motion Sensor · Real-time animal detection
          </p>
        </div>
        {/* Sensor connection badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '20px',
          background: sensorConnected ? 'rgba(22,163,74,0.15)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${sensorConnected ? '#16a34a44' : '#ef444433'}`
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: sensorConnected ? '#4ade80' : '#f87171',
            display: 'inline-block',
            boxShadow: sensorConnected ? '0 0 6px #4ade80' : 'none'
          }} />
          <span style={{ color: sensorConnected ? '#4ade80' : '#f87171', fontSize: '0.78rem', fontWeight: 600 }}>
            {sensorConnected ? 'ESP32 Connected' : 'Waiting for Sensor'}
          </span>
        </div>
      </div>

      {/* Top stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {/* Detection status */}
        <div style={{
          background: '#1e293b',
          border: `1px solid ${isDetected ? '#ef444444' : '#16a34a33'}`,
          borderRadius: '12px', padding: '20px',
          boxShadow: isDetected ? '0 0 24px rgba(239,68,68,0.15)' : 'none',
          gridColumn: 'span 2'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: isDetected ? 'rgba(239,68,68,0.15)' : 'rgba(22,163,74,0.15)',
              border: `2px solid ${isDetected ? '#ef4444' : '#16a34a'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem',
              animation: isDetected ? 'pulse-red 1.5s infinite' : 'none'
            }}>
              {isDetected ? '🐄' : '🌿'}
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                Detection Status
              </div>
              <div style={{ color: isDetected ? '#f87171' : '#4ade80', fontSize: '1.4rem', fontWeight: 800 }}>
                {isDetected ? 'Animal Detected!' : 'Area Clear'}
              </div>
              <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: '2px' }}>
                Zone: {zone}
              </div>
            </div>
          </div>
        </div>

        {/* Motion count */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>📊</div>
          <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            Total Detections
          </div>
          <div style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700 }}>{motionCount}</div>
          <div style={{ color: '#475569', fontSize: '0.72rem' }}>this session</div>
        </div>

        {/* Sensor status */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>📡</div>
          <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            PIR Sensor
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '20px',
            background: sensorConnected ? 'rgba(22,163,74,0.15)' : 'rgba(100,116,139,0.1)',
            color: sensorConnected ? '#4ade80' : '#64748b',
            fontSize: '0.8rem', fontWeight: 700
          }}>
            {sensorConnected ? '● Active' : '○ Offline'}
          </div>
          <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: '4px' }}>GPIO 14</div>
        </div>
      </div>

      {/* Main: Detection Panel + Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Detection Panel */}
        <div style={{
          background: '#1e293b',
          border: `1px solid ${isDetected ? '#ef444433' : '#334155'}`,
          borderRadius: '12px', padding: '24px'
        }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '20px' }}>
            🔍 PIR Motion Sensor — Live Status
          </h3>

          {/* Big visual indicator */}
          <div style={{
            padding: '28px', background: '#0f172a', borderRadius: '14px',
            textAlign: 'center', marginBottom: '20px',
            border: `2px solid ${isDetected ? '#ef444455' : '#16a34a33'}`,
            position: 'relative', overflow: 'hidden'
          }}>
            {/* Ripple effect when detected */}
            {isDetected && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)',
                animation: 'ripple 2s infinite'
              }} />
            )}
            <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>
              {isDetected ? '🐄' : '🌿'}
            </div>
            <div style={{
              fontSize: '1.2rem', fontWeight: 800,
              color: isDetected ? '#f87171' : '#4ade80'
            }}>
              {isDetected ? '⚠️ Motion Detected!' : '✅ No Motion'}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '6px' }}>
              HC-SR501 PIR Sensor
            </div>
          </div>

          {/* Signal row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', background: '#0f172a', borderRadius: '10px'
            }}>
              <span style={{ color: '#64748b', fontSize: '0.82rem' }}>📌 PIR Signal</span>
              <span style={{
                padding: '3px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
                background: isDetected ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)',
                color: isDetected ? '#f87171' : '#64748b'
              }}>{isDetected ? '🔴 HIGH' : '⚫ LOW'}</span>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', background: '#0f172a', borderRadius: '10px'
            }}>
              <span style={{ color: '#64748b', fontSize: '0.82rem' }}>🐾 Detected Type</span>
              <span style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600 }}>
                {isDetected ? (motion?.type || 'Livestock') : '—'}
              </span>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', background: '#0f172a', borderRadius: '10px'
            }}>
              <span style={{ color: '#64748b', fontSize: '0.82rem' }}>📍 Zone</span>
              <span style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600 }}>{zone}</span>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', background: '#0f172a', borderRadius: '10px'
            }}>
              <span style={{ color: '#64748b', fontSize: '0.82rem' }}>🕒 Last Updated</span>
              <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                {motionData ? new Date().toLocaleTimeString() : '--'}
              </span>
            </div>
          </div>

          {/* Alert banner */}
          {isDetected && (
            <div style={{
              marginTop: '16px', padding: '14px 16px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: '10px'
            }}>
              <div style={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                ⚠️ Alert: Animal Detected!
              </div>
              <div style={{ color: '#f87171', fontSize: '0.78rem', lineHeight: 1.5 }}>
                Motion detected in {zone}. Check the livestock area immediately.
              </div>
            </div>
          )}

          {/* Wiring guide */}
          {!sensorConnected && (
            <div style={{
              marginTop: '16px', padding: '14px',
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '10px'
            }}>
              <div style={{ color: '#60a5fa', fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px' }}>
                🔌 HC-SR501 Wiring
              </div>
              <div style={{ color: '#475569', fontSize: '0.75rem', lineHeight: 1.9 }}>
                PIR VCC  → ESP32 <strong style={{ color: '#94a3b8' }}>5V (Vin)</strong><br/>
                PIR GND  → ESP32 <strong style={{ color: '#94a3b8' }}>GND</strong><br/>
                PIR OUT  → ESP32 <strong style={{ color: '#94a3b8' }}>GPIO 14</strong>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🗺️</span>
            <span style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>Sensor Location Map</span>
            <span style={{
              marginLeft: 'auto', padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
              background: isDetected ? 'rgba(239,68,68,0.15)' : 'rgba(22,163,74,0.15)',
              color: isDetected ? '#f87171' : '#4ade80'
            }}>{isDetected ? '● DETECTED' : '● CLEAR'}</span>
          </div>
          <div style={{ height: '360px' }}>
            <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={mapCenter} />
              <Marker position={mapCenter} icon={makeIcon(isDetected ? '#ef4444' : '#16a34a')}>
                <Popup>
                  <div style={{ minWidth: '150px' }}>
                    <strong>{isDetected ? '🐄 Animal Detected!' : '✅ Area Clear'}</strong>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#555' }}>
                      Zone: {zone}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#555' }}>
                      PIR Signal: {isDetected ? '🔴 HIGH' : '⚫ LOW'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid #334155', display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a' }} />
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Clear</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Animal Detected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detection log */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>
          📋 Detection Log
        </h3>
        {detectionLog.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#475569' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📡</div>
            <div style={{ fontSize: '0.82rem' }}>Waiting for sensor data...</div>
            <div style={{ fontSize: '0.72rem', marginTop: '4px', color: '#334155' }}>
              Upload esp32_livestock_motion code to your ESP32
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
            {detectionLog.map(entry => <LogEntry key={entry.id} entry={entry} />)}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(239,68,68,0); }
        }
        @keyframes ripple {
          0% { opacity: 1; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}
