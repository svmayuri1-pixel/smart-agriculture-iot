import React, { useState } from 'react';
import axios from 'axios';

const severityColor = {
  None: '#16a34a', Low: '#22c55e', Medium: '#f59e0b',
  High: '#ef4444', Critical: '#dc2626'
};

// AI Result Card
function AIResultCard({ result, image, onClose }) {
  if (!result) return null;
  const color = severityColor[result.severity] || '#64748b';
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        background: '#1e293b', border: `1px solid ${color}44`,
        borderRadius: '20px', padding: '28px', maxWidth: '560px', width: '100%',
        boxShadow: `0 0 60px ${color}22`, maxHeight: '90vh', overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '50%',
              background: `${color}22`, border: `2px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem'
            }}>
              {result.pestDetected ? '🐛' : '✅'}
            </div>
            <div>
              <div style={{ color: '#f1f5f9', fontSize: '1.15rem', fontWeight: 700 }}>
                {result.pestDetected ? result.pestName : 'No Pest Detected'}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.78rem' }}>🤖 Gemini AI Analysis</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(100,116,139,0.2)', border: 'none', borderRadius: '8px',
            color: '#94a3b8', fontSize: '1.1rem', padding: '6px 10px', cursor: 'pointer'
          }}>✕</button>
        </div>

        {/* Uploaded image preview */}
        {image && (
          <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${color}33` }}>
            <img src={image} alt="analyzed" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
          </div>
        )}

        {/* Confidence */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Confidence</span>
            <span style={{ color, fontSize: '0.78rem', fontWeight: 700 }}>{result.confidence}%</span>
          </div>
          <div style={{ height: '8px', background: '#0f172a', borderRadius: '4px' }}>
            <div style={{ height: '100%', width: `${result.confidence}%`, background: color, borderRadius: '4px', transition: 'width 1s ease' }} />
          </div>
        </div>

        {/* Severity badge */}
        <div style={{ marginBottom: '14px' }}>
          <span style={{
            padding: '4px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
            background: `${color}22`, color, border: `1px solid ${color}44`
          }}>⚠️ Severity: {result.severity}</span>
        </div>

        {/* Analysis */}
        <div style={{ padding: '14px', background: '#0f172a', borderRadius: '10px', marginBottom: '10px' }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600, marginBottom: '6px' }}>🔍 ANALYSIS</div>
          <div style={{ color: '#94a3b8', fontSize: '0.83rem', lineHeight: 1.6 }}>{result.description}</div>
        </div>

        {/* Treatment */}
        {result.pestDetected && (
          <div style={{ padding: '14px', background: 'rgba(239,68,68,0.06)', borderRadius: '10px', marginBottom: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ color: '#f87171', fontSize: '0.7rem', fontWeight: 600, marginBottom: '6px' }}>💊 TREATMENT</div>
            <div style={{ color: '#94a3b8', fontSize: '0.83rem', lineHeight: 1.6 }}>{result.treatment}</div>
          </div>
        )}

        {/* Prevention */}
        <div style={{ padding: '14px', background: 'rgba(22,163,74,0.06)', borderRadius: '10px', border: '1px solid rgba(22,163,74,0.2)' }}>
          <div style={{ color: '#4ade80', fontSize: '0.7rem', fontWeight: 600, marginBottom: '6px' }}>🛡️ PREVENTION</div>
          <div style={{ color: '#94a3b8', fontSize: '0.83rem', lineHeight: 1.6 }}>{result.prevention}</div>
        </div>

        {/* Close button */}
        <button onClick={onClose} style={{
          marginTop: '16px', width: '100%', padding: '12px',
          background: `${color}22`, border: `1px solid ${color}44`,
          borderRadius: '10px', color, fontSize: '0.9rem',
          fontWeight: 700, cursor: 'pointer'
        }}>✓ Done</button>
      </div>
    </div>
  );
}

export default function PestPage() {
  const [analyzing, setAnalyzing]   = useState(false);
  const [aiResult, setAiResult]     = useState(null);
  const [previewImg, setPreviewImg] = useState(null);
  const [dragOver, setDragOver]     = useState(false);
  const [analysisLog, setAnalysisLog] = useState([]);

  const analyzeImage = async (base64) => {
    setAnalyzing(true);
    try {
      const res = await axios.post('/api/pest/analyze', { imageBase64: base64 });
      const result = res.data.analysis;
      setAiResult(result);
      // Add to log
      setAnalysisLog(prev => [{
        time: new Date().toLocaleTimeString(),
        pest: result.pestDetected ? result.pestName : 'None',
        confidence: result.confidence,
        severity: result.severity,
        id: Date.now()
      }, ...prev.slice(0, 9)]);
    } catch (err) {
      alert('Analysis failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImg(e.target.result);
      analyzeImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = (e) => handleFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="fade-in">

      {/* AI Result popup */}
      {aiResult && (
        <AIResultCard
          result={aiResult}
          image={previewImg}
          onClose={() => { setAiResult(null); setPreviewImg(null); }}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>🐛 Pest Detection</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
          Photo upload → Gemini AI analysis → Treatment recommendation
        </p>
      </div>

      {/* Main upload area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Upload Card */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '28px' }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '20px' }}>
            📸 Upload Plant / Leaf Photo
          </h3>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? '#3b82f6' : '#334155'}`,
              borderRadius: '14px', padding: '40px 20px',
              textAlign: 'center', marginBottom: '16px',
              background: dragOver ? 'rgba(59,130,246,0.06)' : '#0f172a',
              transition: 'all 0.2s', cursor: 'pointer'
            }}
          >
            {analyzing ? (
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🤖</div>
                <div style={{ color: '#a78bfa', fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
                  Analyzing with Gemini AI...
                </div>
                <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Please wait</div>
                <div style={{
                  marginTop: '16px', height: '4px', background: '#334155',
                  borderRadius: '2px', overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%', width: '60%', background: '#a78bfa',
                    borderRadius: '2px', animation: 'loading 1.5s infinite'
                  }} />
                </div>
              </div>
            ) : previewImg ? (
              <div>
                <img src={previewImg} alt="preview" style={{
                  maxHeight: '160px', maxWidth: '100%', borderRadius: '10px',
                  objectFit: 'contain', marginBottom: '10px'
                }} />
                <div style={{ color: '#4ade80', fontSize: '0.82rem' }}>✅ Image uploaded — Analysis complete!</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🌿</div>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px' }}>
                  Drag & Drop image here
                </div>
                <div style={{ color: '#475569', fontSize: '0.78rem' }}>or click button below to upload</div>
              </div>
            )}
          </div>

          {/* Upload button */}
          <label style={{
            display: 'block', width: '100%', padding: '14px',
            background: analyzing
              ? 'rgba(139,92,246,0.1)'
              : 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))',
            border: '1px solid rgba(139,92,246,0.4)',
            borderRadius: '12px', textAlign: 'center',
            color: '#a78bfa', fontSize: '0.95rem', fontWeight: 700,
            cursor: analyzing ? 'not-allowed' : 'pointer',
            boxSizing: 'border-box', transition: 'all 0.2s'
          }}>
            {analyzing ? '⏳ Analyzing...' : '📁 Choose Photo to Analyze'}
            <input
              type="file" accept="image/*"
              onChange={handleUpload}
              style={{ display: 'none' }}
              disabled={analyzing}
            />
          </label>

          {/* Analyze again button */}
          {previewImg && !analyzing && (
            <button onClick={() => { setPreviewImg(null); setAiResult(null); }} style={{
              marginTop: '10px', width: '100%', padding: '10px',
              background: 'rgba(100,116,139,0.15)', border: '1px solid #334155',
              borderRadius: '10px', color: '#94a3b8', fontSize: '0.85rem',
              cursor: 'pointer', fontWeight: 600
            }}>🔄 Analyze Another Photo</button>
          )}
        </div>

        {/* How it works */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '28px' }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '20px' }}>
            🤖 How AI Detection Works
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { step: '1', icon: '📸', title: 'Upload Photo', desc: 'Plant or leaf photo எடுத்து upload பண்ணுங்க' },
              { step: '2', icon: '🤖', title: 'Gemini AI Analyzes', desc: 'Google Gemini AI image-ஐ analyze பண்ணும்' },
              { step: '3', icon: '🐛', title: 'Pest Identified', desc: 'Pest பேர், confidence %, severity காட்டும்' },
              { step: '4', icon: '💊', title: 'Treatment Suggested', desc: 'Exact treatment + prevention tips தரும்' },
            ].map(item => (
              <div key={item.step} style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px',
                padding: '14px', background: '#0f172a', borderRadius: '10px'
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#a78bfa', fontSize: '0.8rem', fontWeight: 700
                }}>{item.step}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span>{item.icon}</span>
                    <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>{item.title}</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Detectable pests */}
          <div style={{ marginTop: '16px', padding: '12px', background: '#0f172a', borderRadius: '10px' }}>
            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, marginBottom: '8px' }}>
              🔍 DETECTABLE PESTS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Aphids', 'Whitefly', 'Caterpillar', 'Mealybug', 'Spider Mite', 'Thrips', 'Fungus', 'Blight', 'Rust'].map(p => (
                <span key={p} style={{
                  padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem',
                  background: 'rgba(139,92,246,0.1)', color: '#a78bfa',
                  border: '1px solid rgba(139,92,246,0.2)'
                }}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Log */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>
          📋 Analysis History
        </h3>
        {analysisLog.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px', color: '#475569' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌿</div>
            <div style={{ fontSize: '0.82rem' }}>No analysis yet — upload a photo to start!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {analysisLog.map(entry => {
              const color = severityColor[entry.severity] || '#64748b';
              return (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', background: '#0f172a', borderRadius: '10px',
                  border: `1px solid ${entry.pest !== 'None' ? '#ef444433' : '#16a34a22'}`
                }}>
                  <span style={{ fontSize: '1.2rem' }}>{entry.pest !== 'None' ? '🐛' : '✅'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: entry.pest !== 'None' ? '#f87171' : '#4ade80', fontSize: '0.85rem', fontWeight: 700 }}>
                      {entry.pest !== 'None' ? entry.pest : 'No Pest Detected'}
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.72rem' }}>{entry.time}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color, fontSize: '0.82rem', fontWeight: 700 }}>{entry.confidence}%</div>
                    <div style={{
                      padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700,
                      background: `${color}22`, color
                    }}>{entry.severity}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
