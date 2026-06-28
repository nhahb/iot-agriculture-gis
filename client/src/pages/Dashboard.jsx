import 'maplibre-gl/dist/maplibre-gl.css';
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import * as turf from '@turf/turf';
import { useState, useEffect, useRef } from "react";

import useMap from '@/hooks/useMap';
import useField from '@/hooks/Field/useField';
import useDevice from '@/hooks/Device/useDevice';
import useSensorSocket from '@/hooks/useSensorSocket';

import FieldSidebar from '@/components/field/FieldSidebar';
import FieldCreateDialog from '@/components/field/FieldCreateDialog';
import FieldEditDialog from '@/components/field/FieldEditDialog';
import FieldInfoPanel from '@/components/field/FieldInfoPanel';
import DeviceDataPanel from '@/components/device/DeviceDataPanel';
import DeviceHistory from '@/components/device/DeviceHistory';

import { updateFieldLayers } from '@/map/fieldLayers';
import { updateDeviceLayers } from '@/map/deviceLayers';
import { updateSensorHeatmapLayer, removeSensorHeatmapLayer } from '@/map/heatmapLayers';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Dashboard = () => {

  const mapContainerRef = useRef(null);
  const isEditingRef = useRef(false);
  const selectedFieldRef = useRef(null);
  const deviceCreateModeRef = useRef(false);
  const pendingDeviceDrawIdRef= useRef(null);
  const lastValidDevicePointRef = useRef(null);
  const devicesRef = useRef([]);

  const [pendingFeature, setPendingFeature] = useState(null);
  const [editingFeature, setEditingFeature] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceCreateMode, setDeviceCreateMode] = useState(false);
  const [pendingDevicePoint, setPendingDevicePoint] = useState(null);
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState('sensor');
  const [fieldAddress, setFieldAddress] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [heatmapMetric, setHeatmapMetric] = useState('temperature');
  const [heatmapInfo, setHeatmapInfo] = useState(null);

  const { mapRef, drawRef } = useMap(mapContainerRef);

  const { fields, fetchFields, createField, updateField, deleteField } = useField();

  const { devices, setDevices, createDevice, fetchDevices } = useDevice();

  useSensorSocket({
    fieldId: selectedField ? selectedField.properties.id : null,
    setDevices,
  });

  const isPointInPolygon = (pointFeature) => {
    const currentSelectedField = selectedFieldRef.current;
    if(!currentSelectedField) return false;
    const point = turf.point(pointFeature.geometry.coordinates);
    const polygon = turf.polygon(currentSelectedField.geometry.coordinates);
    return turf.booleanPointInPolygon(point, polygon);
  };

  const handleDrawCreate = (e) => {
    const feature = structuredClone(e.features[0]);

    if(feature.geometry.type === 'Polygon') {
      setPendingFeature(feature);
      return;
    };

    if(feature.geometry.type === 'Point') {
      if(!deviceCreateModeRef.current) {
        drawRef.current.delete(feature.id);
        return;
      }
      if(!selectedFieldRef.current) {
        toast.error('Vui lòng chọn một field trước khi đặt thiết bị');
        drawRef.current.delete(feature.id);
        return;
      };
      if(!isPointInPolygon(feature)){
        toast.error('Vị trí thiết bị phải nằm trong field đã chọn');
        drawRef.current.delete(feature.id);
        drawRef.current.changeMode('draw_point');
        return;
      };

      if(pendingDeviceDrawIdRef.current){
        drawRef.current.delete(pendingDeviceDrawIdRef.current);
      };
      pendingDeviceDrawIdRef.current = feature.id;
      lastValidDevicePointRef.current = feature;
      setPendingDevicePoint(feature);
      drawRef.current.changeMode('simple_select', {featureIds: [feature.id]});
      toast.success('Đã chọn vị trí thiết bị mới');
      return;
    };
  };

  const handleDrawUpdate = (e) => {
  const feature = structuredClone(e.features[0]);

  if (!feature) return;

  // Nếu update polygon thì tạm thời chỉ log
  if (feature.geometry.type !== 'Point') {
    console.log('Update polygon:', feature);
    return;
  }

  // Chỉ xử lý point khi đang tạo device
  if (!deviceCreateModeRef.current) return;

  // Chỉ xử lý đúng point đang tạo device
  if (feature.id !== pendingDeviceDrawIdRef.current) return;

  // Kiểm tra vị trí mới có nằm trong field không
  if (!isPointInPolygon(feature)) {
    toast.error('Không thể đặt thiết bị ra ngoài field');

    // Xóa point bị kéo sai
    drawRef.current.delete(feature.id);

    // Khôi phục point cũ
    if (lastValidDevicePointRef.current) {
      const oldFeature = structuredClone(lastValidDevicePointRef.current);

      const newIds = drawRef.current.add(oldFeature);
      const newId = newIds[0];

      pendingDeviceDrawIdRef.current = newId;

      const restoredFeature = {
        ...oldFeature,
        id: newId
      };

      lastValidDevicePointRef.current = restoredFeature;
      setPendingDevicePoint(restoredFeature);

      drawRef.current.changeMode('simple_select', {
        featureIds: [newId]
      });
    }

    return;
  }

  // Nếu vị trí mới hợp lệ thì cập nhật tọa độ mới vào card
  setPendingDevicePoint(feature);
  lastValidDevicePointRef.current = feature;
};

  const handleFieldClick = (e) => {
          if(isEditingRef.current) return;
          if(!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          setSelectedField(feature);
  };

  const handleDeviceClick = (e) => {
  const feature = e.features?.[0];

  if (!feature) return;

  const deviceId = Number(
    feature.properties?.id
  );

  if (!Number.isInteger(deviceId)) {
    console.error(
      'Device feature does not contain a valid id'
    );
    return;
  }

  const device = devicesRef.current.find(
    (item) => Number(item.id) === deviceId
  );

  if (!device) {
    console.error(
      `Device ${deviceId} was not found`
    );
    return;
  }

  setSelectedDevice(device);
  console.log('Selected device:', device);
};

  const handleDeviceMouseEnter = () => {
    mapRef.current.getCanvas().style.cursor = 'pointer';
  };

  const handleDeviceMouseLeave = () => {
    mapRef.current.getCanvas().style.cursor = '';
  };

  // Lay du lieu fields tu database
  useEffect(()=>{
    const loadData = async () => {
      try {
        await fetchFields();
      } catch (err) {
        console.log(err);
        toast.error('Không thể lấy thông tin fields');
      }
    };

    loadData();
  },[]);

  useEffect(() => {
    isEditingRef.current = editingFeature;
  },[editingFeature]);

  useEffect(() => {
    selectedFieldRef.current = selectedField;
  }, [selectedField]);

  useEffect(() => {
    deviceCreateModeRef.current = deviceCreateMode;
  }, [deviceCreateMode]);

  useEffect(()=>{
    devicesRef.current = devices;
  },[devices]);

  // Set up map, draw
  useEffect(() => {
    if(!mapRef.current || !drawRef.current) return;
    mapRef.current.on('draw.create', handleDrawCreate);
    mapRef.current.on('draw.update', handleDrawUpdate);
    mapRef.current.on('draw.delete', () => {console.log('Delete feature')});
    mapRef.current.on('click', 'fields-layer', handleFieldClick);
    mapRef.current.on('click', 'devices-layer', handleDeviceClick);
    mapRef.current.on('mouseenter', 'devices-layer', handleDeviceMouseEnter);
    mapRef.current.on('mouseleave', 'devices-layer', handleDeviceMouseLeave);
    return () => {
    mapRef.current.off('draw.create', handleDrawCreate);
    mapRef.current.off('draw.update', handleDrawUpdate);
    mapRef.current.off('draw.delete', () => {console.log('Delete feature')});

    mapRef.current.off(
      'click',
      'fields-layer',
      handleFieldClick
    );

    mapRef.current.off(
      'click',
      'devices-layer',
      handleDeviceClick
    );

    mapRef.current.off(
      'mouseenter',
      'devices-layer',
      handleDeviceMouseEnter
    );

    mapRef.current.off(
      'mouseleave',
      'devices-layer',
      handleDeviceMouseLeave
    );
    };
  },[]);

  //Tao layer fields
  useEffect(()=>{
    if(!mapRef.current) return;
    if(mapRef.current.isStyleLoaded()){
      updateFieldLayers(mapRef.current, fields);
    } else {
      mapRef.current.once('load', () => {
        updateFieldLayers(mapRef.current, fields);
      })
    }
  },[fields]);
  
  // Lay du lieu devices khi chon field
  useEffect(() => {
    if(!selectedField) return;
    const loadDevices = async () => {
      try {
        await fetchDevices(selectedField.properties.id);
        console.log('Devices: ', devices);
      } catch (err) {
        console.log(err);
        toast.error('Không thể lấy thông tin thiết bị');
      }
    };

    loadDevices();
  }, [selectedField]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapRef.current.isStyleLoaded()) {
      updateDeviceLayers(mapRef.current, devices);
    } else {
      mapRef.current.once('load', () => {
        updateDeviceLayers(mapRef.current, devices);
      });
    }
  }, [selectedField, devices]);

  useEffect(() => {
  const map = mapRef.current;

  if (!map) return;

  const renderHeatmap = () => {
    if (
      !heatmapEnabled ||
      !selectedField
    ) {
      removeSensorHeatmapLayer(map);
      setHeatmapInfo(null);
      return;
    }

    const result =
      updateSensorHeatmapLayer({
        map,
        field: selectedField,
        devices,
        metric: heatmapMetric,

        /*
         * Thử 20 m trước.
         * Field nhỏ có thể đổi thành 0.01.
         */
        cellSizeKm: 0.02
      });

    setHeatmapInfo(result);

    if (
      !result.ok &&
      result.reason ===
        'NOT_ENOUGH_SENSOR_DATA'
    ) {
      console.log(
        'Heatmap cần ít nhất 2 sensor có dữ liệu'
      );
    }
  };

  if (map.isStyleLoaded()) {
    renderHeatmap();
  } else {
    map.once(
      'load',
      renderHeatmap
    );
  }

  return () => {
    map.off(
      'load',
      renderHeatmap
    );
  };
}, [
  selectedField,
  devices,
  heatmapEnabled,
  heatmapMetric
]);

  const handleSaveDevice = async () => {
    if(!selectedField) {
      toast.error('Vui lòng chọn một field trước khi đặt thiết bị');
      return;
    }
    if(!deviceName.trim()){
      toast.error('Vui lòng nhập tên thiết bị');
      return;
    }
    if(!pendingDevicePoint) {
      toast.error('Vui lòng chọn vị trí thiết bị');
      return;
    }
    console.log(selectedField.properties.id, deviceName, deviceType, pendingDevicePoint.geometry);
    try {
      await createDevice({
        fieldId: selectedField.properties.id,
        name: deviceName,
        type: deviceType,
        geometry: pendingDevicePoint.geometry
      });
      toast.success('Thiết bị đã được tạo');
      if(pendingDeviceDrawIdRef.current){
        drawRef.current.delete(pendingDeviceDrawIdRef.current);
        pendingDeviceDrawIdRef.current = null;
      }
      setDeviceCreateMode(false);
      setPendingDevicePoint(null);
      setDeviceName('');
      setDeviceType('sensor');
      drawRef.current.changeMode('simple_select');
      await fetchDevices(selectedField.properties.id);
    } catch (err) {
      console.log(err);
      toast.error('Tạo thiết bị thất bại');
    }
  };

  const handleCancelCreateDevice = () => {
    setDeviceCreateMode(false);
    setPendingDevicePoint(null);
    setDeviceName('');
    setDeviceType('sensor');
    if(pendingDeviceDrawIdRef.current){
      drawRef.current.delete(pendingDeviceDrawIdRef.current);
      pendingDeviceDrawIdRef.current = null;
    }
    lastValidDevicePointRef.current = null;
    if(drawRef.current){
      drawRef.current.changeMode('simple_select');
    }
  };

  return (
  <div className="relative h-screen w-full overflow-hidden bg-zinc-950">
    {/* Map */}
    <div
      ref={mapContainerRef}
      className="absolute inset-0 h-full w-full"
    />

    {/* Dialog không tham gia layout */}
    <FieldCreateDialog
      pendingFeature={pendingFeature}
      setPendingFeature={setPendingFeature}
      drawRef={drawRef}
      createField={createField}
      fieldName={fieldName}
      setFieldName={setFieldName}
      fieldAddress={fieldAddress}
      setFieldAddress={setFieldAddress}
    />

    <FieldEditDialog
      drawRef={drawRef}
      fieldName={fieldName}
      setFieldName={setFieldName}
      editingFeature={editingFeature}
      setEditingFeature={setEditingFeature}
      updateField={updateField}
      fieldAddress={fieldAddress}
      setFieldAddress={setFieldAddress}
    />

    {/* Các panel nổi trên map */}
    <div className="pointer-events-none absolute inset-0 z-40 p-4">
      <div
        className="
          grid h-full min-h-0 gap-4
          grid-cols-[18rem_minmax(0,1fr)_20rem]
          grid-rows-[auto_minmax(0,1fr)_auto]
        "
      >
        {/* ================= LEFT TOP ================= */}
        <div className="pointer-events-auto col-start-1 row-start-1">
          {deviceCreateMode ? (
            <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/95 p-4 text-white shadow-2xl backdrop-blur-xl">
              <div className="mb-4">
                <h3 className="font-semibold text-zinc-100">
                  Create device
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Add a device inside the selected field
                </p>
              </div>

              <div className="space-y-4">
                {/* Device name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="device-name"
                    className="block text-xs font-medium text-zinc-400"
                  >
                    Device name
                  </label>

                  <Input
                    id="device-name"
                    value={deviceName}
                    onChange={(event) =>
                      setDeviceName(event.target.value)
                    }
                    placeholder="Soil sensor 01"
                    className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>

                {/* Device type */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="device-type"
                    className="block text-xs font-medium text-zinc-400"
                  >
                    Device type
                  </label>

                  <select
                    id="device-type"
                    value={deviceType}
                    onChange={(event) =>
                      setDeviceType(event.target.value)
                    }
                    className="
                      h-10 w-full rounded-md border border-zinc-700
                      bg-zinc-900 px-3 text-sm text-zinc-100
                      outline-none transition-colors
                      focus:border-emerald-500
                      focus:ring-2 focus:ring-emerald-500/20
                    "
                  >
                    <option value="sensor">Sensor</option>
                    <option value="pump">Pump</option>
                    <option value="valve">Valve</option>
                    <option value="gateway">Gateway</option>
                  </select>
                </div>

                {/* Location */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Location
                  </p>

                  {pendingDevicePoint ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500">
                          Longitude
                        </span>

                        <span className="truncate font-medium text-zinc-200">
                          {Number(
                            pendingDevicePoint.geometry.coordinates[0]
                          ).toFixed(6)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500">
                          Latitude
                        </span>

                        <span className="truncate font-medium text-zinc-200">
                          {Number(
                            pendingDevicePoint.geometry.coordinates[1]
                          ).toFixed(6)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs leading-5 text-amber-400">
                      Click a position inside the selected field.
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleSaveDevice}
                    disabled={!pendingDevicePoint || !deviceName.trim()}
                    className="flex-1 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                  >
                    Save device
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelCreateDevice}
                    className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            selectedField && (
              <FieldInfoPanel
                drawRef={drawRef}
                setFieldName={setFieldName}
                setEditingFeature={setEditingFeature}
                selectedField={selectedField}
                setSelectedField={setSelectedField}
                deleteField={deleteField}
                setDeviceCreateMode={setDeviceCreateMode}
                setPendingDevicePoint={setPendingDevicePoint}
                setFieldAddress={setFieldAddress}
              />
            )
          )}
        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <div className="pointer-events-auto col-start-3 row-span-3 min-h-0">
          <FieldSidebar
            fields={fields}
            mapRef={mapRef}
            setSelectedField={(field) => {
              setSelectedField(field);
              setSelectedDevice(null);
            }}
          />
        </div>

        {/* ================= HEATMAP LEFT BOTTOM ================= */}
        {selectedField && !selectedDevice && (
          <div className="pointer-events-auto col-start-1 row-start-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/95 p-4 text-white shadow-2xl backdrop-blur-xl">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Sensor heatmap
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    Nội suy dữ liệu trong field
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setHeatmapEnabled((current) => !current)
                  }
                  className={
                    heatmapEnabled
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }
                >
                  {heatmapEnabled ? "Tắt" : "Bật"}
                </Button>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="heatmap-metric"
                  className="block text-xs font-medium text-zinc-400"
                >
                  Chỉ số hiển thị
                </label>

                <select
                  id="heatmap-metric"
                  value={heatmapMetric}
                  onChange={(event) =>
                    setHeatmapMetric(event.target.value)
                  }
                  disabled={!heatmapEnabled}
                  className="
                    h-10 w-full rounded-md border border-zinc-700
                    bg-zinc-900 px-3 text-sm text-zinc-100
                    outline-none transition-colors
                    focus:border-emerald-500
                    focus:ring-2 focus:ring-emerald-500/20
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <option value="temperature">
                    Nhiệt độ
                  </option>

                  <option value="humidity">
                    Độ ẩm không khí
                  </option>

                  <option value="soilAdc">
                    Độ ẩm đất
                  </option>

                  <option value="heatIndex">
                    Chỉ số nhiệt
                  </option>
                </select>
              </div>

              {heatmapEnabled && heatmapInfo?.ok && (
                <div className="mt-4 space-y-2">
                  <div className="h-2.5 rounded-full bg-gradient-to-r from-blue-600 via-green-500 via-yellow-400 to-red-500" />

                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>
                      Thấp: {heatmapInfo.minimum}
                    </span>

                    <span>
                      Cao: {heatmapInfo.maximum}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600">
                    {heatmapInfo.sensorCount} sensor ·{" "}
                    {heatmapInfo.cellCount} ô nội suy
                  </p>
                </div>
              )}

              {heatmapEnabled &&
                heatmapInfo?.reason ===
                  "NOT_ENOUGH_SENSOR_DATA" && (
                  <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                    <p className="text-xs leading-5 text-amber-400">
                      Cần ít nhất 2 thiết bị có dữ liệu để tạo
                      heatmap.
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ================= DEVICE DATA BOTTOM CENTER ================= */}
        {selectedField && !selectedDevice && (
          <div className="pointer-events-auto col-start-2 row-start-3 min-w-0">
            <div className="max-h-[42vh] overflow-y-auto rounded-2xl">
              <DeviceDataPanel
                field={selectedField}
                devices={devices}
                selectedDevice={selectedDevice}
                onClose={() => {
                  setSelectedField(null);
                  setSelectedDevice(null);
                  setDevices([]);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ================= DEVICE HISTORY ================= */}
    {selectedDevice && (
      <div
        className="
          absolute inset-y-4 left-4 right-[21rem] z-[70]
          flex items-center justify-center
        "
      >
        <div className="absolute inset-0 rounded-3xl bg-black/40 backdrop-blur-sm" />

        <div
          className="
            relative z-10 max-h-full w-full max-w-5xl
            overflow-y-auto rounded-2xl border border-zinc-800
            bg-zinc-950/95 p-4
            shadow-2xl shadow-black/50
          "
        >
          <div className="mb-4 flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="font-semibold text-zinc-100">
                {selectedDevice.name}
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Lịch sử dữ liệu thiết bị
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedDevice(null)}
              className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Đóng
            </Button>
          </div>

          <DeviceHistory
            deviceId={selectedDevice.id}
            deviceName={selectedDevice.name}
          />
        </div>
      </div>
    )}
  </div>
);
};

export default Dashboard;