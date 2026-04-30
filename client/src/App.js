import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SensorProvider } from './context/SensorContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import FieldMonitor from './pages/FieldMonitor';
import LivestockPage from './pages/LivestockPage';
import VehiclesPage from './pages/VehiclesPage';
import InventoryPage from './pages/InventoryPage';
import AlertsPage from './pages/AlertsPage';
import WeatherPage from './pages/WeatherPage';
import PestPage from './pages/PestPage';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0f172a' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🌱</div>
        <div style={{ color:'#16a34a', fontSize:'1.1rem' }}>Loading Smart Farm...</div>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <SensorProvider>
        <Router>
          <Routes>
            <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"  element={<Dashboard />} />
              <Route path="field"      element={<FieldMonitor />} />
              <Route path="livestock"  element={<LivestockPage />} />
              <Route path="vehicles"   element={<VehiclesPage />} />
              <Route path="inventory"  element={<InventoryPage />} />
              <Route path="alerts"     element={<AlertsPage />} />
              <Route path="weather"    element={<WeatherPage />} />
              <Route path="pest"       element={<PestPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </SensorProvider>
    </AuthProvider>
  );
}
