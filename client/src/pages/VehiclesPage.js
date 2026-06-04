import React from 'react';
import { useSensor } from '../context/SensorContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeTractorIcon(active, lowFuel) {
  const bg = lowFuel ? '#ef4444' : active ? '#f97316' : '#64748b';
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${bg};border:3px solid #fff;border-radius:6px;
      width:34px;height:34px;display:flex;align-items:center;justify-content:center;
      font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.4);
    ">🚜</div>`,
    iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -36],
  });
}

function MapController({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

export default function VehiclesPage() {
  const { sensorData } = useSensor();

  // Single vehicle only
  const vehicle = sensorData.vehicles[0] || {
    id: 'TRACTOR-01', name: 'Farm Tractor',
    lat: 24.860, lng: 67.020,
    speed: 0, fuel: 20, status: 'Parked'
  };

  const isActive  = vehicle.status === 'Active';
  const isLowFuel = vehicle.fuel < 30;
  const mapCenter = [vehicle.lat, vehicle.lng];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>🚜 Vehicle Tracking</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Real-time GPS tracking</p>
      </div>

      {/* Low fuel alert */}
      {isLowFuel && (
        <div style={{
          padding: '14px 18px', background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px',
          marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span style={{ fontSize: '1.4rem' }}>⛽</span>
          <div>
            <div style={{ color: '#f87171', fontSize: '0.9rem', fontWeight: 700 }}>
              Low Fuel Warning — {vehicle.fuel}%
            </div>
            <div style={{ color: '#fca5a5', fontSize: '0.78rem' }}>
              {vehicle.name} fuel level is critically low. Refuel immediately!
            </div>
          </div>
        </div>
      )}

      {/* Vehicle card + Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
        {/* Vehicle Info Card */}
        <div style={{
          background: '#1e293b',
          border: `1px solid ${isLowFuel ? '#ef444433' : isActive ? '#f9731633' : '#334155'}`,
          borderRadius: '12px', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '12px', fontSize: '2rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isLowFuel ? 'rgba(239,68,68,0.1)' : isActive ? 'rgba(249,115,22,0.1)' : 'rgba(100,116,139,0.1)'
            }}>🚜</div>
            <div>
              <div style={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 700 }}>{vehicle.name}</div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{vehicle.id}</div>
            </div>
            <span style={{
              marginLeft: 'auto', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
              background: isActive ? 'rgba(249,115,22,0.15)' : 'rgba(100,116,139,0.15)',
              color: isActive ? '#fb923c' : '#64748b'
            }}>{isActive ? '🟢 Active' : '⏸ Parked'}</span>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { icon: '⚡', label: 'Speed',     value: `${vehicle.speed} km/h` },
              { icon: '📍', label: 'Latitude',  value: vehicle.lat?.toFixed(4) },
              { icon: '📍', label: 'Longitude', value: vehicle.lng?.toFixed(4) },
              { icon: '📡', label: 'GPS',       value: 'Connected' }
            ].map(item => (
              <div key={item.label} style={{ padding: '10px', background: '#0f172a', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '3px' }}>{item.icon} {item.label}</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.88rem', fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Fuel bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>⛽ Fuel Level</span>
              <span style={{
                color: isLowFuel ? '#f87171' : '#4ade80',
                fontSize: '0.8rem', fontWeight: 700
              }}>{vehicle.fuel}%</span>
            </div>
            <div style={{ height: '10px', background: '#0f172a', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '5px', transition: 'width 0.5s',
                width: `${vehicle.fuel}%`,
                background: isLowFuel
                  ? 'linear-gradient(90deg, #ef4444, #f97316)'
                  : 'linear-gradient(90deg, #f97316, #fbbf24)'
              }} />
            </div>
            {isLowFuel && (
              <div style={{ color: '#f87171', fontSize: '0.72rem', marginTop: '4px' }}>
                ⚠️ Critical — Refuel required
              </div>
            )}
          </div>

          {/* Status */}
          <div style={{
            padding: '12px', background: '#0f172a', borderRadius: '8px',
            textAlign: 'center',
            border: `1px solid ${isLowFuel ? '#ef444433' : '#334155'}`
          }}>
            <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: '4px' }}>VEHICLE STATUS</div>
            <div style={{
              color: isLowFuel ? '#f87171' : isActive ? '#fb923c' : '#64748b',
              fontSize: '1rem', fontWeight: 700
            }}>
              {isLowFuel ? '🚨 Low Fuel' : isActive ? '🟢 On Route' : '⏸ Parked'}
            </div>
          </div>
        </div>

        {/* Live Map */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1rem' }}>🗺️</span>
            <span style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>Live GPS Map</span>
            <span style={{
              marginLeft: 'auto', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
              background: isLowFuel ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)',
              color: isLowFuel ? '#f87171' : '#fb923c'
            }}>● {isLowFuel ? 'LOW FUEL' : 'TRACKING'}</span>
          </div>

          <div style={{ height: '420px' }}>
            <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={mapCenter} />
              <Marker
                position={[vehicle.lat, vehicle.lng]}
                icon={makeTractorIcon(isActive, isLowFuel)}
              >
                <Popup>
                  <div style={{ minWidth: '160px' }}>
                    <strong>🚜 {vehicle.name}</strong>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#555' }}>ID: {vehicle.id}</div>
                    <div style={{ fontSize: '0.8rem', color: '#555' }}>⚡ Speed: {vehicle.speed} km/h</div>
                    <div style={{
                      fontSize: '0.8rem', color: isLowFuel ? '#ef4444' : '#555', fontWeight: isLowFuel ? 700 : 400
                    }}>⛽ Fuel: {vehicle.fuel}% {isLowFuel ? '⚠️ LOW!' : ''}</div>
                    <div style={{
                      fontSize: '0.8rem', marginTop: '4px', fontWeight: 700,
                      color: isLowFuel ? '#ef4444' : isActive ? '#f97316' : '#64748b'
                    }}>
                      {isLowFuel ? '🚨 Low Fuel' : isActive ? '🟢 Active' : '⏸ Parked'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          <div style={{ padding: '10px 16px', borderTop: '1px solid #334155', display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f97316' }} />
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Active</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }} />
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Low Fuel</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#64748b' }} />
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Parked</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
