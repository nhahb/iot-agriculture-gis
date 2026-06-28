import { useState } from "react";
import { Activity, X } from "lucide-react";
import { toast } from "sonner";

import DeviceDataCard from "./DeviceDataCard";

const DeviceDataPanel = ({
  field,
  devices = [],
  onClose,
  controlPump,
}) => {
  const [updatingDeviceId, setUpdatingDeviceId] =
    useState(null);

  if (!field) return null;

  const handleTogglePump = async (
    selectedDevice,
    nextPumpState
  ) => {
    if (typeof controlPump !== "function") {
      toast.error(
        "Chức năng điều khiển bơm chưa được cấu hình"
      );
      return;
    }

    try {
      setUpdatingDeviceId(selectedDevice.id);

      await controlPump(
        selectedDevice.id,
        nextPumpState
      );

      toast.success(
        nextPumpState
          ? "Đã gửi lệnh bật bơm"
          : "Đã gửi lệnh tắt bơm"
      );
    } catch (error) {
      console.error(
        "Pump control error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Gửi lệnh điều khiển bơm thất bại"
      );
    } finally {
      setUpdatingDeviceId(null);
    }
  };

  return (
    <section
      className="
        flex w-full min-w-0 flex-col
        overflow-hidden rounded-2xl
        border border-zinc-800
        bg-zinc-950/95 text-white
        shadow-2xl shadow-black/40
        backdrop-blur-xl
      "
    >
      {/* HEADER */}
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Activity className="size-5" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-zinc-100">
              Dữ liệu cảm biến
            </h2>

            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {field.name} · {devices.length} thiết bị
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng dữ liệu cảm biến"
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
        )}
      </header>

      {/* DEVICE LIST */}
      <div className="min-w-0 p-4">
        {devices.length === 0 ? (
          <div className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-5 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
              <Activity className="size-5" />
            </div>

            <p className="text-sm font-medium text-zinc-300">
              Chưa có thiết bị
            </p>

            <p className="mt-1 max-w-64 text-xs leading-5 text-zinc-600">
              Hãy thêm thiết bị vào field để bắt đầu
              nhận và hiển thị dữ liệu.
            </p>
          </div>
        ) : (
          <div
            className="
              flex min-w-0 snap-x snap-mandatory
              gap-3 overflow-x-auto overflow-y-hidden
              pb-2
              [scrollbar-color:#3f3f46_transparent]
              [scrollbar-width:thin]
            "
          >
            {devices.map((device) => (
              <div
                key={device.id}
                className="
                  w-[360px] min-w-[360px]
                  shrink-0 snap-start
                  sm:w-[380px] sm:min-w-[380px]
                "
              >
                <DeviceDataCard
                  device={device}
                  isPumpUpdating={
                    updatingDeviceId === device.id
                  }
                  onTogglePump={handleTogglePump}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default DeviceDataPanel;