import React, { useState } from 'react';
import { useSensor } from '../context/SensorContext';

const initialAlerts = [
  { id: 1, type: 'critical', category: 'Pest',       icon: '🐛', message: 'Aphids detected in North Field Zone 3 — confidence 94%', time: '10 min ago', read: false },
  { id: 2, type: 'critical', category: 'Livestock',  icon: '🐄', message: 'COW-002 (Daisy) temperature elevated: 39.1°C — vet check needed', time: '25 min ago', read: false },
  { id: 3, type: 'warning',  category: 'Inventory',  icon: '📦', message: 'Herbicide stock critical (30%) — reorder required', time: '1 hr ago', read: false },
  { id: 4, type: 'info',     category: 'Irrigation', icon: '💧', message: 'Zone 1 irrigation completed successfully. 450L used.', time: '2 hr ago', read: true },
  { id: 5, type: 'warning',  category: 'Intrusion',  icon: '🐦', message: 'Bird intrusion detected in South Field — deterrent activated', time: '3 hr ago', read: true },
  { id: 6, type: 'info',     category: 'Weather',    icon: '🌧️', message: 'Rain forecast tomorrow (80%) — irrigation schedule adjusted', time: '5 hr ago', read: true },
  { id: 7, type: 'warning',  category: 'Vehicle',    icon: '🚜', message: 'TRACTOR-02 fuel level low (25%) — refuel recommended', time: '6 hr ago', read: true },
  { id: 8, type: 'info',     category: 'System',     icon: '📡', message: 'All sensors online. MQTT connection established.', time: '8 hr ago', read: true }
];

const typeConfig = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', label: 'Critical' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', label: 'Warning' },
  info:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', label: 'Info' }
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filter, setFilter] = useState('all');
  const { sensorData } = useSensor();

  // Add live alerts from sensor data
  const liveAlerts = [];
  if (sensorData.pest.detected) liveAlerts.push({ id: 99, type: 'critical', category: 'Pest', icon: '🐛', message: `Live: ${sensorData.pest.type} detected — ${sensorData.pest.confidence}% confidence`, time: 'Just now', read: false });
  if (sensorData.intrusion.detected) liveAlerts.push({ id: 98, type: 'warning', category: 'Intrusion', icon: '🚨', message: `Live: ${sensorData.intrusion.type} intrusion in ${sensorData.intrusion.zone}`, time: 'Just now', read: false });

  const allAlerts = [...liveAlerts, ...alerts];
  const filtered = filter === 'all' ? allAlerts : filter === 'unread' ? allAlerts.filter(a => !a.read) : allAlerts.filter(a => a.type === filter);

  const markRead = (id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  const markAllRead = () => setAlerts(prev => prev.map(a => ({ ...a, read: true })));

  const unreadCount = allAlerts.filter(a => !a.read).length;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>🔔 Alerts & Notifications</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
            {unreadCount > 0 ? <span style={{ color: '#f87171' }}>{unreadCount} unread alerts</span> : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{
            padding: '8px 14px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)',
            borderRadius: '8px', color: '#4ade80', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
          }}>✓ Mark all read</button>
        )}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Total',    value: allAlerts.length,                              color: '#3b82f6', icon: '🔔' },
          { label: 'Critical', value: allAlerts.filter(a => a.type === 'critical').length, color: '#ef4444', icon: '🚨' },
          { label: 'Warnings', value: allAlerts.filter(a => a.type === 'warning').length,  color: '#f59e0b', icon: '⚠️' },
          { label: 'Unread',   value: unreadCount,                                   color: '#8b5cf6', icon: '📬' }
        ].map(stat => (
          <div key={stat.label} style={{ background: '#1e293b', border: `1px solid ${stat.color}22`, borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{stat.icon}</div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '3px' }}>{stat.label}</div>
            <div style={{ color: '#f1f5f9', fontSize: '1.3rem', fontWeight: 700 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { key: 'all',      label: 'All' },
          { key: 'unread',   label: 'Unread' },
          { key: 'critical', label: 'Critical' },
          { key: 'warning',  label: 'Warnings' },
          { key: 'info',     label: 'Info' }
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
            padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            background: filter === tab.key ? '#16a34a' : '#1e293b',
            color: filter === tab.key ? '#fff' : '#94a3b8',
            fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s'
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Alert list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✅</div>
            <div>No alerts in this category</div>
          </div>
        ) : filtered.map(alert => {
          const cfg = typeConfig[alert.type];
          return (
            <div key={alert.id} style={{
              background: alert.read ? '#1e293b' : cfg.bg,
              border: `1px solid ${alert.read ? '#334155' : cfg.border}`,
              borderRadius: '10px', padding: '14px 16px',
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              opacity: alert.read ? 0.7 : 1, transition: 'all 0.2s'
            }}>
              <div style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: '2px' }}>{alert.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    padding: '2px 7px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700,
                    background: `${cfg.color}22`, color: cfg.color
                  }}>{cfg.label}</span>
                  <span style={{
                    padding: '2px 7px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 600,
                    background: '#0f172a', color: '#64748b'
                  }}>{alert.category}</span>
                  {!alert.read && (
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                  )}
                </div>
                <div style={{ color: '#e2e8f0', fontSize: '0.875rem', lineHeight: 1.5 }}>{alert.message}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>🕐 {alert.time}</div>
              </div>
              {!alert.read && alert.id < 90 && (
                <button onClick={() => markRead(alert.id)} style={{
                  padding: '4px 10px', background: 'transparent', border: '1px solid #334155',
                  borderRadius: '6px', color: '#64748b', fontSize: '0.72rem', cursor: 'pointer', flexShrink: 0
                }}>Mark read</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
