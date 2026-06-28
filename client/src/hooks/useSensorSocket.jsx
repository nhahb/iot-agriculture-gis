import { useEffect } from "react";
import socket from "@/api/socket";

const useSensorSocket = ({
  fieldId,
  setDevices,
}) => {
  useEffect(() => {
    if (!fieldId) return;

    const roomFieldId = Number(fieldId);

    if (
      !Number.isInteger(roomFieldId) ||
      roomFieldId <= 0
    ) {
      return;
    }

    const joinFieldRoom = () => {
      console.log(
        `Joining Socket.IO room field:${roomFieldId}`
      );

      socket.emit("field:join", roomFieldId);
    };

    const handleSensorUpdate = (sensorData) => {
      console.log(
        "Received sensor:update:",
        sensorData
      );

      /*
       * Chỉ xử lý dữ liệu thuộc field đang xem.
       * Server đã chia room, nhưng kiểm tra lại vẫn an toàn.
       */
      if (
        Number(sensorData.fieldId) !== roomFieldId
      ) {
        return;
      }

      setDevices((currentDevices) =>
        currentDevices.map((device) => {
          if (
            Number(device.id) !==
            Number(sensorData.deviceId)
          ) {
            return device;
          }

          return {
            ...device,

            status: "online",

            latestData: {
              temperature:
                sensorData.temperature,

              humidity:
                sensorData.humidity,

              heatIndexC:
                sensorData.heatIndexC,

              soilAdc:
                sensorData.soilAdc,

              created_at:
                sensorData.created_at,
            },
          };
        })
      );
    };

    const handleConnect = () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      joinFieldRoom();
    };

    const handleDisconnect = (reason) => {
      console.log(
        "Socket disconnected:",
        reason
      );
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(
      "sensor:update",
      handleSensorUpdate
    );

    /*
     * Nếu socket chưa kết nối thì kết nối.
     * Nếu đã kết nối do xem field trước đó thì join room ngay.
     */
    if (!socket.connected) {
      socket.connect();
    } else {
      joinFieldRoom();
    }

    return () => {
      socket.emit(
        "field:leave",
        roomFieldId
      );

      socket.off(
        "sensor:update",
        handleSensorUpdate
      );

      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );
    };
  }, [fieldId, setDevices]);
};

export default useSensorSocket;