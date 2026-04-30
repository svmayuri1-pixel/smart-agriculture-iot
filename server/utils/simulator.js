// Simulates real-time IoT sensor data for demo purposes

function rand(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function simulateSensorData() {
  return {
    timestamp: new Date().toISOString(),

    // Crop / Field sensors
    field: {
      soilMoisture: rand(20, 80),       // %
      temperature: rand(18, 38),         // °C
      humidity: rand(40, 90),            // %
      lightIntensity: rand(200, 1000),   // lux
      ph: rand(5.5, 7.5),
      nitrogen: rand(10, 60),            // mg/kg
      phosphorus: rand(5, 40),
      potassium: rand(10, 50)
    },

    // Weather
    weather: {
      temperature: rand(15, 40),
      humidity: rand(30, 95),
      windSpeed: rand(0, 30),            // km/h
      rainfall: rand(0, 20),             // mm
      uvIndex: rand(0, 11),
      condition: ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Partly Cloudy'][Math.floor(Math.random() * 5)]
    },

    // Irrigation
    irrigation: {
      zone1: Math.random() > 0.5,
      zone2: Math.random() > 0.7,
      zone3: Math.random() > 0.6,
      waterFlow: rand(0, 50),            // L/min
      tankLevel: rand(20, 100)           // %
    },

    // Pest detection
    pest: {
      detected: Math.random() > 0.8,
      confidence: rand(60, 99),
      type: ['Aphids', 'Whitefly', 'Caterpillar', 'None'][Math.floor(Math.random() * 4)],
      sprayActive: Math.random() > 0.85
    },

    // Livestock
    livestock: [
      { id: 'COW-001', name: 'Bessie', heartRate: rand(50, 90), temp: rand(37, 39.5), lat: rand(24.8, 24.9), lng: rand(67.0, 67.1), status: 'Healthy' },
      { id: 'COW-002', name: 'Daisy',  heartRate: rand(50, 90), temp: rand(37, 39.5), lat: rand(24.8, 24.9), lng: rand(67.0, 67.1), status: Math.random() > 0.9 ? 'Alert' : 'Healthy' },
      { id: 'COW-003', name: 'Molly',  heartRate: rand(50, 90), temp: rand(37, 39.5), lat: rand(24.8, 24.9), lng: rand(67.0, 67.1), status: 'Healthy' },
      { id: 'GOAT-001', name: 'Billy', heartRate: rand(70, 110), temp: rand(38, 40), lat: rand(24.8, 24.9), lng: rand(67.0, 67.1), status: 'Healthy' }
    ],

    // Vehicles
    vehicles: [
      { id: 'TRACTOR-01', name: 'John Deere 5075E', lat: rand(24.85, 24.87), lng: rand(67.05, 67.07), speed: rand(0, 25), fuel: rand(20, 100), status: 'Active' },
      { id: 'TRACTOR-02', name: 'Massey Ferguson 375', lat: rand(24.83, 24.85), lng: rand(67.03, 67.05), speed: 0, fuel: rand(20, 100), status: 'Parked' }
    ],

    // Bird/Animal intrusion
    intrusion: {
      detected: Math.random() > 0.85,
      zone: ['North Field', 'South Field', 'East Boundary', 'West Boundary'][Math.floor(Math.random() * 4)],
      type: ['Bird', 'Wild Animal', 'None'][Math.floor(Math.random() * 3)],
      deterrentActive: Math.random() > 0.9
    },

    // Inventory
    inventory: {
      fertilizer: rand(10, 100),   // %
      seeds: rand(10, 100),
      pesticide: rand(10, 100),
      water: rand(20, 100),
      fuel: rand(10, 100)
    }
  };
}

module.exports = { simulateSensorData };
