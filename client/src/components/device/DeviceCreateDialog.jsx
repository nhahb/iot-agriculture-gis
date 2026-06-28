import {
  useState
} from "react";

import {
  Button
} from "@/components/ui/button";

import {
  Input
} from "@/components/ui/input";

const DeviceCreateDialog = ({
  pendingDevice,
  setPendingDevice,
  createDevice,
  setDeviceCreateMode
}) => {

  const [name, setName] =
    useState("");

  const [type, setType] =
    useState("soil_sensor");

  if (!pendingDevice)
    return null;

  const handleSave = async () => {

    try {

      await createDevice({

        fieldId:
          pendingDevice.fieldId,

        name,

        type,

        geometry:
          pendingDevice.geometry
      });

      setPendingDevice(null);

      setDeviceCreateMode(false);

      setName("");

    } catch (err) {

      console.log(err);

    }
  };

  const handleCancel = () => {

    setPendingDevice(null);

    setDeviceCreateMode(false);

    setName("");
  };

  return (

    <div
      className="
      absolute
      top-4
      right-4
      bg-white
      p-4
      rounded-lg
      shadow-lg
      z-50
      "
    >

      <h2>
        Thêm thiết bị
      </h2>

      <Input
        value={name}
        onChange={(e) =>
          setName(
            e.target.value
          )
        }
        placeholder="Tên thiết bị"
      />

      <select
        value={type}
        onChange={(e) =>
          setType(
            e.target.value
          )
        }
      >
        <option
          value="soil_sensor"
        >
          Soil Sensor
        </option>

        <option
          value="pump"
        >
          Pump
        </option>

      </select>

      <div
        className="mt-2 flex gap-2"
      >

        <Button
          onClick={handleSave}
        >
          Lưu
        </Button>

        <Button
          variant="outline"
          onClick={handleCancel}
        >
          Hủy
        </Button>

      </div>

    </div>
  );
};

export default DeviceCreateDialog;