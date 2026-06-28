const mqtt = require("mqtt");
const { findDeviceByDeviceCode } = require("../model/device.model");
const { createRealtimeData } = require("../model/deviceData.model");

let mqttClient = null;

const parseTelemetryTopic = (topic) => {
  const parts = topic.split("/");

  if (
    parts.length !== 3 ||
    parts[0] !== "esp32" ||
    parts[2] !== "data"
  ) {
    return null;
  }

  const deviceCode = parts[1];

  if (!/^[a-zA-Z0-9_-]+$/.test(deviceCode)) {
    return null;
  }

  return {
    deviceCode,
  };
};

const validatePayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  if (
    typeof payload.device !== "string" ||
    payload.device.trim() === ""
  ) {
    return false;
  }

  return true;
};

const normalizeTelemetry = ({
  payload,
  unitCode,
  topic,
}) => {
  const toNumberOrNull = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  const light = toNumberOrNull(payload.light);

  return {
    // Mã sẽ liên kết với devices.device_code
    deviceCode: payload.device,

    // Lấy từ topic: unit01
    unitCode,

    temperature: toNumberOrNull(payload.temp),
    humidity: toNumberOrNull(payload.humidity),
    heatIndexC: toNumberOrNull(payload.heat_index),

    // BH1750 trả -2 thường là dữ liệu không hợp lệ
    light: light !== null && light >= 0 ? light : null,

    soilAdc: toNumberOrNull(payload.adc),
    uptimeSeconds: toNumberOrNull(payload.uptime),

    topic,
    receivedAt: new Date().toISOString(),
  };
};

const connectMqtt = (io) => {
  if (mqttClient) {
    return mqttClient;
  }

  const mqttUrl = process.env.MQTT_URL;

  if (!mqttUrl) {
    throw new Error("MQTT_URL chưa được cấu hình");
  }

  const options = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,

    // Phải khác clientId của ESP32
    clientId: `node_server_${Math.random()
      .toString(16)
      .slice(2, 10)}`,

    clean: true,
    keepalive: 60,
    connectTimeout: 10_000,
    reconnectPeriod: 5_000,

    // HiveMQ Cloud sử dụng chứng chỉ TLS hợp lệ
    rejectUnauthorized: true,
  };

  mqttClient = mqtt.connect(mqttUrl, options);

  mqttClient.on("connect", () => {
    console.log("MQTT server connected to HiveMQ Cloud");

    const telemetryTopic =
      process.env.MQTT_TELEMETRY_TOPIC ||
      "esp32/+/data";

    mqttClient.subscribe(
      telemetryTopic,
      { qos: 0 },
      (error, granted) => {
        if (error) {
          console.error(
            "MQTT subscribe error:",
            error.message
          );
          return;
        }

        console.log(
          `MQTT subscribed: ${telemetryTopic}`
        );

        console.log("Granted topics:", granted);
      }
    );
  });

  mqttClient.on("message", async (topic, messageBuffer) => {
    try {
      const topicInfo = parseTelemetryTopic(topic);

      if (!topicInfo) {
        console.warn("Topic không hợp lệ:", topic);
        return;
      }

      const { deviceCode } = topicInfo;

      const message = messageBuffer.toString("utf8");
      const payload = JSON.parse(message);

      const device = await findDeviceByDeviceCode(deviceCode);

      if (!device) {
        console.warn(
          "Không tìm thấy device với device_code:",
          deviceCode
        );
        return;
      }

      if (!validatePayload(payload)) {
        console.warn(
          "Payload không có device hợp lệ:",
          payload
        );
        return;
      }

      const telemetry = {
        deviceId: device.id,
        deviceCode: device.device_code,

        fieldId: device.field_id,
        userId: device.user_id,

        deviceName: device.name,
        location: device.location,

        temperature: Number(payload.temp),
        humidity: Number(payload.humidity),
        heatIndexC: Number(payload.heat_index),
        soilAdc: Number(payload.adc),

        created_at: new Date().toISOString(),
      };

      // Gửi dữ liệu telemetry đến cơ sở dữ liệu
      const result = await createRealtimeData(telemetry);

      const realtimeData = {
        id: result.insertId,
        deviceId: telemetry.deviceId,
        deviceCode: telemetry.deviceCode,
        deviceName: telemetry.deviceName,
        fieldId: telemetry.fieldId,
        location: telemetry.location,
        temperature: telemetry.temperature,
        humidity: telemetry.humidity,
        heatIndexC: telemetry.heatIndexC,
        soilAdc: telemetry.soilAdc,
        created_at: telemetry.receivedAt,
      };
      io.to(`field:${telemetry.fieldId}`).emit(
        "sensor:update",
        realtimeData
      );
      console.log(
        "Đã lưu và emit dữ liệu",
        {
            recordId: result.insertId,
            deviceCode: telemetry.deviceCode,
            room: `field:${telemetry.fieldId}`,
        }
      );

    } catch (error) {
      console.error(
        "Không xử lý được MQTT message:",
        error.message
      );

      console.error(
        "Payload gốc:",
        messageBuffer.toString("utf8")
      );
    }
  });

  mqttClient.on("reconnect", () => {
    console.log("MQTT đang kết nối lại...");
  });

  mqttClient.on("offline", () => {
    console.log("MQTT client đang offline");
  });

  mqttClient.on("close", () => {
    console.log("Kết nối MQTT đã đóng");
  });

  mqttClient.on("error", (error) => {
    console.error(
      "MQTT connection error:",
      error.message
    );
  });

  return mqttClient;
};

const getMqttClient = () => mqttClient;

module.exports = {
  connectMqtt,
  getMqttClient,
};