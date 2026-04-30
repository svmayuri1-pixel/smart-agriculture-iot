import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '', farm: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.farm);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: '#0f172a',
    border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #0d2818 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>🌱</div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 800, marginBottom: '4px' }}>Join SmartFarm</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Create your farm management account</p>
        </div>

        <div style={{
          background: 'rgba(30,41,59,0.8)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(51,65,85,0.8)', borderRadius: '16px', padding: '28px'
        }}>
          <h2 style={{ color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Create Account</h2>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#fca5a5', fontSize: '0.85rem'
            }}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit}>
            {[
              { label: 'Full Name', name: 'name', type: 'text', placeholder: 'John Farmer' },
              { label: 'Email Address', name: 'email', type: 'email', placeholder: 'you@smartfarm.com' },
              { label: 'Farm Name', name: 'farm', type: 'text', placeholder: 'Green Valley Farm' },
              { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'Confirm Password', name: 'confirm', type: 'password', placeholder: '••••••••' }
            ].map(field => (
              <div key={field.name} style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, marginBottom: '5px' }}>
                  {field.label}
                </label>
                <input
                  type={field.type} name={field.name} value={form[field.name]}
                  onChange={handleChange} placeholder={field.placeholder}
                  required={field.name !== 'farm'}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#16a34a'}
                  onBlur={e => e.target.style.borderColor = '#334155'}
                />
              </div>
            ))}

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px', background: loading ? '#166534' : '#16a34a',
                border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.95rem',
                fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {loading ? 'Creating account...' : '🌱 Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '18px', color: '#64748b', fontSize: '0.85rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
