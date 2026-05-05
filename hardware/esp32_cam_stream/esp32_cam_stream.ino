/**
 * Smart Agriculture — ESP32-CAM Live Stream
 * Board: AI Thinker ESP32-CAM
 * 
 * Features:
 *   - Live MJPEG video stream at http://<IP>/stream
 *   - Snapshot at http://<IP>/snapshot  
 *   - MQTT announces stream URL automatically
 *   - Dashboard-ல automatically appear ஆகும்
 * 
 * Upload Settings:
 *   Board: AI Thinker ESP32-CAM
 *   Upload Speed: 115200
 *   Flash Mode: DIO
 *   Partition Scheme: Huge APP
 */

#include "esp_camera.h"
#include "esp_http_server.h"
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ════════════════════════════════════════
//   ⚙️  CONFIG — இங்க மட்டும் மாத்துங்க
// ════════════════════════════════════════
const char* WIFI_SSID     = "உங்க_WiFi_பேர்";
const char* WIFI_PASSWORD = "உங்க_WiFi_Password";
const char* MQTT_BROKER   = "broker.hivemq.com";
const char* CAMERA_ID     = "CAM-FIELD-01";   // Unique camera name
const char* CAMERA_LABEL  = "North Field";    // Location label

// ════════════════════════════════════════
//   AI Thinker ESP32-CAM Pin Map
// ════════════════════════════════════════
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ════════════════════════════════════════
//   OBJECTS
// ════════════════════════════════════════
WiFiClient   wifiClient;
PubSubClient mqtt(wifiClient);
httpd_handle_t stream_httpd = NULL;
httpd_handle_t snap_httpd   = NULL;

// ════════════════════════════════════════
//   MJPEG STREAM HANDLER
// ════════════════════════════════════════
#define PART_BOUNDARY "frame"
static const char* STREAM_CONTENT_TYPE =
  "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* STREAM_PART =
  "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

esp_err_t stream_handler(httpd_req_t* req) {
  camera_fb_t* fb = NULL;
  char part_buf[64];

  httpd_resp_set_type(req, STREAM_CONTENT_TYPE);
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_hdr(req, "Cache-Control", "no-cache");

  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) break;

    httpd_resp_send_chunk(req, STREAM_BOUNDARY, strlen(STREAM_BOUNDARY));
    size_t hlen = snprintf(part_buf, sizeof(part_buf), STREAM_PART, fb->len);
    httpd_resp_send_chunk(req, part_buf, hlen);
    httpd_resp_send_chunk(req, (const char*)fb->buf, fb->len);
    esp_camera_fb_return(fb);
  }
  return ESP_OK;
}

// ════════════════════════════════════════
//   SNAPSHOT HANDLER
// ════════════════════════════════════════
esp_err_t snapshot_handler(httpd_req_t* req) {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    httpd_resp_send_500(req);
    return ESP_FAIL;
  }
  httpd_resp_set_type(req, "image/jpeg");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_send(req, (const char*)fb->buf, fb->len);
  esp_camera_fb_return(fb);
  return ESP_OK;
}

// ════════════════════════════════════════
//   START HTTP SERVER
// ════════════════════════════════════════
void startCameraServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 80;

  httpd_uri_t stream_uri = {
    .uri     = "/stream",
    .method  = HTTP_GET,
    .handler = stream_handler
  };
  httpd_uri_t snap_uri = {
    .uri     = "/snapshot",
    .method  = HTTP_GET,
    .handler = snapshot_handler
  };

  if (httpd_start(&stream_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(stream_httpd, &stream_uri);
    httpd_register_uri_handler(stream_httpd, &snap_uri);
    Serial.printf("📷 Stream: http://%s/stream\n",
                  WiFi.localIP().toString().c_str());
    Serial.printf("📸 Snapshot: http://%s/snapshot\n",
                  WiFi.localIP().toString().c_str());
  }
}

// ════════════════════════════════════════
//   CAMERA INIT
// ════════════════════════════════════════
bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM; config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM; config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM; config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM; config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk  = XCLK_GPIO_NUM;
  config.pin_pclk  = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href  = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn  = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size   = FRAMESIZE_VGA;  // 640x480
  config.jpeg_quality = 15;
  config.fb_count     = 2;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("❌ Camera init failed: 0x%x\n", err);
    return false;
  }
  Serial.println("✅ Camera initialized");
  return true;
}

// ════════════════════════════════════════
//   SETUP
// ════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  Serial.println("\n📷 ESP32-CAM Starting...");

  if (!initCamera()) {
    Serial.println("Camera failed — check connections!");
    while (true) delay(1000);
  }

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("📶 Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.printf("\n✅ Connected! IP: %s\n",
                WiFi.localIP().toString().c_str());

  // Start camera HTTP server
  startCameraServer();

  // MQTT
  mqtt.setServer(MQTT_BROKER, 1883);
  connectMQTT();
}

// ════════════════════════════════════════
//   LOOP
// ════════════════════════════════════════
void loop() {
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();
  delay(10);
}

// ════════════════════════════════════════
//   MQTT CONNECT + ANNOUNCE
// ════════════════════════════════════════
void connectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("📡 MQTT connecting...");
    if (mqtt.connect(CAMERA_ID)) {
      Serial.println("✅ Connected!");

      // Announce camera to dashboard
      StaticJsonDocument<256> doc;
      doc["cameraId"]    = CAMERA_ID;
      doc["label"]       = CAMERA_LABEL;
      doc["status"]      = "online";
      doc["streamUrl"]   = "http://" + WiFi.localIP().toString() + "/stream";
      doc["snapshotUrl"] = "http://" + WiFi.localIP().toString() + "/snapshot";

      char payload[256];
      serializeJson(doc, payload);
      mqtt.publish("farm/cameras/status", payload, true);
      Serial.println("📢 Camera announced to dashboard!");
    } else {
      Serial.printf("❌ Failed rc=%d, retry 5s\n", mqtt.state());
      delay(5000);
    }
  }
}
