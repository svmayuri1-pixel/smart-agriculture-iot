/**
 * Smart Agriculture — ESP32 Field Sensor Node
 * 
 * Sensors connected:
 *   - Capacitive Soil Moisture Sensor → GPIO 34 (ADC)
 *   - DHT22 (Humidity) → GPIO 4
 *   - pH Sensor (analog) → GPIO 35
 *   - NPK Sensor (RS485) → GPIO 16 (RX2), 17 (TX2)
 * 
 * Publishes to MQTT topic: farm/sensors/field
 * 
 * Libraries needed (install via Arduino Library Manager):
 *   - PubSubClient  (MQTT)
 *   - DHT sensor library (Adafruit)
 *   - ArduinoJson
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ─── WiFi & MQTT Config ────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Use your own broker IP or mqtt://broker.hivemq.com (public, no auth)
const char* MQTT_BROKER   = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;
const char* MQTT_CLIENT   = "esp32-field-node-01";
const char* MQTT_TOPIC    = "farm/sensors/field";

// ─── Pin Definitions ───────────────────────────────────────────────────────
#define SOIL_MOISTURE_PIN  34   // Analog input
#define DHT_PIN            4    // DHT22 data pin
#define PH_PIN             35   // Analog input
#define DHT_TYPE           DHT22

// ─── Calibration values (adjust for your sensors) ─────────────────────────
// Soil moisture: measure raw ADC at dry (air) and wet (water) conditions
const int SOIL_DRY  = 3200;   // ADC value in dry air
const int SOIL_WET  = 1200;   // ADC value submerged in water

// pH: calibrate with pH 4.0 and pH 7.0 buffer solutions
const float PH_SLOPE     = -5.70;   // Adjust after calibration
const float PH_INTERCEPT = 21.34;   // Adjust after calibration

// ─── Publish interval ─────────────────────────────────────────────────────
const unsigned long PUBLISH_INTERVAL = 10000; // 10 seconds

// ─── Objects ──────────────────────────────────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqtt(wifiClient);
DHT          dht(DHT_PIN, DHT_TYPE);

unsigned long lastPublish = 0;

// ─── Setup ────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  dht.begin();

  connectWiFi();
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setBufferSize(512);
}

// ─── Main Loop ────────────────────────────────────────────────────────────
void loop() {
  if (!mqtt.connected()) reconnectMQTT();
  mqtt.loop();

  unsigned long now = millis();
  if (now - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = now;
    publishSensorData();
  }
}

// ─── Read & Publish ───────────────────────────────────────────────────────
void publishSensorData() {
  // Read soil moisture (convert ADC to %)
  int   rawSoil     = analogRead(SOIL_MOISTURE_PIN);
  float soilMoisture = map(rawSoil, SOIL_DRY, SOIL_WET, 0, 100);
  soilMoisture = constrain(soilMoisture, 0, 100);

  // Read DHT22
  float humidity    = dht.readHumidity();
  float temperature = dht.readTemperature();

  // Read pH
  int   rawPH = analogRead(PH_PIN);
  float voltage = rawPH * (3.3 / 4095.0);
  float ph = PH_SLOPE * voltage + PH_INTERCEPT;
  ph = constrain(ph, 0, 14);

  // Validate DHT readings
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("DHT22 read failed, skipping publish");
    return;
  }

  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["nodeId"]       = MQTT_CLIENT;
  doc["soilMoisture"] = round(soilMoisture * 10) / 10.0;
  doc["humidity"]     = round(humidity * 10) / 10.0;
  doc["temperature"]  = round(temperature * 10) / 10.0;
  doc["ph"]           = round(ph * 100) / 100.0;
  doc["timestamp"]    = millis();

  char payload[256];
  serializeJson(doc, payload);

  if (mqtt.publish(MQTT_TOPIC, payload, true)) {
    Serial.printf("Published: %s\n", payload);
  } else {
    Serial.println("Publish failed");
  }
}

// ─── WiFi Connection ──────────────────────────────────────────────────────
void connectWiFi() {
  Serial.printf("Connecting to WiFi: %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\nConnected! IP: %s\n", WiFi.localIP().toString().c_str());
}

// ─── MQTT Reconnect ───────────────────────────────────────────────────────
void reconnectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("Connecting to MQTT...");
    if (mqtt.connect(MQTT_CLIENT)) {
      Serial.println("connected");
    } else {
      Serial.printf("failed (rc=%d), retrying in 5s\n", mqtt.state());
      delay(5000);
    }
  }
}
