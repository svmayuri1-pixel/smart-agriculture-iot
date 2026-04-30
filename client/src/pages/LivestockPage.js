import React, { useEffect } from 'react';
import { useSensor } from '../context/SensorContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored marker icons
function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:${color};border:3px solid #fff;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

const healthyIcon = makeIcon('#16a34a');
const alertIcon   = makeIcon('#ef4444');

// Recenter map when animals update
function MapController({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

function AnimalCard({ animal }) {
  const isAlert = animal.status === 'Alert' || animal.heartRate > 100;
  return (
    <div style={{
      background: '#1e293b', border: `1px solid ${isAlert ? '#ef444433' : '#334155'}`,
      borderRadius: '12px', padding: '20px', transition: 'all 0.2s',
      boxShadow: isAlert ? '0 0 20px rgba(239,68,68,0.1)' : 'none'
    }}>
      {isAlert && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '6px', padding: '6px 10px', marginBottom: '12px',
          color: '#fca5a5', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          ⚠️ Health alert — veterinary check recommended
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%', fontSize: '1.8rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isAlert ? 'rgba(239,68,68,0.1)' : 'rgba(22,163,74,0.1)'
        }}>
          {animal.id.startsWith('COW') ? '🐄' : animal.id.startsWith('GOAT') ? '🐐' : '🐑'}
        </div>
        <div>
          <div style={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 700 }}>{animal.name}</div>
          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{animal.id}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{
            padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
            background: isAlert ? 'rgba(239,68,68,0.15)' : 'rgba(22,163,74,0.15)',
            color: isAlert ? '#f87171' : '#4ade80'
          }}>{isAlert ? '⚠️ Alert' : '✓ Healthy'}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[
          { icon: '❤️', label: 'Heart Rate', value: `${animal.heartRate} bpm`, alert: animal.heartRate > 100 || animal.heartRate < 50 },
          { icon: '📍', label: 'GPS',        value: `${animal.lat?.toFixed(3)}, ${animal.lng?.toFixed(3)}`, alert: false },
        ].map(item => (
          <div key={item.label} style={{ padding: '10px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '3px' }}>{item.icon} {item.label}</div>
            <div style={{ color: item.alert ? '#f87171' : '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LivestockPage() {
  const { sensorData } = useSensor();
  const animals    = sensorData.livestock;
  const alertCount = animals.filter(a => a.status === 'Alert' || a.heartRate > 100).length;

  const mapCenter = [
    animals.reduce((s, a) => s + a.lat, 0) / animals.length,
    animals.reduce((s, a) => s + a.lng, 0) / animals.length,
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>🐄 Livestock Monitor</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
            {animals.length} animals tracked ·{' '}
            {alertCount > 0
              ? <span style={{ color: '#f87171' }}>{alertCount} alert{alertCount > 1 ? 's' : ''}</span>
              : <span style={{ color: '#4ade80' }}>All healthy</span>}
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Animals', value: animals.length,                                          icon: '🐄', color: '#16a34a' },
          { label: 'Healthy',       value: animals.filter(a => a.status !== 'Alert').length,        icon: '✅', color: '#16a34a' },
          { label: 'Alerts',        value: alertCount, icon: '⚠️', color: alertCount > 0 ? '#ef4444' : '#16a34a' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#1e293b', border: `1px solid ${stat.color}22`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{stat.icon}</div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{stat.label}</div>
            <div style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Animal cards + Live Map side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {animals.map(animal => <AnimalCard key={animal.id} animal={animal} />)}
        </div>

        {/* Live Leaflet Map */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1rem' }}>📍</span>
            <span style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>Live Animal GPS Map</span>
            <span style={{
              marginLeft: 'auto', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
              background: 'rgba(22,163,74,0.15)', color: '#4ade80'
            }}>● LIVE</span>
          </div>
          <div style={{ height: '420px' }}>
            <MapContainer
              center={mapCenter}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={mapCenter} />
              {animals.map(animal => (
                <Marker
                  key={animal.id}
                  position={[animal.lat, animal.lng]}
                  icon={animal.status === 'Alert' || animal.heartRate > 100 ? alertIcon : healthyIcon}
                >
                  <Popup>
                    <div style={{ minWidth: '140px' }}>
                      <strong>{animal.id.startsWith('COW') ? '🐄' : '🐐'} {animal.name}</strong>
                      <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#555' }}>ID: {animal.id}</div>
                      <div style={{ fontSize: '0.8rem', color: '#555' }}>❤️ {animal.heartRate} bpm</div>
                      <div style={{ fontSize: '0.8rem', marginTop: '4px',
                        color: animal.status === 'Alert' ? '#ef4444' : '#16a34a', fontWeight: 700
                      }}>
                        {animal.status === 'Alert' ? '⚠️ Alert' : '✓ Healthy'}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          {/* Legend */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #334155', display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#16a34a' }} />
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Healthy</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Alert</span>
            </div>
          </div>
        </div>
      </div>

      {/* Intrusion detection */}
      <div style={{
        background: '#1e293b', border: `1px solid ${sensorData.intrusion.detected ? '#ef444433' : '#334155'}`,
        borderRadius: '12px', padding: '20px'
      }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>🐦 Animal & Bird Intrusion Detection</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '14px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '6px' }}>Detection Status</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px',
              borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700,
              background: sensorData.intrusion.detected ? 'rgba(239,68,68,0.15)' : 'rgba(22,163,74,0.15)',
              color: sensorData.intrusion.detected ? '#f87171' : '#4ade80'
            }}>
              {sensorData.intrusion.detected ? '⚠️ Intrusion Detected' : '✓ Clear'}
            </div>
          </div>
          <div style={{ padding: '14px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '6px' }}>Zone</div>
            <div style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>{sensorData.intrusion.zone}</div>
          </div>
          <div style={{ padding: '14px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '6px' }}>Type Detected</div>
            <div style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>{sensorData.intrusion.type}</div>
          </div>
          <div style={{ padding: '14px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '6px' }}>Deterrent System</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px',
              borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700,
              background: sensorData.intrusion.deterrentActive ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)',
              color: sensorData.intrusion.deterrentActive ? '#fbbf24' : '#64748b'
            }}>
              {sensorData.intrusion.deterrentActive ? '🔊 Active' : '⏸ Standby'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
