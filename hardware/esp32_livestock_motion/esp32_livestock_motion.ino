/**
 * ═══════════════════════════════════════════════════
 *   Smart Agriculture — ESP32 Livestock Motion Sensor
 * ═══════════════════════════════════════════════════
 *
 * HARDWARE:
 *   PIR Motion Sensor (HC-SR501)
 *   PIR VCC  → ESP32 5V (Vin)
 *   PIR GND  → ESP32 GND
 *   PIR OUT  → ESP32 GPIO 14
 *
 * WHAT IT DOES:
 *   - Motion detect ஆனா → MQTT publish பண்ணும்
 *   - Dashboard Livestock page-ல live update ஆகும்
 *   - Alert trigger ஆகும்
 *
 * LIBRARIES:
 *   ✅ PubSubClient  by Nick O'Leary
 *   ✅ ArduinoJson   by Benoit Blanchon
 *
 * BOARD: ESP32 Dev Module
 * ═══════════════════════════════════════════════════
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ╔══════════════════════════════════════╗
// ║   ⚙️  CONFIG — இங்க மட்டும் மாத்துங்க ║
// ╚══════════════════════════════════════╝
const char* WIFI_SSID     = "YOUR_WIFI_SSID";      // ← உங்க WiFi
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";  // ← உங்க Password
const char* MQTT_BROKER   = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;

// Zone name — Dashboard-ல தெரியும்
const char* ZONE_NAME     = "Livestock Area";
const char* SENSOR_ID     = "PIR-LIVESTOCK-01";

// ╔══════════════════════════════════════╗
// ║   📌 PIN                             ║
// ╚══════════════════════════════════════╝
#define PIR_PIN        14   // PIR OUT → GPIO 14
#define LED_PIN         2   // Onboard LED (motion indicator)

// ╔══════════════════════════════════════╗
// ║   ⏱️  TIMING                         ║
// ╚══════════════════════════════════════╝
const unsigned long DEBOUNCE_TIME    = 500;   // 0.5s debounce (reduced)
const unsigned long CLEAR_TIMEOUT   = 5000;  // 5s no motion → clear
const unsigned long PUBLISH_INTERVAL = 2000; // Publish every 2s

// ════════════════════════════════════════
WiFiClient   wifiClient;
PubSubClient mqtt(wifiClient);

bool     motionDetected   = false;
bool     lastMotionState  = false;
unsigned long lastMotionTime  = 0;
unsigned long lastPublish     = 0;
int      motionCount          = 0;  // Total detections this session

// ════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  Serial.println("\n🐄 Livestock Motion Sensor Starting...");

  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // PIR warmup — 5 seconds only (sensor warms up fast after first use)
  Serial.println("⏳ PIR sensor warming up (5 seconds)...");
  for (int i = 5; i > 0; i--) {
    Serial.printf("   %d...\n", i);
    digitalWrite(LED_PIN, i % 2);
    delay(1000);
  }
  digitalWrite(LED_PIN, LOW);
  Serial.println("✅ PIR Ready! Wave your hand in front of the sensor.");

  connectWiFi();
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setBufferSize(512);
  connectMQTT();

  Serial.println("✅ Livestock Monitor Ready!");
  Serial.printf("📍 Zone: %s\n", ZONE_NAME);
  Serial.printf("📌 PIR Pin: GPIO %d\n", PIR_PIN);
}

// ════════════════════════════════════════
void loop() {
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();

  unsigned long now = millis();

  // Read PIR
  bool pirHigh = digitalRead(PIR_PIN) == HIGH;

  if (pirHigh) {
    // Motion detected
    lastMotionTime = now;

    if (!motionDetected) {
      // New detection event
      motionDetected = true;
      motionCount++;
      digitalWrite(LED_PIN, HIGH);

      Serial.println("════════════════════════════");
      Serial.println("🐄 MOTION DETECTED!");
      Serial.printf("   Zone   : %s\n", ZONE_NAME);
      Serial.printf("   Count  : %d\n", motionCount);
      Serial.println("════════════════════════════");

      // Publish immediately on new detection
      publishMotion(true);
      lastPublish = now;
    }
  } else {
    // No PIR signal — check timeout
    if (motionDetected && (now - lastMotionTime > CLEAR_TIMEOUT)) {
      motionDetected = false;
      digitalWrite(LED_PIN, LOW);
      Serial.println("✅ Area Clear — no motion");

      // Publish clear state immediately
      publishMotion(false);
      lastPublish = now;
    }
  }

  // Regular publish every 3s (keep dashboard alive)
  if (now - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = now;
    publishMotion(motionDetected);
  }
}

// ════════════════════════════════════════
//  Publish to MQTT
//  Topic: farm/intrusion/alert  (livestock page listens here)
//  Also:  farm/livestock/motion (dedicated topic)
// ════════════════════════════════════════
void publishMotion(bool detected) {
  // ── Intrusion topic (existing dashboard listener) ──
  StaticJsonDocument<256> doc;
  doc["detected"]        = detected;
  doc["zone"]            = ZONE_NAME;
  doc["type"]            = detected ? "Livestock" : "None";
  doc["deterrentActive"] = false;
  doc["sensorId"]        = SENSOR_ID;
  doc["motionCount"]     = motionCount;
  doc["timestamp"]       = millis();

  char payload[256];
  serializeJson(doc, payload);
  mqtt.publish("farm/intrusion/alert", payload, true);

  // ── Dedicated livestock motion topic ──
  StaticJsonDocument<256> doc2;
  doc2["detected"]    = detected;
  doc2["zone"]        = ZONE_NAME;
  doc2["sensorId"]    = SENSOR_ID;
  doc2["motionCount"] = motionCount;
  doc2["pirPin"]      = PIR_PIN;
  doc2["timestamp"]   = millis();

  char payload2[256];
  serializeJson(doc2, payload2);
  mqtt.publish("farm/livestock/motion", payload2, true);

  Serial.printf("📡 Published → detected:%s zone:%s count:%d\n",
                detected ? "YES" : "NO", ZONE_NAME, motionCount);
}

// ════════════════════════════════════════
void connectWiFi() {
  Serial.printf("📶 Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) {
    delay(500); Serial.print("."); tries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ WiFi Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n❌ WiFi Failed!");
  }
}

void connectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("📡 MQTT Connecting...");
    String clientId = String(SENSOR_ID) + "-" + String(random(0xffff), HEX);
    if (mqtt.connect(clientId.c_str())) {
      Serial.println("✅ Connected!");
    } else {
      Serial.printf("❌ Failed rc=%d, retry 5s\n", mqtt.state());
      delay(5000);
    }
  }
}
