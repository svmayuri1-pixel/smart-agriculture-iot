import React from 'react';
import { useSensor } from '../context/SensorContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const inventoryItems = [
  { id: 1, name: 'Fertilizer (NPK)',  unit: 'kg',  quantity: 450, capacity: 1000, icon: '🌿', color: '#16a34a' },
  { id: 2, name: 'Seeds (Wheat)',     unit: 'kg',  quantity: 800, capacity: 1000, icon: '🌾', color: '#3b82f6' },
  { id: 3, name: 'Pesticide',         unit: 'L',   quantity: 120, capacity: 200,  icon: '🧪', color: '#f59e0b' },
  { id: 4, name: 'Water Tank',        unit: 'L',   quantity: 8000, capacity: 10000, icon: '💧', color: '#06b6d4' },
  { id: 5, name: 'Diesel Fuel',       unit: 'L',   quantity: 200, capacity: 500,  icon: '⛽', color: '#f97316' },
  { id: 6, name: 'Herbicide',         unit: 'L',   quantity: 30,  capacity: 100,  icon: '🌱', color: '#8b5cf6' }
];

function getStatus(level) {
  if (level < 30) return { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
  if (level < 50) return { label: 'Low',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  return { label: 'Good', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' };
}

export default function InventoryPage() {
  const { sensorData } = useSensor();

  const items = inventoryItems.map(item => ({
    ...item,
    level: Math.round((item.quantity / item.capacity) * 100)
  }));

  const criticalCount = items.filter(i => i.level < 30).length;
  const lowCount      = items.filter(i => i.level >= 30 && i.level < 50).length;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>📦 Inventory Monitor</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
            Smart storage tracking · {criticalCount > 0 && <span style={{ color: '#f87171' }}>{criticalCount} critical · </span>}
            {lowCount > 0 && <span style={{ color: '#fbbf24' }}>{lowCount} low</span>}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Items',  value: items.length,                                    icon: '📦', color: '#3b82f6' },
          { label: 'Good Stock',   value: items.filter(i => i.level >= 50).length,         icon: '✅', color: '#16a34a' },
          { label: 'Low Stock',    value: lowCount,                                         icon: '⚠️', color: '#f59e0b' },
          { label: 'Critical',     value: criticalCount,                                    icon: '🚨', color: '#ef4444' }
        ].map(stat => (
          <div key={stat.label} style={{ background: '#1e293b', border: `1px solid ${stat.color}22`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{stat.icon}</div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{stat.label}</div>
            <div style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Inventory cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {items.map(item => {
          const status = getStatus(item.level);
          return (
            <div key={item.id} style={{
              background: '#1e293b', border: `1px solid ${status.color}22`,
              borderRadius: '12px', padding: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', fontSize: '1.4rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${item.color}15`
                }}>{item.icon}</div>
                <div>
                  <div style={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{item.quantity.toLocaleString()} / {item.capacity.toLocaleString()} {item.unit}</div>
                </div>
                <span style={{
                  marginLeft: 'auto', padding: '3px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                  background: status.bg, color: status.color
                }}>{status.label}</span>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Stock Level</span>
                  <span style={{ color: status.color, fontSize: '0.75rem', fontWeight: 700 }}>{item.level}%</span>
                </div>
                <div style={{ height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${item.level}%`, borderRadius: '4px',
                    background: status.color, transition: 'width 0.5s'
                  }} />
                </div>
              </div>

              {item.level < 50 && (
                <div style={{
                  padding: '8px 10px', background: `${status.color}10`, borderRadius: '6px',
                  color: status.color, fontSize: '0.75rem', marginTop: '10px'
                }}>
                  {item.level < 30 ? '🚨 Reorder immediately' : '⚠️ Consider restocking soon'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>📊 Stock Level Overview</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={items.map(i => ({ name: i.name.split(' ')[0], level: i.level, color: getStatus(i.level).color }))}>
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
              formatter={(v) => [`${v}%`, 'Stock Level']}
            />
            <Bar dataKey="level" radius={[4, 4, 0, 0]}>
              {items.map((item, i) => (
                <Cell key={i} fill={getStatus(item.level).color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
