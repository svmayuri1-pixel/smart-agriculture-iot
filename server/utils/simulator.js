/**
 * Smart Agriculture — Data Manager
 * 
 * Real sensor data வந்தா → real data use பண்ணும்
 * Real sensor இல்லன்னா → simulated data use பண்ணும்
 */

// Store for real sensor data from ESP32
const realData = {
  field:     null,
  intrusion: null,
  vehicles:  {},
  livestock: {},
  inventory: {},
  cameras:   {}
};

// Update real data when MQTT message arrives
function updateRealData(type, data) {
  realData[type] = { ...data, isReal: true, lastUpdated: new Date().toISOString() };
}

function updateRealVehicle(id, data) {
  realData.vehicles[id] = { ...data, isReal: true };
}

function updateRealLivestock(id, data) {
  realData.livestock[id] = { ...data, isReal: true };
}

function updateRealCamera(id, data) {
  realData.cameras[id] = { ...data, isReal: true };
}

// ─── Simulator (fallback when no real sensors) ────────────────────────────
function rand(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function simulateSensorData() {
  // Use real field data if available, else simulate
  const field = realData.field ? {
    soilMoisture:  realData.field.soilMoisture,
    humidity:      realData.field.humidity,
    temperature:   realData.field.temperature || rand(18, 38),
    lightIntensity: rand(200, 1000),
    ph:            realData.field.ph || rand(5.5, 7.5),
    nitrogen:      rand(10, 60),
    phosphorus:    rand(5, 40),
    potassium:     rand(10, 50),
    isReal:        true
  } : {
    soilMoisture:  rand(20, 80),
    temperature:   rand(18, 38),
    humidity:      rand(40, 90),
    lightIntensity: rand(200, 1000),
    ph:            rand(5.5, 7.5),
    nitrogen:      rand(10, 60),
    phosphorus:    rand(5, 40),
    potassium:     rand(10, 50),
    isReal:        false
  };

  // Use real intrusion data if available
  const intrusion = realData.intrusion ? {
    detected:        realData.intrusion.detected,
    zone:            realData.intrusion.zone || 'Farm Perimeter',
    type:            realData.intrusion.type || 'Motion',
    deterrentActive: realData.intrusion.deterrentActive || false,
    isReal:          true
  } : {
    detected:        Math.random() > 0.85,
    zone:            ['North Field', 'South Field', 'East Boundary', 'West Boundary'][Math.floor(Math.random() * 4)],
    type:            ['Bird', 'Wild Animal', 'None'][Math.floor(Math.random() * 3)],
    deterrentActive: Math.random() > 0.9,
    isReal:          false
  };

  // Use real vehicles if available, else simulate
  const realVehicleList = Object.values(realData.vehicles);
  const vehicles = realVehicleList.length > 0 ? realVehicleList : [
    { id: 'TRACTOR-01', name: 'John Deere 5075E',    lat: rand(24.85, 24.87), lng: rand(67.05, 67.07), speed: rand(0, 25), fuel: rand(20, 100), status: 'Active',  isReal: false },
    { id: 'TRACTOR-02', name: 'Massey Ferguson 375', lat: rand(24.83, 24.85), lng: rand(67.03, 67.05), speed: 0,           fuel: rand(20, 100), status: 'Parked',  isReal: false }
  ];

  // Use real livestock if available, else simulate
  const realLivestockList = Object.values(realData.livestock);
  const livestock = realLivestockList.length > 0 ? realLivestockList : [
    { id: 'COW-001',  name: 'Bessie', heartRate: rand(50, 90),  temp: rand(37, 39.5), lat: rand(24.8, 24.9), lng: rand(67.0, 67.1), status: 'Healthy', isReal: false },
    { id: 'COW-002',  name: 'Daisy',  heartRate: rand(50, 90),  temp: rand(37, 39.5), lat: rand(24.8, 24.9), lng: rand(67.0, 67.1), status: Math.random() > 0.9 ? 'Alert' : 'Healthy', isReal: false },
    { id: 'COW-003',  name: 'Molly',  heartRate: rand(50, 90),  temp: rand(37, 39.5), lat: rand(24.8, 24.9), lng: rand(67.0, 67.1), status: 'Healthy', isReal: false },
    { id: 'GOAT-001', name: 'Billy',  heartRate: rand(70, 110), temp: rand(38, 40),   lat: rand(24.8, 24.9), lng: rand(67.0, 67.1), status: 'Healthy', isReal: false }
  ];

  return {
    timestamp: new Date().toISOString(),
    field,
    weather: {
      temperature: rand(15, 40),
      humidity:    rand(30, 95),
      windSpeed:   rand(0, 30),
      rainfall:    rand(0, 20),
      uvIndex:     rand(0, 11),
      condition:   ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Partly Cloudy'][Math.floor(Math.random() * 5)]
    },
    irrigation: {
      zone1:     Math.random() > 0.5,
      zone2:     Math.random() > 0.7,
      zone3:     Math.random() > 0.6,
      waterFlow: rand(0, 50),
      tankLevel: rand(20, 100)
    },
    pest: {
      detected:    Math.random() > 0.8,
      confidence:  rand(60, 99),
      type:        ['Aphids', 'Whitefly', 'Caterpillar', 'None'][Math.floor(Math.random() * 4)],
      sprayActive: Math.random() > 0.85
    },
    livestock,
    vehicles,
    intrusion,
    inventory: {
      fertilizer: rand(10, 100),
      seeds:      rand(10, 100),
      pesticide:  rand(10, 100),
      water:      rand(20, 100),
      fuel:       rand(10, 100)
    }
  };
}

module.exports = {
  simulateSensorData,
  updateRealData,
  updateRealVehicle,
  updateRealLivestock,
  updateRealCamera,
  realData
};
