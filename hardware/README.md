# 🔌 Hardware Integration Guide

## Supported Sensors & Devices

| Sensor | Protocol | Microcontroller |
|--------|----------|-----------------|
| Soil Moisture (Capacitive) | Analog/I2C | ESP32 / Arduino |
| DHT22 (Humidity) | Digital | ESP32 / Arduino |
| pH Sensor | Analog | ESP32 |
| NPK Sensor | RS485/UART | ESP32 |
| GPS (NEO-6M) | UART | ESP32 |
| Camera (OV2640 / Pi Camera) | HTTP/RTSP | ESP32-CAM / Raspberry Pi |
| Livestock GPS Collar | LoRa / 4G | ESP32 + SIM800L |

## Communication Flow

```
[ESP32 Sensors] --MQTT--> [HiveMQ / Mosquitto Broker] --MQTT--> [Node.js Server] --WebSocket--> [React Dashboard]
[Raspberry Pi Camera] --HTTP Stream--> [Node.js Server] --WebSocket--> [React Dashboard]
```
