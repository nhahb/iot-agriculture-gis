import {
  useCallback,
  useMemo,
  useState,
} from "react";

import useAxiosPrivate from "./useAxiosPrivate";

const useNotifications = () => {
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

        setNotifications(
          response.data.notifications || []
        );

        return response.data;
      } finally {
        setIsLoading(false);
      }
    }, [axiosPrivate]);

  const markAsRead = async (
    notificationId
  ) => {
    await axiosPrivate.patch(
      `/notification/${notificationId}/read`
    );

    setNotifications(
      (currentNotifications) =>
        currentNotifications.map(
          (notification) =>
            Number(notification.id) ===
            Number(notificationId)
              ? {
                  ...notification,
                  is_read: 1,
                  isRead: 1,
                }
              : notification
        )
    );
  };

  const markAllAsRead = async () => {
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
  };

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !Boolean(
            notification.is_read ??
              notification.isRead
          )
      ).length,
    [notifications]
  );

  return {
    notifications,
    setNotifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};

export default useNotifications;

