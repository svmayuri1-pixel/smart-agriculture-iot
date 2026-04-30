import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'admin@smartfarm.com', password: 'farm1234' });
    else setForm({ email: 'john@smartfarm.com', password: 'john1234' });
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #0d2818 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {['🌾', '🌿', '🍃', '🌱', '🌻', '🌽'].map((emoji, i) => (
          <div key={i} style={{
            position: 'absolute', fontSize: `${1.5 + i * 0.3}rem`, opacity: 0.06,
            top: `${10 + i * 15}%`, left: `${5 + i * 15}%`,
            transform: `rotate(${i * 30}deg)`
          }}>{emoji}</div>
        ))}
        <div style={{
          position: 'absolute', top: '-200px', right: '-200px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)'
        }} />
        <div style={{
          position: 'absolute', bottom: '-200px', left: '-200px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22,163,74,0.06) 0%, transparent 70%)'
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '12px' }}>🌱</div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
            Smart Agriculture
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>IoT Monitoring & Control Platform</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(30,41,59,0.8)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(51,65,85,0.8)', borderRadius: '16px', padding: '32px'
        }}>
          <h2 style={{ color: '#e2e8f0', fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>
            Sign in to your farm
          </h2>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
              color: '#fca5a5', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="you@smartfarm.com" required
                style={{
                  width: '100%', padding: '10px 14px', background: '#0f172a',
                  border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0',
                  fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#334155'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password" name="password" value={form.password} onChange={handleChange}
                placeholder="••••••••" required
                style={{
                  width: '100%', padding: '10px 14px', background: '#0f172a',
                  border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0',
                  fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#334155'}
              />
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px', background: loading ? '#166534' : '#16a34a',
                border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.95rem',
                fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {loading ? <><span className="spinner" style={{ display:'inline-block', width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%' }} /> Signing in...</> : '🔐 Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: '8px' }}>
            <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 600 }}>DEMO ACCOUNTS</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => fillDemo('admin')} style={{
                flex: 1, padding: '6px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)',
                borderRadius: '6px', color: '#4ade80', fontSize: '0.75rem', cursor: 'pointer'
              }}>👑 Admin</button>
              <button onClick={() => fillDemo('farmer')} style={{
                flex: 1, padding: '6px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '6px', color: '#60a5fa', fontSize: '0.75rem', cursor: 'pointer'
              }}>🌾 Farmer</button>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', color: '#64748b', fontSize: '0.85rem' }}>
            New to SmartFarm?{' '}
            <Link to="/register" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>
              Create account
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#334155', fontSize: '0.75rem' }}>
          🔒 Secured with JWT Authentication
        </p>
      </div>
    </div>
  );
}
