import React from 'react';
import { useSensor } from '../context/SensorContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeTractorIcon(active) {
  const bg = active ? '#f97316' : '#64748b';
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${bg};border:3px solid #fff;border-radius:6px;
      width:34px;height:34px;display:flex;align-items:center;justify-content:center;
      font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.4);
    ">🚜</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -36],
  });
}

function MapController({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

function VehicleCard({ vehicle }) {
  const isActive = vehicle.status === 'Active';
  return (
    <div style={{
      background: '#1e293b', border: `1px solid ${isActive ? '#f9731633' : '#334155'}`,
      borderRadius: '12px', padding: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '10px', fontSize: '1.8rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isActive ? 'rgba(249,115,22,0.1)' : 'rgba(100,116,139,0.1)'
        }}>🚜</div>
        <div>
          <div style={{ color: '#f1f5f9', fontSize: '0.95rem', fontWeight: 700 }}>{vehicle.name}</div>
          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{vehicle.id}</div>
        </div>
        <span style={{
          marginLeft: 'auto', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
          background: isActive ? 'rgba(249,115,22,0.15)' : 'rgba(100,116,139,0.15)',
          color: isActive ? '#fb923c' : '#64748b'
        }}>{isActive ? '🟢 Active' : '⏸ Parked'}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[
          { icon: '⚡', label: 'Speed',     value: `${vehicle.speed} km/h` },
          { icon: '⛽', label: 'Fuel',      value: `${vehicle.fuel}%` },
          { icon: '📍', label: 'Latitude',  value: vehicle.lat?.toFixed(4) },
          { icon: '📍', label: 'Longitude', value: vehicle.lng?.toFixed(4) }
        ].map(item => (
          <div key={item.label} style={{ padding: '10px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '3px' }}>{item.icon} {item.label}</div>
            <div style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Fuel bar */}
      <div style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>⛽ Fuel Level</span>
          <span style={{ color: vehicle.fuel < 25 ? '#f87171' : '#e2e8f0', fontSize: '0.75rem', fontWeight: 600 }}>{vehicle.fuel}%</span>
        </div>
        <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${vehicle.fuel}%`, borderRadius: '3px',
            background: vehicle.fuel < 25 ? '#ef4444' : vehicle.fuel < 50 ? '#f59e0b' : '#f97316',
            transition: 'width 0.5s'
          }} />
        </div>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const { sensorData } = useSensor();
  const vehicles = sensorData.vehicles;

  const mapCenter = [
    vehicles.reduce((s, v) => s + v.lat, 0) / vehicles.length,
    vehicles.reduce((s, v) => s + v.lng, 0) / vehicles.length,
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>🚜 Vehicle Tracking</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Real-time GPS tracking of farm vehicles</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Vehicles', value: vehicles.length,                                    icon: '🚜', color: '#f97316' },
          { label: 'Active',         value: vehicles.filter(v => v.status === 'Active').length, icon: '🟢', color: '#16a34a' },
          { label: 'Parked',         value: vehicles.filter(v => v.status === 'Parked').length, icon: '⏸', color: '#64748b' },
          { label: 'Low Fuel',       value: vehicles.filter(v => v.fuel < 25).length,           icon: '⛽', color: '#ef4444' }
        ].map(stat => (
          <div key={stat.label} style={{ background: '#1e293b', border: `1px solid ${stat.color}22`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{stat.icon}</div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{stat.label}</div>
            <div style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Vehicle cards + Live Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
        </div>

        {/* Real Leaflet Map */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1rem' }}>🗺️</span>
            <span style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>Live GPS Map</span>
            <span style={{
              marginLeft: 'auto', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
              background: 'rgba(249,115,22,0.15)', color: '#fb923c'
            }}>● TRACKING</span>
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
              {vehicles.map(v => (
                <Marker
                  key={v.id}
                  position={[v.lat, v.lng]}
                  icon={makeTractorIcon(v.status === 'Active')}
                >
                  <Popup>
                    <div style={{ minWidth: '160px' }}>
                      <strong>🚜 {v.name}</strong>
                      <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#555' }}>ID: {v.id}</div>
                      <div style={{ fontSize: '0.8rem', color: '#555' }}>⚡ Speed: {v.speed} km/h</div>
                      <div style={{ fontSize: '0.8rem', color: '#555' }}>⛽ Fuel: {v.fuel}%</div>
                      <div style={{
                        fontSize: '0.8rem', marginTop: '4px', fontWeight: 700,
                        color: v.status === 'Active' ? '#f97316' : '#64748b'
                      }}>
                        {v.status === 'Active' ? '🟢 Active' : '⏸ Parked'}
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
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f97316' }} />
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Active</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#64748b' }} />
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Parked</span>
            </div>
            <span style={{ color: '#475569', fontSize: '0.72rem', marginLeft: 'auto' }}>
              © OpenStreetMap contributors
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
