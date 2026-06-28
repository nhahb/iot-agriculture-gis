import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import useAxiosPrivate from "@/hooks/useAxiosPrivate";

const NotificationContext =
  createContext(null);

const isNotificationUnread = (
  notification
) => {
  const value =
    notification.is_read ??
    notification.isRead ??
    0;

  return Number(value) === 0;
};

export const NotificationProvider = ({
  children,
}) => {
  const axiosPrivate = useAxiosPrivate();

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const fetchNotifications =
    useCallback(async () => {
      setIsLoading(true);

      try {
        const response =
          await axiosPrivate.get(
            "/notification"
          );

        const receivedNotifications =
          response.data.notifications || [];

        setNotifications(
          receivedNotifications
        );

        return response.data;
      } finally {
        setIsLoading(false);
      }
    }, [axiosPrivate]);

  const addNotification =
    useCallback((notification) => {
      if (!notification) return;

      setNotifications(
        (currentNotifications) => {
          const alreadyExists =
            currentNotifications.some(
              (item) =>
                Number(item.id) ===
                Number(notification.id)
            );

          if (alreadyExists) {
            return currentNotifications;
          }

          return [
            notification,
            ...currentNotifications,
          ];
        }
      );
    }, []);

  const markAsRead =
    useCallback(
      async (notificationId) => {
        await axiosPrivate.patch(
          `/notification/${notificationId}/read`
        );

        setNotifications(
          (currentNotifications) =>
            currentNotifications.map(
              (notification) => {
                if (
                  Number(notification.id) !==
                  Number(notificationId)
                ) {
                  return notification;
                }

                return {
                  ...notification,
                  is_read: 1,
                  isRead: 1,
                };
              }
            )
        );
      },
      [axiosPrivate]
    );

  const markAllAsRead =
    useCallback(async () => {
      await axiosPrivate.patch(
        "/notification/read-all"
      );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) => ({
              ...notification,
              is_read: 1,
              isRead: 1,
            })
          )
      );
    }, [axiosPrivate]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        isNotificationUnread
      ).length,
    [notifications]
  );

  useEffect(() => {
    fetchNotifications().catch(
      (error) => {
        console.error(
          "Không thể tải thông báo:",
          error
        );
      }
    );
  }, [fetchNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      setNotifications,
      unreadCount,
      isLoading,
      fetchNotifications,
      addNotification,
      markAsRead,
      markAllAsRead,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      fetchNotifications,
      addNotification,
      markAsRead,
      markAllAsRead,
    ]
  );

  return (
    <NotificationContext.Provider
      value={value}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(
    NotificationContext
  );

  if (!context) {
    throw new Error(
      "useNotificationContext phải được sử dụng bên trong NotificationProvider"
    );
  }

  return context;
};

export default NotificationContext;
