import React, { useState, useEffect, useRef } from 'react';
import { useSensor } from '../context/SensorContext';
import { io } from 'socket.io-client';

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

  // Camera state
  const [camUrl, setCamUrl]       = useState('');
  const [inputUrl, setInputUrl]   = useState('');
  const [camError, setCamError]   = useState(false);
  const [editingCam, setEditingCam] = useState(false);
  const imgRef = useRef(null);

  // Load saved cam URL
  useEffect(() => {
    const saved = localStorage.getItem('livestock_cam_url');
    if (saved) { setCamUrl(saved); setInputUrl(saved); }
  }, []);

  // Socket — motion updates
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

  const motion     = motionData || intrusion;
  const isDetected = motion?.detected || false;
  const motionCount = motionData?.motionCount ?? '--';
  const camOnline  = camUrl && !camError;

  const saveCamUrl = () => {
    const url = inputUrl.trim();
    // Auto-use proxy for http:// URLs to fix HTTPS mixed content
    const proxyUrl = url.startsWith('http://')
      ? `/api/cameras/proxy-stream?url=${encodeURIComponent(url)}`
      : url;
    setCamUrl(proxyUrl);
    setCamError(false);
    setEditingCam(false);
    localStorage.setItem('livestock_cam_url', proxyUrl);
    localStorage.setItem('livestock_cam_raw_url', url);
  };

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>🐄 Livestock Monitor</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
            PIR Motion Sensor + ESP32-CAM · Real-time animal monitoring
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

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
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

        {/* Camera status */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>📷</div>
          <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>ESP32-CAM</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '20px',
            background: camOnline ? 'rgba(22,163,74,0.15)' : 'rgba(100,116,139,0.1)',
            color: camOnline ? '#4ade80' : '#64748b', fontSize: '0.8rem', fontWeight: 700
          }}>
            {camOnline ? '● Live' : '○ Offline'}
          </div>
        </div>
      </div>

      {/* Main: PIR Panel + Camera Feed side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* PIR Motion Panel */}
        <div style={{
          background: '#1e293b',
          border: `1px solid ${isDetected ? '#ef444433' : '#334155'}`,
          borderRadius: '12px', padding: '24px'
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
                background: 'radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)',
                animation: 'ripple 2s infinite'
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

          {/* Alert */}
          {isDetected && (
            <div style={{
              marginTop: '14px', padding: '12px 14px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px'
            }}>
              <div style={{ color: '#fca5a5', fontSize: '0.82rem', fontWeight: 700, marginBottom: '3px' }}>⚠️ Alert: Animal Detected!</div>
              <div style={{ color: '#f87171', fontSize: '0.75rem' }}>Motion in Livestock Area. Check camera feed →</div>
            </div>
          )}
        </div>

        {/* ESP32-CAM Feed */}
        <div style={{
          background: '#1e293b',
          border: `1px solid ${camOnline ? '#16a34a33' : '#334155'}`,
          borderRadius: '12px', overflow: 'hidden'
        }}>
          {/* Camera header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid #334155',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📷</span>
              <span style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>ESP32-CAM Live Feed</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Live badge */}
              {camOnline && (
                <span style={{
                  padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700,
                  background: 'rgba(239,68,68,0.15)', color: '#f87171'
                }}>● LIVE</span>
              )}
              {/* Detected overlay badge */}
              {isDetected && camOnline && (
                <span style={{
                  padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700,
                  background: 'rgba(239,68,68,0.2)', color: '#fca5a5',
                  animation: 'blink 1s infinite'
                }}>⚠️ MOTION</span>
              )}
              <button onClick={() => setEditingCam(!editingCam)} style={{
                background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: '6px', color: '#60a5fa', fontSize: '0.68rem',
                padding: '3px 8px', cursor: 'pointer'
              }}>⚙️ URL</button>
            </div>
          </div>

          {/* URL input */}
          {editingCam && (
            <div style={{ padding: '10px', background: '#0f172a', borderBottom: '1px solid #334155' }}>
              <input
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                placeholder="http://192.168.x.x/stream"
                style={{
                  width: '100%', padding: '7px 10px', background: '#1e293b',
                  border: '1px solid #334155', borderRadius: '7px',
                  color: '#e2e8f0', fontSize: '0.78rem', outline: 'none',
                  boxSizing: 'border-box', marginBottom: '6px'
                }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={saveCamUrl} style={{
                  flex: 1, padding: '5px', background: 'rgba(22,163,74,0.2)',
                  border: '1px solid rgba(22,163,74,0.4)', borderRadius: '6px',
                  color: '#4ade80', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600
                }}>✅ Save</button>
                <button onClick={() => setEditingCam(false)} style={{
                  flex: 1, padding: '5px', background: 'rgba(100,116,139,0.15)',
                  border: '1px solid #334155', borderRadius: '6px',
                  color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer'
                }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Camera stream */}
          <div style={{
            height: '300px', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0a0f1a'
          }}>
            {camOnline ? (
              <>
                <img
                  ref={imgRef}
                  src={camUrl}
                  alt="ESP32-CAM"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setCamError(true)}
                />
                {/* Motion detected overlay on camera */}
                {isDetected && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    border: '3px solid #ef4444',
                    borderRadius: '0',
                    pointerEvents: 'none',
                    animation: 'border-pulse 1s infinite'
                  }}>
                    <div style={{
                      position: 'absolute', top: '10px', left: '10px',
                      background: 'rgba(239,68,68,0.85)', padding: '4px 10px',
                      borderRadius: '6px', color: '#fff', fontSize: '0.75rem', fontWeight: 700
                    }}>
                      🐄 ANIMAL DETECTED
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#475569', padding: '20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📷</div>
                <div style={{ fontSize: '0.82rem', marginBottom: '6px', color: '#64748b' }}>
                  {camUrl ? '⚠️ Camera unreachable' : 'No camera URL set'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#334155', marginBottom: '12px' }}>
                  ESP32-CAM Serial Monitor-ல IP address பாருங்க
                </div>
                <button onClick={() => setEditingCam(true)} style={{
                  padding: '7px 16px', background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px',
                  color: '#60a5fa', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600
                }}>➕ Add Camera URL</button>
              </div>
            )}
          </div>

          {/* Camera URL display */}
          {camUrl && !editingCam && (
            <div style={{ padding: '6px 12px', background: '#0a0f1a', borderTop: '1px solid #1e293b' }}>
              <a href={camUrl} target="_blank" rel="noreferrer" style={{
                color: '#3b82f6', fontSize: '0.65rem', textDecoration: 'none', wordBreak: 'break-all'
              }}>{camUrl}</a>
            </div>
          )}
        </div>
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

      <style>{`
        @keyframes ripple {
          0% { opacity: 1; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(1.5); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes border-pulse {
          0%, 100% { border-color: #ef4444; }
          50% { border-color: rgba(239,68,68,0.3); }
        }
      `}</style>
    </div>
  );
}
