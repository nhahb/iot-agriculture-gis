import { area as calculateArea } from '@turf/area';

const formatArea = (areaM2) => {
  if (areaM2 >= 10000) {
    return `${(areaM2 / 10000).toFixed(2)} ha`;
  }

  return `${Math.round(areaM2).toLocaleString('vi-VN')} m²`;
};

export const updateFieldLayers = (map, fields) => {
  const geojsonData = {
    type: 'FeatureCollection',

    features: fields
      .filter((field) => field?.geometry)
      .map((field) => {
        const geometry =
          typeof field.geometry === 'string'
            ? JSON.parse(field.geometry)
            : field.geometry;

        const feature = {
          type: 'Feature',
          geometry,
          properties: {}
        };

        const areaM2 = calculateArea(feature);
        const areaHa = areaM2 / 10000;

        return {
          type: 'Feature',

          geometry,

          properties: {
            id: field.id,
            name: field.name,
            areaM2,
            areaHa,
            areaLabel: formatArea(areaM2),
            label: `${field.name}\n${formatArea(areaM2)}`
          }
        };
      })
  };

  const source = map.getSource('fields');

  if (source) {
    source.setData(geojsonData);
    return;
  }

  map.addSource('fields', {
    type: 'geojson',
    data: geojsonData
  });

  // Màu nền polygon
  map.addLayer({
    id: 'fields-layer',
    type: 'fill',
    source: 'fields',

    paint: {
      'fill-color': '#10b981',
      'fill-opacity': 0.22
    }
  });

  // Đường viền polygon
  map.addLayer({
    id: 'fields-outline',
    type: 'line',
    source: 'fields',

    paint: {
      'line-color': '#34d399',
      'line-width': 2.5,
      'line-opacity': 0.95
    }
  });

  // Nhãn tên và diện tích
  map.addLayer({
    id: 'fields-labels',
    type: 'symbol',
    source: 'fields',

    layout: {
      'text-field': ['get', 'label'],
      'text-size': 14,
      'text-anchor': 'center',
      'text-justify': 'center',
      'text-allow-overlap': false,
      'text-ignore-placement': false
    },

    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#18181b',
      'text-halo-width': 2,
      'text-halo-blur': 0.5
    }
  });
};