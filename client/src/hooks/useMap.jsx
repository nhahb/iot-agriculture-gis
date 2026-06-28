import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import { MAP_STYLE } from "../map/mapConfig";
import styles from "../map/drawStyles";

const useMap = (mapContainerRef) => {
  const mapRef = useRef(null);
  const drawRef = useRef(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [105.87448711105412, 20.973177751134074],
      zoom: 12
    });

    mapRef.current = map;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      styles: styles
    });
    drawRef.current = draw;
    mapRef.current.addControl(draw, 'top-left');

    return () => mapRef.current.remove();
  }, []);

  return { mapRef, drawRef };
};

export default useMap;