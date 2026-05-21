import React, { useState, useEffect, useRef } from 'react';
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

const severityColor = {
  None: '#16a34a', Low: '#22c55e', Medium: '#f59e0b',
  High: '#ef4444', Critical: '#dc2626'
};

// AI Analysis Result Card
function AIResultCard({ result, onClose }) {
  if (!result) return null;
  const color = severityColor[result.severity] || '#64748b';
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        background: '#1e293b', border: `1px solid ${color}44`,
        borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '100%',
        boxShadow: `0 0 40px ${color}22`
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2rem' }}>{result.pestDetected ? '🐛' : '✅'}</span>
            <div>
              <div style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700 }}>
                {result.pestDetected ? result.pestName : 'No Pest Detected'}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Gemini AI Analysis</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(100,116,139,0.2)', border: 'none', borderRadius: '6px',
            color: '#94a3b8', fontSize: '1rem', padding: '4px 8px', cursor: 'pointer'
          }}>✕</button>
        </div>

        {/* Confidence bar */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Confidence</span>
            <span style={{ color: color, fontSize: '0.78rem', fontWeight: 700 }}>{result.confidence}%</span>
          </div>
          <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px' }}>
            <div style={{ height: '100%', width: `${result.confidence}%`, background: color, borderRadius: '3px' }} />
          </div>
        </div>

        {/* Severity */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <span style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
            background: `${color}22`, color
          }}>Severity: {result.severity}</span>
        </div>

        {/* Description */}
        <div style={{ padding: '10px', background: '#0f172a', borderRadius: '8px', marginBottom: '10px' }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600, marginBottom: '4px' }}>🔍 ANALYSIS</div>
          <div style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>{result.description}</div>
        </div>

        {/* Treatment */}
        {result.pestDetected && (
          <div style={{ padding: '10px', background: 'rgba(239,68,68,0.06)', borderRadius: '8px', marginBottom: '10px', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div style={{ color: '#f87171', fontSize: '0.7rem', fontWeight: 600, marginBottom: '4px' }}>💊 TREATMENT</div>
            <div style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>{result.treatment}</div>
          </div>
        )}

        {/* Prevention */}
        <div style={{ padding: '10px', background: 'rgba(22,163,74,0.06)', borderRadius: '8px', border: '1px solid rgba(22,163,74,0.15)' }}>
          <div style={{ color: '#4ade80', fontSize: '0.7rem', fontWeight: 600, marginBottom: '4px' }}>🛡️ PREVENTION</div>
          <div style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>{result.prevention}</div>
        </div>
      </div>
    </div>
  );
}

// Camera feed — supports direct ESP32-CAM URL + AI analysis
function CameraFeed({ camera, onUrlChange }) {
  const [imgError, setImgError]     = useState(false);
  const [editing, setEditing]       = useState(false);
  const [inputUrl, setInputUrl]     = useState(camera.streamUrl || '');
  const [analyzing, setAnalyzing]   = useState(false);
  const [aiResult, setAiResult]     = useState(null);
  const imgRef = useRef(null);

  const streamUrl   = camera.streamUrl || null;
  const snapshotUrl = streamUrl ? streamUrl.replace('/stream', '/snapshot') : null;
  const isOnline    = streamUrl && !imgError;

  const handleSave = () => {
    onUrlChange(camera.id, inputUrl.trim());
    setEditing(false);
    setImgError(false);
  };

  // AI Pest Analysis
  const analyzeWithAI = async () => {
    if (!snapshotUrl && !isOnline) {
      alert('Camera must be online to analyze!');
      return;
    }
    setAnalyzing(true);
    try {
      // Try to get snapshot from ESP32-CAM
      const res = await axios.post('/api/pest/analyze', {
        imageUrl: snapshotUrl || streamUrl
      });
      setAiResult(res.data.analysis);
    } catch (err) {
      // If camera not reachable, show demo analysis
      setAiResult({
        pestDetected: false,
        pestName: 'None',
        confidence: 95,
        severity: 'None',
        description: 'Camera not reachable from server. Please upload an image manually.',
        treatment: 'N/A',
        prevention: 'Ensure camera is on same network as server.'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Upload image for analysis
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        const res = await axios.post('/api/pest/analyze', { imageBase64: base64 });
        setAiResult(res.data.analysis);
        setAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setAnalyzing(false);
      alert('Analysis failed: ' + err.message);
    }
  };

  return (
    <>
      {aiResult && <AIResultCard result={aiResult} onClose={() => setAiResult(null)} />}
      <div style={{
        borderRadius: '10px', overflow: 'hidden',
        border: `1px solid ${isOnline ? '#16a34a44' : '#334155'}`,
        background: '#0f172a'
      }}>
        {/* Header */}
        <div style={{
          padding: '8px 12px', background: '#1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
            📷 {camera.label || camera.id}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            padding: '2px 7px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700,
            background: isOnline ? 'rgba(22,163,74,0.15)' : 'rgba(100,116,139,0.15)',
            color: isOnline ? '#4ade80' : '#64748b'
          }}>{isOnline ? '● LIVE' : '○ OFFLINE'}</span>
          <button onClick={() => setEditing(!editing)} style={{
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '4px', color: '#60a5fa', fontSize: '0.65rem',
            padding: '2px 6px', cursor: 'pointer'
          }}>⚙️ URL</button>
        </div>
      </div>

      {/* URL Input */}
      {editing && (
        <div style={{ padding: '8px', background: '#0f172a', borderBottom: '1px solid #334155' }}>
          <input
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            placeholder="http://192.168.x.x/stream"
            style={{
              width: '100%', padding: '6px 8px', background: '#1e293b',
              border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0',
              fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box', marginBottom: '6px'
            }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleSave} style={{
              flex: 1, padding: '5px', background: 'rgba(22,163,74,0.2)',
              border: '1px solid rgba(22,163,74,0.4)', borderRadius: '5px',
              color: '#4ade80', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600
            }}>✅ Save</button>
            <button onClick={() => setEditing(false)} style={{
              flex: 1, padding: '5px', background: 'rgba(100,116,139,0.2)',
              border: '1px solid #334155', borderRadius: '5px',
              color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer'
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Stream */}
      <div style={{
        height: '180px', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {isOnline ? (
          <img
            ref={imgRef}
            src={streamUrl}
            alt={camera.id}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#475569', padding: '10px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '6px' }}>📷</div>
            <div style={{ fontSize: '0.72rem', marginBottom: '4px' }}>
              {streamUrl ? '⚠️ Cannot reach camera' : 'No URL set'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#334155' }}>
              Click ⚙️ URL to set ESP32-CAM stream address
            </div>
          </div>
        )}
        {isOnline && (
          <div style={{
            position: 'absolute', top: '8px', right: '8px',
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#16a34a', boxShadow: '0 0 8px #16a34a'
          }} />
        )}
      </div>

      {/* AI Analysis Buttons */}
      <div style={{ padding: '8px 10px', background: '#0a1628', borderTop: '1px solid #1e293b', display: 'flex', gap: '6px' }}>
        {/* Analyze from camera */}
        {isOnline && (
          <button onClick={analyzeWithAI} disabled={analyzing} style={{
            flex: 1, padding: '6px', background: analyzing ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.2)',
            border: '1px solid rgba(139,92,246,0.4)', borderRadius: '6px',
            color: '#a78bfa', fontSize: '0.72rem', cursor: analyzing ? 'not-allowed' : 'pointer', fontWeight: 600
          }}>
            {analyzing ? '⏳ Analyzing...' : '🤖 AI Analyze'}
          </button>
        )}

        {/* Upload image for analysis */}
        <label style={{
          flex: 1, padding: '6px', background: 'rgba(59,130,246,0.15)',
          border: '1px solid rgba(59,130,246,0.3)', borderRadius: '6px',
          color: '#60a5fa', fontSize: '0.72rem', cursor: 'pointer',
          fontWeight: 600, textAlign: 'center', display: 'block'
        }}>
          {analyzing ? '⏳ Analyzing...' : '📁 Upload Leaf'}
          <input type="file" accept="image/*" onChange={handleImageUpload}
            style={{ display: 'none' }} disabled={analyzing} />
        </label>
      </div>

      {/* URL display */}
      {streamUrl && !editing && (
        <div style={{ padding: '4px 10px', background: '#0a1628', borderTop: '1px solid #1e293b' }}>
          <a href={streamUrl} target="_blank" rel="noreferrer" style={{
            color: '#3b82f6', fontSize: '0.65rem', textDecoration: 'none', wordBreak: 'break-all'
          }}>{streamUrl}</a>
        </div>
      )}
    </div>
    </>
  );
}

export default function PestPage() {
  const { sensorData } = useSensor();
  const pest = sensorData.pest;
  const info = pestInfo[pest.type] || pestInfo['None'];
  const [sprayActive, setSprayActive] = useState(pest.sprayActive);
  const [cameras, setCameras]         = useState([]);
  const [globalUrl, setGlobalUrl]     = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Load cameras
  useEffect(() => {
    axios.get('/api/cameras')
      .then(res => setCameras(res.data))
      .catch(() => {
        setCameras([
          { id: 'CAM-FIELD-01', status: 'offline', streamUrl: null, label: 'Field Camera 1' },
          { id: 'CAM-FIELD-02', status: 'offline', streamUrl: null, label: 'Field Camera 2' },
          { id: 'CAM-BARN-01',  status: 'offline', streamUrl: null, label: 'Barn Camera' },
        ]);
      });
  }, []);

  // Update individual camera URL
  const handleUrlChange = (id, url) => {
    setCameras(prev => prev.map(c =>
      c.id === id ? { ...c, streamUrl: url, status: url ? 'online' : 'offline' } : c
    ));
  };

  // Apply one URL to all cameras (quick setup)
  const applyGlobalUrl = () => {
    if (!globalUrl.trim()) return;
    setCameras(prev => prev.map((c, i) => ({
      ...c,
      streamUrl: i === 0 ? globalUrl.trim() : c.streamUrl,
      status: i === 0 ? 'online' : c.status
    })));
    setShowUrlInput(false);
    setGlobalUrl('');
  };

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
          <button onClick={() => setShowUrlInput(!showUrlInput)} style={{
            padding: '6px 12px', background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px',
            color: '#60a5fa', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600
          }}>
            ➕ Add Camera URL
          </button>
        </div>

        {/* Quick URL input */}
        {showUrlInput && (
          <div style={{
            padding: '14px', background: '#0f172a', borderRadius: '10px',
            border: '1px solid #334155', marginBottom: '16px'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '10px', fontWeight: 600 }}>
              📡 Enter your ESP32-CAM Stream URL
            </p>
            <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '10px' }}>
              Serial Monitor-ல வந்த IP address போடுங்க:<br/>
              Example: <code style={{ color: '#60a5fa' }}>http://192.168.x.x/stream</code>
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={globalUrl}
                onChange={e => setGlobalUrl(e.target.value)}
                placeholder="http://192.168.1.55/stream"
                style={{
                  flex: 1, padding: '8px 12px', background: '#1e293b',
                  border: '1px solid #334155', borderRadius: '8px',
                  color: '#e2e8f0', fontSize: '0.85rem', outline: 'none'
                }}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = '#334155'}
              />
              <button onClick={applyGlobalUrl} style={{
                padding: '8px 16px', background: '#16a34a', border: 'none',
                borderRadius: '8px', color: '#fff', fontSize: '0.85rem',
                cursor: 'pointer', fontWeight: 600
              }}>✅ Connect</button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {cameras.map(cam => (
            <CameraFeed key={cam.id} camera={cam} onUrlChange={handleUrlChange} />
          ))}
        </div>

        {/* Info box */}
        <div style={{
          marginTop: '14px', padding: '12px 14px', background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.15)', borderRadius: '8px'
        }}>
          <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>
            🔌 HOW TO VIEW YOUR ESP32-CAM
          </p>
          <p style={{ color: '#475569', fontSize: '0.75rem', lineHeight: 1.7 }}>
            1. ESP32-CAM power on பண்ணுங்க → Serial Monitor-ல IP address வரும்<br/>
            2. <strong style={{ color: '#94a3b8' }}>Example:</strong> <code style={{ color: '#60a5fa' }}>http://192.168.1.55/stream</code><br/>
            3. Above "➕ Add Camera URL" click பண்ணி URL paste பண்ணுங்க<br/>
            4. ESP32-CAM-உம் உங்க device-உம் <strong style={{ color: '#94a3b8' }}>same WiFi</strong>-ல இருக்கணும்!
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
