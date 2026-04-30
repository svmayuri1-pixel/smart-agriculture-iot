import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSensor } from '../context/SensorContext';

const navItems = [
  { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { path: '/field',     icon: '🌾', label: 'Field Monitor' },
  { path: '/weather',   icon: '🌤️', label: 'Weather' },
  { path: '/pest',      icon: '🐛', label: 'Pest Control' },
  { path: '/livestock', icon: '🐄', label: 'Livestock' },
  { path: '/vehicles',  icon: '🚜', label: 'Vehicles' },
  { path: '/inventory', icon: '📦', label: 'Inventory' },
  { path: '/alerts',    icon: '🔔', label: 'Alerts' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { connected }    = useSensor();
  const navigate         = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '240px' : '64px',
        background: '#0f172a',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>🌱</span>
          {sidebarOpen && (
            <div>
              <div style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>SmartFarm</div>
              <div style={{ color: '#64748b', fontSize: '0.7rem' }}>IoT Dashboard</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 10px',
                borderRadius: '8px',
                marginBottom: '4px',
                textDecoration: 'none',
                color: isActive ? '#16a34a' : '#94a3b8',
                background: isActive ? 'rgba(22,163,74,0.12)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.875rem',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              })}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Status */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #1e293b' }}>
          {/* Connection status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', marginBottom: '8px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: connected ? '#16a34a' : '#f59e0b',
              flexShrink: 0,
              boxShadow: connected ? '0 0 6px #16a34a' : '0 0 6px #f59e0b'
            }} />
            {sidebarOpen && <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{connected ? 'Live Connected' : 'Simulated'}</span>}
          </div>

          {/* User info */}
          {sidebarOpen && (
            <div style={{ padding: '8px 10px', background: '#1e293b', borderRadius: '8px', marginBottom: '8px' }}>
              <div style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 600 }}>{user?.name}</div>
              <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{user?.farm}</div>
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '8px 10px', background: 'transparent',
              border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8',
              cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center',
              gap: '8px', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.target.style.background = '#1e293b'; e.target.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#94a3b8'; }}
          >
            <span>🚪</span>{sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          height: '56px', background: '#0f172a', borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', flexShrink: 0
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
          >
            ☰
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{
            padding: '4px 10px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)',
            borderRadius: '20px', color: '#16a34a', fontSize: '0.75rem', fontWeight: 600
          }}>
            {user?.role?.toUpperCase()}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
