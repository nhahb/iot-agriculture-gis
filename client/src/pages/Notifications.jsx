import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CircleAlert,
  Info,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  useNotificationContext,
} from "@/context/NotificationContext";

const severityStyles = {
  critical: {
    icon: CircleAlert,
    iconClass:
      "bg-red-500/10 text-red-400",
    badge:
      "bg-red-500/10 text-red-400",
  },

  warning: {
    icon: AlertTriangle,
    iconClass:
      "bg-amber-500/10 text-amber-400",
    badge:
      "bg-amber-500/10 text-amber-400",
  },

  info: {
    icon: Info,
    iconClass:
      "bg-sky-500/10 text-sky-400",
    badge:
      "bg-sky-500/10 text-sky-400",
  },
};

const formatDate = (value) => {
  if (!value) return "Không xác định";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Không xác định";
  }

  return date.toLocaleString("vi-VN");
};

const Notifications = () => {
  const {
  notifications,
  unreadCount,
  isLoading,
  markAsRead,
  markAllAsRead,
} = useNotificationContext();

  const [filter, setFilter] =
    useState("all");

  // useEffect(() => {
  //   fetchNotifications().catch(
  //     (error) => {
  //       console.error(error);

  //       toast.error(
  //         "Không thể tải danh sách thông báo"
  //       );
  //     }
  //   );
  // }, [fetchNotifications]);

  const filteredNotifications =
    useMemo(() => {
      if (filter === "unread") {
        return notifications.filter(
          (notification) =>
            !Boolean(
              notification.is_read ??
                notification.isRead
            )
        );
      }

      return notifications;
    }, [notifications, filter]);

  const handleMarkAsRead = async (
    notification
  ) => {
    const isRead = Boolean(
      notification.is_read ??
        notification.isRead
    );

    if (isRead) return;

    try {
      await markAsRead(notification.id);
    } catch (error) {
      console.error(error);

      toast.error(
        "Không thể cập nhật thông báo"
      );
    }
  };

  const handleMarkAllAsRead =
    async () => {
      try {
        await markAllAsRead();

        toast.success(
          "Đã đánh dấu tất cả là đã đọc"
        );
      } catch (error) {
        console.error(error);

        toast.error(
          "Không thể cập nhật thông báo"
        );
      }
    };

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Bell className="size-5" />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-zinc-100">
                Thông báo
              </h1>

              <p className="mt-0.5 text-sm text-zinc-500">
                {unreadCount} thông báo chưa đọc
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={unreadCount === 0}
            onClick={handleMarkAllAsRead}
            className="border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
          >
            <CheckCheck className="mr-2 size-4" />
            Đánh dấu tất cả đã đọc
          </Button>
        </header>

        <div className="mb-4 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={
              filter === "all"
                ? "default"
                : "outline"
            }
            onClick={() => setFilter("all")}
          >
            Tất cả
          </Button>

          <Button
            type="button"
            size="sm"
            variant={
              filter === "unread"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setFilter("unread")
            }
          >
            Chưa đọc ({unreadCount})
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 text-center text-sm text-zinc-500">
            Đang tải thông báo...
          </div>
        ) : filteredNotifications.length ===
          0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
            <Bell className="mb-3 size-8 text-zinc-600" />

            <p className="font-medium text-zinc-300">
              Chưa có thông báo
            </p>

            <p className="mt-1 text-sm text-zinc-600">
              Các cảnh báo và sự kiện từ thiết bị
              sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map(
              (notification) => {
                const severity =
                  severityStyles[
                    notification.severity
                  ] || severityStyles.info;

                const SeverityIcon =
                  severity.icon;

                const isRead = Boolean(
                  notification.is_read ??
                    notification.isRead
                );

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() =>
                      handleMarkAsRead(
                        notification
                      )
                    }
                    className={`
                      flex w-full items-start gap-3
                      rounded-2xl border p-4
                      text-left transition-colors
                      ${
                        isRead
                          ? "border-zinc-800 bg-zinc-900/40"
                          : "border-emerald-500/20 bg-zinc-900"
                      }
                      hover:border-zinc-700
                    `}
                  >
                    <div
                      className={`
                        flex size-10 shrink-0
                        items-center justify-center
                        rounded-xl
                        ${severity.iconClass}
                      `}
                    >
                      <SeverityIcon className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold text-zinc-100">
                          {notification.title}
                        </h2>

                        {!isRead && (
                          <span className="size-2 rounded-full bg-emerald-400" />
                        )}

                        <span
                          className={`
                            rounded-full px-2 py-0.5
                            text-[10px] font-medium
                            ${severity.badge}
                          `}
                        >
                          {notification.severity}
                        </span>
                      </div>

                      <p className="mt-1 text-sm leading-6 text-zinc-400">
                        {notification.message}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
                        {notification.field_name && (
                          <span>
                            Khu vực:{" "}
                            {notification.field_name}
                          </span>
                        )}

                        {notification.device_name && (
                          <span>
                            Thiết bị:{" "}
                            {notification.device_name}
                          </span>
                        )}

                        <span>
                          {formatDate(
                            notification.created_at ??
                              notification.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default Notifications;