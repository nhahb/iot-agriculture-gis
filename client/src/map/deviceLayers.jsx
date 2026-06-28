export const updateDeviceLayers = (map, devices = []) => {
  const geojsonData = {
    type: "FeatureCollection",

    features: devices
      .filter((device) => device?.geometry)
      .map((device) => {
        const geometry =
          typeof device.geometry === "string"
            ? JSON.parse(device.geometry)
            : device.geometry;

        return {
          type: "Feature",
          geometry,

          properties: {
            id: device.id,
            name: device.name || "Unnamed device",
            fieldId: device.field_id,
            type: device.type || "sensor",
            status: device.status || "offline",
          },
        };
      }),
  };

  let source = map.getSource("devices");

  if (source) {
    source.setData(geojsonData);
  } else {
    map.addSource("devices", {
      type: "geojson",
      data: geojsonData,
    });

    source = map.getSource("devices");
  }

  /*
   * Màu theo trạng thái:
   * online/active  -> xanh lá
   * warning       -> vàng
   * critical      -> đỏ
   * offline       -> xám
   */
  const statusColor = [
    "match",
    ["downcase", ["to-string", ["get", "status"]]],

    "online",
    "#34d399",

    "active",
    "#34d399",

    "warning",
    "#fbbf24",

    "critical",
    "#fb7185",

    "error",
    "#fb7185",

    "offline",
    "#71717a",

    "#22d3ee",
  ];

  // Vòng sáng bên ngoài
  if (!map.getLayer("devices-glow")) {
    map.addLayer({
      id: "devices-glow",
      type: "circle",
      source: "devices",

      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          8,
          10,
          14,
          16,
          18,
          22,
        ],

        "circle-color": statusColor,
        "circle-opacity": 0.25,
        "circle-blur": 0.65,
      },
    });
  }

  // Chấm device chính
  if (!map.getLayer("devices-layer")) {
    map.addLayer({
      id: "devices-layer",
      type: "circle",
      source: "devices",

      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          8,
          5,
          14,
          7,
          18,
          9,
        ],

        "circle-color": statusColor,

        "circle-stroke-width": 2,
        "circle-stroke-color": "#18181b",
        "circle-opacity": 1,
      },
    });
  }

  // Chấm nhỏ ở giữa
  if (!map.getLayer("devices-center")) {
    map.addLayer({
      id: "devices-center",
      type: "circle",
      source: "devices",

      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          8,
          1.5,
          14,
          2,
          18,
          2.5,
        ],

        "circle-color": "#ffffff",
        "circle-opacity": 0.95,
      },
    });
  }

  // Tên thiết bị
  if (!map.getLayer("devices-label")) {
    map.addLayer({
      id: "devices-label",
      type: "symbol",
      source: "devices",

      minzoom: 13,

      layout: {
        "text-field": ["get", "name"],
        "text-size": 12,
        "text-font": ["Open Sans Semibold"],
        "text-anchor": "top",
        "text-offset": [0, 1.1],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },

      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "#18181b",
        "text-halo-width": 2,
        "text-halo-blur": 0.5,
      },
    });
  }
};