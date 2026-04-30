/**
 * Smart Agriculture — ESP32 Livestock GPS Collar
 * 
 * Hardware:
 *   - ESP32 DevKit
 *   - NEO-6M GPS Module → GPIO 16 (RX2), 17 (TX2)
 *   - MAX30102 Heart Rate Sensor → I2C (SDA=21, SCL=22)
 *   - SIM800L (optional, for cellular) → GPIO 26 (RX), 27 (TX)
 * 
 * Publishes to MQTT topic: farm/livestock/<animalId>
 * 
 * Libraries needed:
 *   - TinyGPS++
 *   - PubSubClient
 *   - ArduinoJson
 *   - MAX30105 (SparkFun)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <TinyGPS++.h>
#include <ArduinoJson.h>
#include <HardwareSerial.h>

// ─── Config ───────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_BROKER   = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;

// Unique ID for this collar — change per animal
const char* ANIMAL_ID     = "COW-001";
const char* ANIMAL_NAME   = "Bessie";
const char* ANIMAL_TYPE   = "Cow";

char MQTT_TOPIC[64];  // farm/livestock/COW-001

// ─── Pin Definitions ──────────────────────────────────────────────────────
#define GPS_RX_PIN  16
#define GPS_TX_PIN  17
#define GPS_BAUD    9600

// ─── Objects ──────────────────────────────────────────────────────────────
WiFiClient    wifiClient;
PubSubClient  mqtt(wifiClient);
TinyGPSPlus   gps;
HardwareSerial gpsSerial(2);  // UART2

unsigned long lastPublish = 0;
const unsigned long PUBLISH_INTERVAL = 15000; // 15 seconds

// Simulated heart rate (replace with MAX30102 library readings)
int getHeartRate() {
  // TODO: Replace with actual MAX30102 reading
  // #include "MAX30105.h"
  // #include "heartRate.h"
  return random(55, 85);
}

// ─── Setup ────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  snprintf(MQTT_TOPIC, sizeof(MQTT_TOPIC), "farm/livestock/%s", ANIMAL_ID);

  connectWiFi();
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setBufferSize(512);

  Serial.printf("Livestock collar started: %s (%s)\n", ANIMAL_NAME, ANIMAL_ID);
}

// ─── Main Loop ────────────────────────────────────────────────────────────
void loop() {
  // Feed GPS data
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  if (!mqtt.connected()) reconnectMQTT();
  mqtt.loop();

  unsigned long now = millis();
  if (now - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = now;
    publishAnimalData();
  }
}

// ─── Publish ──────────────────────────────────────────────────────────────
void publishAnimalData() {
  StaticJsonDocument<256> doc;
  doc["id"]        = ANIMAL_ID;
  doc["name"]      = ANIMAL_NAME;
  doc["type"]      = ANIMAL_TYPE;
  doc["heartRate"] = getHeartRate();
  doc["status"]    = "Healthy";

  if (gps.location.isValid() && gps.location.age() < 5000) {
    doc["lat"] = gps.location.lat();
    doc["lng"] = gps.location.lng();
    doc["gpsValid"] = true;
    Serial.printf("GPS: %.6f, %.6f\n", gps.location.lat(), gps.location.lng());
  } else {
    // GPS not yet locked — send last known or skip
    doc["gpsValid"] = false;
    Serial.println("Waiting for GPS fix...");
  }

  doc["timestamp"] = millis();

  char payload[256];
  serializeJson(doc, payload);

  if (mqtt.publish(MQTT_TOPIC, payload, true)) {
    Serial.printf("Published livestock data: %s\n", payload);
  }
}

// ─── WiFi & MQTT ──────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.printf("Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.printf("\nConnected! IP: %s\n", WiFi.localIP().toString().c_str());
}

void reconnectMQTT() {
  char clientId[32];
  snprintf(clientId, sizeof(clientId), "collar-%s", ANIMAL_ID);
  while (!mqtt.connected()) {
    Serial.print("MQTT connecting...");
    if (mqtt.connect(clientId)) {
      Serial.println("connected");
    } else {
      Serial.printf("failed rc=%d, retry in 5s\n", mqtt.state());
      delay(5000);
    }
  }
}
