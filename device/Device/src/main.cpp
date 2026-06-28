
#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>
#include "DHT.h"
#include "../secrets.h"

// ================== CONFIG ==================
const char* mqtt_server =
    "c696e02ee3fa4f93a1a9ff93f68656d6.s1.eu.hivemq.cloud";

const int mqtt_port = 8883;

const char* device_id =
    "ESP32_Pro_Unit_01";

const char* topic_telemetry =
    "esp32/unit01/data";

const char* topic_command =
    "esp32/unit01/cmd";

const char* topic_status =
    "esp32/unit01/status";

const char* topic_event =
    "esp32/unit01/event";

// ================== PIN ==================
#define DHTPIN 4
#define DHTTYPE DHT11
#define AOUT_PIN 36

// Chân điều khiển relay máy bơm
#define RELAY_PIN 26

// Relay kích ở mức LOW
#define RELAY_ON LOW
#define RELAY_OFF HIGH

// Nếu đang thử bằng LED thì sử dụng:
// #define RELAY_ON HIGH
// #define RELAY_OFF LOW

// ================== SOIL CONFIG ==================

// Giá trị ADC khi đất khô
const int SOIL_DRY_ADC = 3200;

// Giá trị ADC khi đất ướt
const int SOIL_WET_ADC = 1300;

// Ngưỡng bật bơm mặc định, có thể thay đổi từ MQTT
float soilPumpThreshold = 30.0;

// Khoảng trễ để relay không bật/tắt liên tục
// Ví dụ threshold = 30% thì bật dưới 30%, tắt từ 35%
const float SOIL_HYSTERESIS = 5.0;

// ================== OBJECT ==================
WiFiClientSecure espClient;
PubSubClient client(espClient);

DHT dht(DHTPIN, DHTTYPE);

// ================== STATE ==================
unsigned long lastSensorTime = 0;
unsigned long lastPublishTime = 0;
unsigned long lastReconnectAttempt = 0;

// Đọc cảm biến mỗi 10 giây
const unsigned long sensorInterval = 10000;

// Gửi dữ liệu MQTT mỗi 30 giây
const unsigned long publishInterval = 30000;

// Thử kết nối lại MQTT mỗi 5 giây
const unsigned long reconnectInterval = 5000;

// Dữ liệu cảm biến gần nhất
float temp = NAN;
float humidity = NAN;
float heatIndex = NAN;

int adcValue = 0;

// Độ ẩm đất theo phần trăm
float soilMoisturePercent = 0.0;

// Trạng thái máy bơm
bool pumpState = false;

// Ghi nhớ hệ thống đang ở trạng thái cảnh báo đất khô
bool soilLowEventActive = false;

// Số lần DHT11 đọc lỗi liên tiếp
int dhtErrorCount = 0;

// Đã gửi cảnh báo lỗi DHT11 hay chưa
bool dhtErrorEventActive = false;

// Chỉ gửi event khi lỗi đủ 3 lần liên tiếp
const int DHT_ERROR_LIMIT = 3;

// ================== SOIL CONVERSION ==================

float convertSoilAdcToPercent(int adc) {
    float percentage =
        ((SOIL_DRY_ADC - adc) * 100.0) /
        (SOIL_DRY_ADC - SOIL_WET_ADC);

    return constrain(
        percentage,
        0.0,
        100.0
    );
}

// ================== EVENT ==================

void publishEvent(
    const char* type,
    const char* severity,
    const char* value,
    float threshold,
    const char* source
) {
    if (!client.connected()) {
        Serial.println(
            "Cannot publish event: MQTT disconnected"
        );
        return;
    }

    JsonDocument doc;

    doc["type"] = type;
    doc["severity"] = severity;
    doc["value"] = value;

    // Chỉ thêm threshold khi có giá trị hợp lệ
    if (!isnan(threshold)) {
        doc["threshold"] = threshold;
    }

    // manual hoặc automatic
    if (
        source != nullptr &&
        strlen(source) > 0
    ) {
        doc["source"] = source;
    }

    char buffer[256];

    size_t jsonSize = serializeJson(
        doc,
        buffer,
        sizeof(buffer)
    );

    if (jsonSize == 0) {
        Serial.println(
            "Event JSON serialization failed"
        );
        return;
    }

    // Event không dùng retain để tránh gửi lại
    // sự kiện cũ khi server kết nối lại
    bool published = client.publish(
        topic_event,
        buffer,
        false
    );

    if (published) {
        Serial.print("Event published: ");
        Serial.println(buffer);
    } else {
        Serial.println(
            "Event publish failed"
        );
    }
}

// ================== STATUS ==================

void publishStatus() {
    if (!client.connected()) {
        return;
    }

    JsonDocument doc;

    doc["device"] = "online";
    doc["pump"] =
        pumpState ? "on" : "off";

    doc["threshold"] =
        soilPumpThreshold;

    doc["off_threshold"] =
        soilPumpThreshold + SOIL_HYSTERESIS;

    char buffer[192];

    size_t jsonSize = serializeJson(
        doc,
        buffer,
        sizeof(buffer)
    );

    if (jsonSize == 0) {
        Serial.println(
            "Status JSON serialization failed"
        );
        return;
    }

    bool published = client.publish(
        topic_status,
        buffer,
        true
    );

    if (published) {
        Serial.print(
            "Status published: "
        );

        Serial.println(buffer);
    } else {
        Serial.println(
            "Status publish failed"
        );
    }
}

// ================== PUMP ==================

void setPumpState(
    bool turnOn,
    const char* source = "automatic"
) {
    // Không xử lý và không gửi event
    // nếu trạng thái bơm không thay đổi
    if (pumpState == turnOn) {
        return;
    }

    pumpState = turnOn;

    digitalWrite(
        RELAY_PIN,
        turnOn
            ? RELAY_ON
            : RELAY_OFF
    );

    Serial.print(
        "Pump changed to: "
    );

    Serial.println(
        turnOn ? "ON" : "OFF"
    );

    /*
     * Chỉ gửi event sau khi relay
     * đã thực sự được chuyển trạng thái.
     */
    if (turnOn) {
        publishEvent(
            "pump_started",
            "info",
            "on",
            soilPumpThreshold,
            source
        );
    } else {
        publishEvent(
            "pump_stopped",
            "info",
            "off",
            soilPumpThreshold +
                SOIL_HYSTERESIS,
            source
        );
    }

    // Cập nhật trạng thái hiện tại,
    // dùng retained message
    publishStatus();
}


// ================== AUTOMATIC PUMP ==================

void handleAutomaticPump() {
    const float pumpOffThreshold =
        soilPumpThreshold + SOIL_HYSTERESIS;

    /*
     * Chuyển độ ẩm hiện tại thành chuỗi
     * để truyền vào publishEvent().
     */
    char moistureValue[16];

    snprintf(
        moistureValue,
        sizeof(moistureValue),
        "%.1f",
        soilMoisturePercent
    );

    // Đất vừa giảm xuống dưới ngưỡng
    if (
        soilMoisturePercent <
        soilPumpThreshold
    ) {
        /*
         * Chỉ gửi cảnh báo một lần khi bắt đầu khô.
         * Những lần đọc tiếp theo vẫn khô thì không gửi lại.
         */
        if (!soilLowEventActive) {
            publishEvent(
                "soil_moisture_low",
                "warning",
                moistureValue,
                soilPumpThreshold,
                "automatic"
            );

            soilLowEventActive = true;
        }

        if (!pumpState) {
            Serial.println(
                "Soil is dry -> Pump ON"
            );

            setPumpState(
                true,
                "automatic"
            );
        }

        return;
    }

    // Độ ẩm đã tăng đến ngưỡng tắt bơm
    if (
        soilMoisturePercent >=
        pumpOffThreshold
    ) {
        /*
         * Chỉ gửi phục hồi nếu trước đó
         * đã có cảnh báo đất khô.
         */
        if (soilLowEventActive) {
            publishEvent(
                "soil_moisture_recovered",
                "info",
                moistureValue,
                pumpOffThreshold,
                "automatic"
            );

            soilLowEventActive = false;
        }

        if (pumpState) {
            Serial.println(
                "Soil is wet -> Pump OFF"
            );

            setPumpState(
                false,
                "automatic"
            );
        }

        return;
    }

    // Trong vùng trễ 30–35%, giữ trạng thái hiện tại
    Serial.println(
        "Soil moisture in hysteresis range"
    );
}

// ================== WIFI ==================

void handleWiFi() {
    if (WiFi.status() == WL_CONNECTED) {
        return;
    }

    static bool connecting = false;

    if (!connecting) {
        Serial.println(
            "Connecting WiFi..."
        );

        WiFi.begin(
            WIFI_SSID,
            WIFI_PASSWORD
        );

        connecting = true;
    }

    if (
        WiFi.status() ==
            WL_CONNECT_FAILED ||
        WiFi.status() ==
            WL_NO_SSID_AVAIL
    ) {
        connecting = false;
    }
}

// ================== MQTT CALLBACK ==================

void callback(
    char* topic,
    byte* payload,
    unsigned int length
) {
    Serial.print(
        "Received topic: "
    );

    Serial.println(topic);

    // Chỉ xử lý topic lệnh
    if (
        strcmp(
            topic,
            topic_command
        ) != 0
    ) {
        return;
    }

    JsonDocument doc;

    DeserializationError error =
        deserializeJson(
            doc,
            payload,
            length
        );

    if (error) {
        Serial.print(
            "Invalid command JSON: "
        );

        Serial.println(
            error.c_str()
        );

        return;
    }

    bool commandHandled = false;
    bool statusAlreadyPublished = false;

    // Nhận và cập nhật ngưỡng độ ẩm từ MQTT
    if (!doc["threshold"].isNull()) {
        if (!doc["threshold"].is<float>() &&
            !doc["threshold"].is<int>()) {
            Serial.println(
                "Threshold must be a number"
            );
        } else {
            float newThreshold =
                doc["threshold"].as<float>();

            // Chừa khoảng cho hysteresis để ngưỡng tắt không vượt 100%
            if (
                newThreshold >= 0.0 &&
                newThreshold <=
                    100.0 - SOIL_HYSTERESIS
            ) {
                soilPumpThreshold =
                    newThreshold;

                Serial.print(
                    "New soil threshold: "
                );

                Serial.print(
                    soilPumpThreshold
                );

                Serial.println(" %");

                commandHandled = true;

                bool previousPumpState =
                    pumpState;

                // Áp dụng ngay ngưỡng mới
                handleAutomaticPump();

                // setPumpState đã publish nếu trạng thái thay đổi
                statusAlreadyPublished =
                    previousPumpState !=
                    pumpState;
            } else {
                Serial.print(
                    "Threshold must be from 0 to "
                );

                Serial.println(
                    100.0 - SOIL_HYSTERESIS
                );
            }
        }
    }

    // Vẫn hỗ trợ lệnh bật/tắt bơm thủ công
    if (!doc["pump"].isNull()) {
        const char* pumpCommand =
            doc["pump"] | "";

        Serial.print(
            "Pump command: "
        );

        Serial.println(
            pumpCommand
        );

        bool previousPumpState =
            pumpState;

        if (
            strcmp(
                pumpCommand,
                "on"
            ) == 0 ||
            strcmp(
                pumpCommand,
                "ON"
            ) == 0
        ) {
            setPumpState(
                true,
                "manual"
            );
            commandHandled = true;
        }
        else if (
            strcmp(
                pumpCommand,
                "off"
            ) == 0 ||
            strcmp(
                pumpCommand,
                "OFF"
            ) == 0
        ) {
            setPumpState(
                false,
                "manual"
            );
            commandHandled = true;
        }
        else {
            Serial.println(
                "Invalid pump command"
            );
        }

        if (
            previousPumpState !=
            pumpState
        ) {
            statusAlreadyPublished = true;
        }
    }

    if (!commandHandled) {
        Serial.println(
            "No valid command found"
        );
        return;
    }

    // Nếu trạng thái bơm không đổi thì vẫn phản hồi threshold mới
    if (!statusAlreadyPublished) {
        publishStatus();
    }
}

// ================== MQTT ==================

void handleMQTT() {
    if (
        WiFi.status() !=
        WL_CONNECTED
    ) {
        return;
    }

    if (!client.connected()) {
        unsigned long now =
            millis();

        if (
            now -
                lastReconnectAttempt <
            reconnectInterval
        ) {
            return;
        }

        lastReconnectAttempt = now;

        Serial.println(
            "Connecting MQTT..."
        );

        /*
         * Broker tự gửi thông báo này
         * nếu ESP32 mất kết nối đột ngột.
         */
        const char* lastWillMessage =
            "{\"device\":\"offline\","
            "\"pump\":\"unknown\"}";

        bool connected =
            client.connect(
                device_id,
                MQTT_USER,
                MQTT_PASS,
                topic_status,
                0,
                true,
                lastWillMessage
            );

        if (connected) {
            Serial.println(
                "MQTT connected"
            );

            bool subscribed =
                client.subscribe(
                    topic_command
                );

            if (subscribed) {
                Serial.print(
                    "Subscribed: "
                );

                Serial.println(
                    topic_command
                );
            } else {
                Serial.println(
                    "Subscribe command failed"
                );
            }

            // Gửi trạng thái sau khi kết nối
            publishStatus();
        } else {
            Serial.print(
                "MQTT connection failed, state: "
            );

            Serial.println(
                client.state()
            );
        }

        return;
    }

    client.loop();
}

// ================== SENSOR ==================

void handleSensor() {
    unsigned long now =
        millis();

    if (
        now - lastSensorTime <
        sensorInterval
    ) {
        return;
    }

    lastSensorTime = now;

    // Đọc cảm biến độ ẩm đất trước
    adcValue =
        analogRead(AOUT_PIN);

    soilMoisturePercent =
        convertSoilAdcToPercent(
            adcValue
        );

    // Tự động điều khiển máy bơm
    handleAutomaticPump();

    // Đọc DHT11
    float newHumidity =
        dht.readHumidity();

    float newTemp =
        dht.readTemperature();

    if (
        isnan(newHumidity) ||
        isnan(newTemp)
    ) {
        dhtErrorCount++;

        Serial.print(
            "DHT error count: "
        );

        Serial.println(
            dhtErrorCount
        );

        /*
        * Chỉ gửi cảnh báo sau khi cảm biến
        * đọc lỗi đủ số lần liên tiếp.
        */
        if (
            dhtErrorCount >= DHT_ERROR_LIMIT &&
            !dhtErrorEventActive &&
            client.connected()
        ) {
            publishEvent(
                "sensor_error",
                "critical",
                "dht11",
                NAN,
                "automatic"
            );

            dhtErrorEventActive = true;

            Serial.println(
                "DHT error event sent"
            );
        }
    } else {
        /*
        * Nếu trước đó DHT11 đang lỗi,
        * gửi event thông báo đã phục hồi.
        */
        if (
            dhtErrorEventActive &&
            client.connected()
        ) {
            publishEvent(
                "sensor_recovered",
                "info",
                "dht11",
                NAN,
                "automatic"
            );

            dhtErrorEventActive = false;

            Serial.println(
                "DHT recovered event sent"
            );
        }

        // Đọc thành công thì đặt lại bộ đếm lỗi
        dhtErrorCount = 0;

        humidity =
            newHumidity;

        temp =
            newTemp;

        heatIndex =
            dht.computeHeatIndex(
                temp,
                humidity,
                false
            );
    }


    Serial.println(
        "========================"
    );

    Serial.println(
        "Sensor updated"
    );

    if (!isnan(temp)) {
        Serial.print(
            "Temperature: "
        );

        Serial.print(temp);
        Serial.println(" °C");
    }

    if (!isnan(humidity)) {
        Serial.print(
            "Humidity: "
        );

        Serial.print(humidity);
        Serial.println(" %");
    }

    if (!isnan(heatIndex)) {
        Serial.print(
            "Heat index: "
        );

        Serial.print(heatIndex);
        Serial.println(" °C");
    }

    Serial.print(
        "Soil ADC: "
    );

    Serial.println(
        adcValue
    );

    Serial.print(
        "Soil moisture: "
    );

    Serial.print(
        soilMoisturePercent
    );

    Serial.println(" %");

    Serial.print(
        "Pump: "
    );

    Serial.println(
        pumpState ? "ON" : "OFF"
    );
}

// ================== MQTT PUBLISH ==================

void handlePublish() {
    if (!client.connected()) {
        return;
    }

    unsigned long now =
        millis();

    if (
        now - lastPublishTime <
        publishInterval
    ) {
        return;
    }

    lastPublishTime = now;

    JsonDocument doc;

    doc["device"] =
        device_id;

    // Chỉ gửi DHT nếu đã đọc được
    if (!isnan(temp)) {
        doc["temp"] =
            temp;
    } else {
        doc["temp"] =
            nullptr;
    }

    if (!isnan(humidity)) {
        doc["humidity"] =
            humidity;
    } else {
        doc["humidity"] =
            nullptr;
    }

    if (!isnan(heatIndex)) {
        doc["heat_index"] =
            heatIndex;
    } else {
        doc["heat_index"] =
            nullptr;
    }

    doc["adc"] =
        adcValue;

    doc["soil_moisture"] =
        soilMoisturePercent;

    doc["threshold"] =
        soilPumpThreshold;

    doc["off_threshold"] =
        soilPumpThreshold + SOIL_HYSTERESIS;

    doc["uptime"] =
        millis() / 1000;

    doc["pump"] =
        pumpState
            ? "on"
            : "off";

    char buffer[256];

    size_t jsonSize =
        serializeJson(
            doc,
            buffer,
            sizeof(buffer)
        );

    if (jsonSize == 0) {
        Serial.println(
            "JSON serialization failed"
        );

        return;
    }

    bool published =
        client.publish(
            topic_telemetry,
            buffer
        );

    if (published) {
        Serial.println(
            "------------------------"
        );

        Serial.println(
            "Published MQTT:"
        );

        Serial.println(
            buffer
        );
    } else {
        Serial.println(
            "MQTT publish failed"
        );
    }
}

// ================== SETUP ==================

void setup() {
    Serial.begin(9600);

    WiFi.mode(WIFI_STA);

    espClient.setInsecure();

    client.setServer(
        mqtt_server,
        mqtt_port
    );

    client.setCallback(
        callback
    );

    client.setBufferSize(
        512
    );

    dht.begin();

    analogSetPinAttenuation(
        AOUT_PIN,
        ADC_11db
    );

    pinMode(
        RELAY_PIN,
        OUTPUT
    );

    // Tắt bơm khi ESP32 khởi động
    digitalWrite(
        RELAY_PIN,
        RELAY_OFF
    );

    pumpState = false;

    Serial.println(
        "System initialized"
    );

    Serial.println(
        "Pump default state: OFF"
    );

    Serial.print(
        "Default soil threshold: "
    );

    Serial.print(
        soilPumpThreshold
    );

    Serial.println(" %");
}

// ================== LOOP ==================

void loop() {
    handleWiFi();
    handleMQTT();
    handleSensor();
    handlePublish();
}

