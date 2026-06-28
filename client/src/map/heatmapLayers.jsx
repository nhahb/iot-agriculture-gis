import * as turf from '@turf/turf';

const HEATMAP_SOURCE_ID =
  'sensor-heatmap-source';

const HEATMAP_FILL_LAYER_ID =
  'sensor-heatmap-fill';

const HEATMAP_LINE_LAYER_ID =
  'sensor-heatmap-line';

const getMetricValue = (
  device,
  metric
) => {
  const latestData = device.latestData;

  if (!latestData) return null;

  const metricMap = {
    temperature:
      latestData.temperature,

    humidity:
      latestData.humidity,

    soilAdc:
      latestData.soilAdc,

    heatIndex:
      latestData.heatIndexC
  };

  const value = Number(
    metricMap[metric]
  );

  return Number.isFinite(value)
    ? value
    : null;
};

const createSensorPoints = (
  devices,
  metric
) => {
  const features = devices
    .map((device) => {
      if (
        !device.geometry ||
        device.geometry.type !== 'Point'
      ) {
        return null;
      }

      const value =
        getMetricValue(
          device,
          metric
        );

      if (value === null) {
        return null;
      }

      return turf.point(
        device.geometry.coordinates,
        {
          deviceId: device.id,
          deviceName: device.name,
          value
        }
      );
    })
    .filter(Boolean);

  return turf.featureCollection(
    features
  );
};

const normalizeGridValues = (
  grid,
  minimum,
  maximum
) => {
  const range = maximum - minimum;

  grid.features.forEach((cell) => {
    const value = Number(
      cell.properties?.value
    );

    if (!Number.isFinite(value)) {
      cell.properties.normalized = 0;
      return;
    }

    const normalized =
      range === 0
        ? 0.5
        : (value - minimum) / range;

    cell.properties.value =
      Number(value.toFixed(2));

    cell.properties.normalized =
      Math.max(
        0,
        Math.min(1, normalized)
      );
  });

  return grid;
};

export const buildSensorHeatmap = ({
  field,
  devices,
  metric = 'temperature',

  // 0.02 km = ô khoảng 20 mét
  cellSizeKm = 0.02
}) => {
  if (!field?.geometry) {
    return {
      ok: false,
      reason: 'FIELD_NOT_FOUND'
    };
  }

  const sensorPoints =
    createSensorPoints(
      devices,
      metric
    );

  /*
   * Một điểm vẫn có thể nội suy,
   * nhưng toàn bộ field gần như
   * chỉ có một màu nên không có ý nghĩa.
   */
  if (
    sensorPoints.features.length < 2
  ) {
    return {
      ok: false,
      reason:
        'NOT_ENOUGH_SENSOR_DATA',
      sensorCount:
        sensorPoints.features.length
    };
  }

  const values =
    sensorPoints.features.map(
      (feature) =>
        Number(
          feature.properties.value
        )
    );

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);

  const fieldBoundingBox =
    turf.bbox(field);

  /*
   * Turf.interpolate sử dụng IDW.
   * weight = 2 khiến sensor gần
   * có ảnh hưởng lớn hơn sensor xa.
   */
  const interpolatedGrid =
    turf.interpolate(
      sensorPoints,
      cellSizeKm,
      {
        gridType: 'square',
        property: 'value',
        units: 'kilometers',
        weight: 2,
        bbox: fieldBoundingBox
      }
    );

  /*
   * Chỉ giữ các ô có tâm nằm
   * bên trong field.
   */
  const cellsInsideField =
    interpolatedGrid.features.filter(
      (cell) => {
        const center =
          turf.centroid(cell);

        return turf.booleanPointInPolygon(
          center,
          field
        );
      }
    );

  const heatmap =
    turf.featureCollection(
      cellsInsideField
    );

  normalizeGridValues(
    heatmap,
    minimum,
    maximum
  );

  return {
    ok: true,
    data: heatmap,
    sensorCount:
      sensorPoints.features.length,
    cellCount:
      heatmap.features.length,
    minimum,
    maximum
  };
};

export const updateSensorHeatmapLayer = ({
  map,
  field,
  devices,
  metric = 'temperature',
  cellSizeKm = 0.02
}) => {
  if (!map) {
    return {
      ok: false,
      reason: 'MAP_NOT_FOUND'
    };
  }

  const result =
    buildSensorHeatmap({
      field,
      devices,
      metric,
      cellSizeKm
    });

  if (!result.ok) {
    removeSensorHeatmapLayer(map);
    return result;
  }

  const existingSource =
    map.getSource(
      HEATMAP_SOURCE_ID
    );

  if (existingSource) {
    existingSource.setData(
      result.data
    );
  } else {
    map.addSource(
      HEATMAP_SOURCE_ID,
      {
        type: 'geojson',
        data: result.data
      }
    );
  }

  if (
    !map.getLayer(
      HEATMAP_FILL_LAYER_ID
    )
  ) {
    const beforeLayer =
      map.getLayer('devices-layer')
        ? 'devices-layer'
        : undefined;

    map.addLayer(
      {
        id:
          HEATMAP_FILL_LAYER_ID,

        type: 'fill',

        source:
          HEATMAP_SOURCE_ID,

        paint: {
          /*
           * Xanh dương: giá trị thấp
           * Xanh lá: trung bình thấp
           * Vàng: trung bình cao
           * Đỏ: giá trị cao
           */
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'normalized'],

            0,
            '#2563eb',

            0.33,
            '#22c55e',

            0.66,
            '#facc15',

            1,
            '#ef4444'
          ],

          'fill-opacity': 0.72
        }
      },

      beforeLayer
    );
  }

  if (
    !map.getLayer(
      HEATMAP_LINE_LAYER_ID
    )
  ) {
    const beforeLayer =
      map.getLayer('devices-layer')
        ? 'devices-layer'
        : undefined;

    map.addLayer(
      {
        id:
          HEATMAP_LINE_LAYER_ID,

        type: 'line',

        source:
          HEATMAP_SOURCE_ID,

        paint: {
          'line-color':
            'rgba(255,255,255,0.15)',

          'line-width': 0.4
        }
      },

      beforeLayer
    );
  }

  return result;
};

export const removeSensorHeatmapLayer = (
  map
) => {
  if (!map) return;

  if (
    map.getLayer(
      HEATMAP_LINE_LAYER_ID
    )
  ) {
    map.removeLayer(
      HEATMAP_LINE_LAYER_ID
    );
  }

  if (
    map.getLayer(
      HEATMAP_FILL_LAYER_ID
    )
  ) {
    map.removeLayer(
      HEATMAP_FILL_LAYER_ID
    );
  }

  if (
    map.getSource(
      HEATMAP_SOURCE_ID
    )
  ) {
    map.removeSource(
      HEATMAP_SOURCE_ID
    );
  }
};
