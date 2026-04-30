import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SensorContext = createContext(null);

// Generate initial mock data
function mockData() {
  const r = (a, b, d = 1) => parseFloat((Math.random() * (b - a) + a).toFixed(d));
  return {
    timestamp: new Date().toISOString(),
    field: { soilMoisture: r(30, 70), temperature: r(20, 35), humidity: r(50, 80), ph: r(6, 7.2), nitrogen: r(20, 50), phosphorus: r(10, 30), potassium: r(15, 40), lightIntensity: r(300, 900) },
    weather: { temperature: r(22, 35), humidity: r(40, 80), windSpeed: r(5, 20), rainfall: r(0, 5), uvIndex: r(3, 9), condition: 'Partly Cloudy' },
    irrigation: { zone1: true, zone2: false, zone3: true, waterFlow: r(10, 40), tankLevel: r(50, 90) },
    pest: { detected: false, confidence: 0, type: 'None', sprayActive: false },
    livestock: [
      { id: 'COW-001', name: 'Bessie', heartRate: r(60, 80), temp: r(37.5, 38.5), lat: 24.851, lng: 67.011, status: 'Healthy' },
      { id: 'COW-002', name: 'Daisy',  heartRate: r(60, 80), temp: r(37.5, 38.5), lat: 24.853, lng: 67.013, status: 'Healthy' },
      { id: 'COW-003', name: 'Molly',  heartRate: r(60, 80), temp: r(37.5, 38.5), lat: 24.855, lng: 67.015, status: 'Healthy' },
      { id: 'GOAT-001', name: 'Billy', heartRate: r(80, 100), temp: r(38, 39.5), lat: 24.857, lng: 67.017, status: 'Healthy' }
    ],
    vehicles: [
      { id: 'TRACTOR-01', name: 'John Deere 5075E', lat: 24.860, lng: 67.020, speed: r(0, 20), fuel: r(50, 90), status: 'Active' },
      { id: 'TRACTOR-02', name: 'Massey Ferguson 375', lat: 24.845, lng: 67.005, speed: 0, fuel: r(30, 60), status: 'Parked' }
    ],
    intrusion: { detected: false, zone: 'None', type: 'None', deterrentActive: false },
    inventory: { fertilizer: 45, seeds: 80, pesticide: 60, water: 80, fuel: 40 }
  };
}

export function SensorProvider({ children }) {
  const [sensorData, setSensorData] = useState(mockData());
  const [connected, setConnected]   = useState(false);
  const [history, setHistory]       = useState([]);

  useEffect(() => {
    // Try to connect to real socket server
    const socket = io('/', { transports: ['websocket', 'polling'] });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('sensor_update', (data) => {
      setSensorData(data);
      setHistory(prev => [...prev.slice(-23), {
        time: new Date(data.timestamp).toLocaleTimeString(),
        soilMoisture: data.field.soilMoisture,
        temperature: data.field.temperature,
        humidity: data.field.humidity
      }]);
    });

    // Fallback: simulate locally if server not available
    const fallback = setInterval(() => {
      if (!socket.connected) {
        const d = mockData();
        setSensorData(d);
        setHistory(prev => [...prev.slice(-23), {
          time: new Date().toLocaleTimeString(),
          soilMoisture: d.field.soilMoisture,
          temperature: d.field.temperature,
          humidity: d.field.humidity
        }]);
      }
    }, 5000);

    return () => { socket.disconnect(); clearInterval(fallback); };
  }, []);

  return (
    <SensorContext.Provider value={{ sensorData, connected, history }}>
      {children}
    </SensorContext.Provider>
  );
}

export const useSensor = () => useContext(SensorContext);
