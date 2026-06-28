import { useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import maplibregl from "maplibre-gl";

import FieldCard from "./FieldCard";
import FieldSearch from "./FieldSearch";

const FieldSidebar = ({
  fields = [],
  mapRef,
  setSelectedField,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const flyToField = (field) => {
    if (!mapRef?.current) return;
    if (!field?.geometry?.coordinates) return;

    setSelectedField({
      type: "Feature",

      geometry: field.geometry,

      properties: {
        id: field.id,
        name: field.name,
        address: field.address,
        area_m2: field.area_m2,
      },
    });

    const coordinates = field.geometry.coordinates[0];
    const bounds = new maplibregl.LngLatBounds();

    coordinates.forEach((coordinate) => {
      bounds.extend(coordinate);
    });

    mapRef.current.fitBounds(bounds, {
      padding: 50,
      duration: 1500,
      maxZoom: 16,
    });
  };

  return (
    <>
      {/* NÚT ẨN / HIỆN SIDEBAR */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen((previous) => !previous)}
        className={`
          absolute top-6 z-50 flex h-10 w-10
          items-center justify-center rounded-xl
          border border-zinc-700 bg-zinc-900/90
          text-zinc-200 shadow-lg backdrop-blur-xl
          transition-all duration-300
          hover:border-green-500 hover:bg-zinc-800
          ${
            isSidebarOpen
              ? "right-[21rem]"
              : "right-4"
          }
        `}
        aria-label={
          isSidebarOpen
            ? "Ẩn danh sách khu vực"
            : "Hiện danh sách khu vực"
        }
        title={
          isSidebarOpen
            ? "Ẩn danh sách khu vực"
            : "Hiện danh sách khu vực"
        }
      >
        {isSidebarOpen ? (
          <PanelRightClose className="h-5 w-5" />
        ) : (
          <PanelRightOpen className="h-5 w-5" />
        )}
      </button>

      {/* SIDEBAR */}
      <div
        className={`
          absolute bottom-4 right-4 top-4 z-40
          w-80 overflow-hidden rounded-3xl
          border border-zinc-800
          bg-zinc-900/90 shadow-2xl
          backdrop-blur-xl
          transition-transform duration-300 ease-in-out
          ${
            isSidebarOpen
              ? "translate-x-0"
              : "translate-x-[calc(100%+1rem)]"
          }
        `}
      >
        {/* HEADER */}
        <div className="border-b border-zinc-800 p-5">
          <h2 className="text-xl font-semibold text-zinc-100">
            Fields
          </h2>

          <FieldSearch />
        </div>

        {/* FIELD LIST */}
        <div className="flex h-[calc(100%-110px)] flex-col gap-4 overflow-y-auto p-4">
          {fields.length > 0 ? (
            fields.map((field) => (
              <FieldCard
                key={field.id}
                field={field}
                onClick={() => flyToField(field)}
              />
            ))
          ) : (
            <p className="py-6 text-center text-sm text-zinc-500">
              Chưa có khu vực nào
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default FieldSidebar;