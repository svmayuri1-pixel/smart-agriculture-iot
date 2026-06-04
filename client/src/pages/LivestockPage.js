import React, { useEffect } from 'react';
import { useSensor } from '../context/SensorContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:${color};border:3px solid #fff;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34],
  });
}

const detectedIcon = makeIcon('#ef4444');
const clearIcon    = makeIcon('#16a34a');

function MapController({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

export default function LivestockPage() {
  const { sensorData } = useSensor();
  const intrusion = sensorData.intrusion;

  // Single animal location (from GPS or fixed demo)
  const animalLat = 24.851;
  const animalLng = 67.011;
  const mapCenter = [animalLat, animalLng];

  const isDetected = intrusion.detected;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>🐄 Livestock Monitor</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
          Motion sensor-based animal detection · Real-time monitoring
        </p>
      </div>

      {/* Status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <div style={{
          background: '#1e293b', border: `1px solid ${isDetected ? '#ef444433' : '#16a34a33'}`,
          borderRadius: '12px', padding: '20px',
          boxShadow: isDetected ? '0 0 20px rgba(239,68,68,0.15)' : 'none'
        }}>
          <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{isDetected ? '🚨' : '✅'}</div>
          <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            Detection Status
          </div>
          <div style={{
            color: isDetected ? '#f87171' : '#4ade80',
            fontSize: '1.2rem', fontWeight: 700
          }}>
            {isDetected ? 'Animal Detected' : 'Area Clear'}
          </div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>📍</div>
          <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            Zone
          </div>
          <div style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700 }}>
            {intrusion.zone !== 'None' ? intrusion.zone : 'Farm Perimeter'}
          </div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>🐾</div>
          <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            Type
          </div>
          <div style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700 }}>
            {intrusion.type !== 'None' ? intrusion.type : 'Not Detected'}
          </div>
        </div>
      </div>

      {/* Main Content: Detection + Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Detection Panel */}
        <div style={{
          background: '#1e293b',
          border: `1px solid ${isDetected ? '#ef444433' : '#334155'}`,
          borderRadius: '12px', padding: '24px'
        }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '20px' }}>
            🔍 Animal Detection (PIR Motion Sensor)
          </h3>

          {/* Big status indicator */}
          <div style={{
            padding: '30px', background: '#0f172a', borderRadius: '12px', textAlign: 'center',
            border: `2px solid ${isDetected ? '#ef444444' : '#16a34a44'}`,
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '12px' }}>
              {isDetected ? '🐄' : '🌿'}
            </div>
            <div style={{
              fontSize: '1.3rem', fontWeight: 700,
              color: isDetected ? '#f87171' : '#4ade80'
            }}>
              {isDetected ? 'Animal Detected!' : 'No Animal Detected'}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '6px' }}>
              PIR Motion Sensor — GPIO 14
            </div>
          </div>

          {/* Detection details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px', background: '#0f172a', borderRadius: '8px'
            }}>
              <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Sensor Status</span>
              <span style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                background: 'rgba(22,163,74,0.15)', color: '#4ade80'
              }}>● Active</span>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px', background: '#0f172a', borderRadius: '8px'
            }}>
              <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Motion Signal</span>
              <span style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                background: isDetected ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)',
                color: isDetected ? '#f87171' : '#64748b'
              }}>{isDetected ? '🔴 HIGH' : '⚫ LOW'}</span>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px', background: '#0f172a', borderRadius: '8px'
            }}>
              <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Location</span>
              <span style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600 }}>
                {animalLat.toFixed(4)}, {animalLng.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Alert box when detected */}
          {isDetected && (
            <div style={{
              marginTop: '16px', padding: '14px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px'
            }}>
              <div style={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                ⚠️ Alert: Animal Detected!
              </div>
              <div style={{ color: '#f87171', fontSize: '0.78rem' }}>
                Motion detected at {intrusion.zone}. Check the area immediately.
              </div>
            </div>
          )}
        </div>

        {/* Live Map */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1rem' }}>🗺️</span>
            <span style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>Animal Location Map</span>
            <span style={{
              marginLeft: 'auto', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
              background: isDetected ? 'rgba(239,68,68,0.15)' : 'rgba(22,163,74,0.15)',
              color: isDetected ? '#f87171' : '#4ade80'
            }}>{isDetected ? '● DETECTED' : '● CLEAR'}</span>
          </div>
          <div style={{ height: '380px' }}>
            <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={mapCenter} />
              <Marker position={[animalLat, animalLng]} icon={isDetected ? detectedIcon : clearIcon}>
                <Popup>
                  <div style={{ minWidth: '140px' }}>
                    <strong>{isDetected ? '🐄 Animal Detected' : '✅ Area Clear'}</strong>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#555' }}>
                      PIR Sensor Location
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#555' }}>
                      {animalLat.toFixed(6)}, {animalLng.toFixed(6)}
                    </div>
                    <div style={{
                      fontSize: '0.8rem', marginTop: '4px', fontWeight: 700,
                      color: isDetected ? '#ef4444' : '#16a34a'
                    }}>
                      {isDetected ? '⚠️ Motion Detected' : '✓ No Motion'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid #334155', display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#16a34a' }} />
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Clear</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Animal Detected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Animal Detection section (renamed) */}
      <div style={{
        background: '#1e293b',
        border: `1px solid ${isDetected ? '#ef444433' : '#334155'}`,
        borderRadius: '12px', padding: '20px'
      }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>
          🐾 Animal Detection
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '14px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '6px' }}>Detection Status</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px',
              borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700,
              background: isDetected ? 'rgba(239,68,68,0.15)' : 'rgba(22,163,74,0.15)',
              color: isDetected ? '#f87171' : '#4ade80'
            }}>
              {isDetected ? '⚠️ Animal Detected' : '✓ Clear'}
            </div>
          </div>
          <div style={{ padding: '14px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '6px' }}>Zone</div>
            <div style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>
              {intrusion.zone !== 'None' ? intrusion.zone : 'Farm Perimeter'}
            </div>
          </div>
          <div style={{ padding: '14px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '6px' }}>Detected Type</div>
            <div style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>
              {intrusion.type !== 'None' ? intrusion.type : '—'}
            </div>
          </div>
          <div style={{ padding: '14px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '6px' }}>Sensor</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px',
              borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700,
              background: 'rgba(22,163,74,0.15)', color: '#4ade80'
            }}>
              📡 PIR Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
