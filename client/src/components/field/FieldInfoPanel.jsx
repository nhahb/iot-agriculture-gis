
import {
  MapPinned,
  Pencil,
  Plus,
  Ruler,
  Trash2,
  X,
} from "lucide-react";

import { toast } from "sonner";
import { Button } from "../ui/button";

const FieldInfoPanel = ({
  drawRef,
  setFieldName,
  setEditingFeature,
  selectedField,
  setSelectedField,
  deleteField,
  setDeviceCreateMode,
  setPendingDevicePoint,
  setFieldAddress,
}) => {
  if (!selectedField) return null;

  const properties = selectedField.properties || {};

  const fieldName =
    properties.name || "Field chưa đặt tên";

  const fieldAddress =
    properties.address || "Chưa có địa chỉ";

  const fieldArea =
    properties.areaLabel || "89.92 ha";

  const handleClose = () => {
    setSelectedField(null);
    setDeviceCreateMode(false);
    setPendingDevicePoint(null);
  };

  const handleDelete = async (feature) => {
    if (!feature) return;

    const name =
      feature.properties?.name || "field này";

    const isConfirm = window.confirm(
      `Bạn có chắc chắn muốn xóa "${name}" không?`
    );

    if (!isConfirm) return;

    try {
      await deleteField(feature.properties.id);

      setSelectedField(null);
      setPendingDevicePoint(null);
      setDeviceCreateMode(false);

      toast.success("Đã xóa field");
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa field");
    }
  };

  const handleEdit = (feature) => {
    if (!feature?.geometry) return;

    if (!drawRef.current) {
      toast.error("Bản đồ chưa sẵn sàng");
      return;
    }

    /*
     * Mapbox Draw nên nhận một GeoJSON Feature,
     * thay vì chỉ truyền geometry.
     */
    const editableFeature = {
      type: "Feature",
      properties: {},
      geometry: structuredClone(feature.geometry),
    };

    const drawIds =
      drawRef.current.add(editableFeature);

    const drawFeatureId = drawIds[0];

    drawRef.current.changeMode("direct_select", {
      featureId: drawFeatureId,
    });

    setFieldName(
      feature.properties?.name || ""
    );

    setFieldAddress(
      feature.properties?.address || ""
    );

    setEditingFeature({
      fieldId: feature.properties?.id,
      drawFeatureId,
    });
  };

  const handleAddDevice = (feature) => {
    if (!feature) return;

    if (!drawRef.current) {
      toast.error("Bản đồ chưa sẵn sàng");
      return;
    }

    setSelectedField(feature);
    setPendingDevicePoint(null);
    setDeviceCreateMode(true);

    drawRef.current.changeMode("draw_point");

    toast.info(
      "Chọn một vị trí bên trong field để đặt thiết bị"
    );
  };

  return (
    <section
      className="
        w-full overflow-hidden rounded-2xl
        border border-zinc-800
        bg-zinc-950/95 text-white
        shadow-2xl shadow-black/40
        backdrop-blur-xl
      "
    >
      {/* HEADER */}
      <header className="flex items-start justify-between gap-3 border-b border-zinc-800 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <MapPinned className="size-4.5" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Field đang chọn
            </p>

            <h2
              className="mt-0.5 truncate text-sm font-semibold text-zinc-100"
              title={fieldName}
            >
              {fieldName}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng thông tin field"
          className="
            flex size-8 shrink-0 items-center justify-center
            rounded-lg text-zinc-500
            transition-colors
            hover:bg-zinc-800 hover:text-zinc-100
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-emerald-500/40
          "
        >
          <X className="size-4" />
        </button>
      </header>

      {/* FIELD INFORMATION */}
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="flex items-center gap-1.5 text-zinc-500">
              <Ruler className="size-3.5" />

              <span className="text-[10px] uppercase tracking-wide">
                Diện tích
              </span>
            </div>

            <p className="mt-1.5 truncate text-sm font-medium text-zinc-200">
              {fieldArea}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              Mã field
            </p>

            <p className="mt-1.5 truncate text-sm font-medium text-zinc-200">
              #{properties.id ?? "--"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            Địa chỉ
          </p>

          <p
            className="mt-1.5 line-clamp-2 text-xs leading-5 text-zinc-300"
            title={fieldAddress}
          >
            {fieldAddress}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="space-y-2 pt-1">
          <Button
            type="button"
            onClick={() =>
              handleAddDevice(selectedField)
            }
            className="
              h-9 w-full gap-2
              bg-emerald-500 text-xs font-medium
              text-zinc-950
              hover:bg-emerald-400
            "
          >
            <Plus className="size-4" />
            Thêm thiết bị
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                handleEdit(selectedField)
              }
              className="
                h-9 gap-2 border-zinc-700
                bg-zinc-900 text-xs text-zinc-300
                hover:bg-zinc-800 hover:text-white
              "
            >
              <Pencil className="size-3.5" />
              Chỉnh sửa
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                handleDelete(selectedField)
              }
              className="
                h-9 gap-2
                border-red-500/20
                bg-red-500/5
                text-xs text-red-400
                hover:border-red-500/30
                hover:bg-red-500/10
                hover:text-red-300
              "
            >
              <Trash2 className="size-3.5" />
              Xóa field
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FieldInfoPanel;
