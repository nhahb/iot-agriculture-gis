const statusColor = {
  healthy: "bg-green-500",
  warning: "bg-yellow-500",
  critical: "bg-red-500",
};

const formatArea = (areaM2) => {
  const area = Number(areaM2);

  if (!area || Number.isNaN(area)) {
    return "Chưa có diện tích";
  }

  if (area >= 10000) {
    return `${(area / 10000).toFixed(2)} ha`;
  }

  return `${Math.round(area).toLocaleString("vi-VN")} m²`;
};

const FieldCard = ({ field, onClick }) => {
  return (
    <button
      className="group rounded-2xl border border-zinc-800 p-4 text-left transition hover:border-green-500 hover:bg-zinc-800"
      onClick={onClick}
    >
      {/* TOP */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-medium text-zinc-100">
            {field.name}
          </h3>
        </div>

        <div
          className={`h-3 w-3 rounded-full ${
            statusColor[field.status] || "bg-zinc-500"
          }`}
        />
      </div>

      {/* FIELD INFO */}
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-zinc-500">Địa chỉ</span>

          <span className="max-w-[170px] truncate font-medium text-zinc-200">
            {field.address || "Chưa có địa chỉ"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-zinc-500">Diện tích</span>

          <span className="font-medium text-zinc-200">
            {formatArea(field.area_m2)}
          </span>
        </div>
      </div>
    </button>
  );
};

export default FieldCard;