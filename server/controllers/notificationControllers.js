const notificationModel = require("../model/notification.model");
const getUserId = (req) => {
  return req.user?.id ?? req.id;
};
exports.getNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Không xác định được người dùng" });
    }
    const notifications =
      await notificationModel.findNotificationsByUserId(userId);
    const unreadCount = notifications.filter(
      (notification) => !Boolean(notification.is_read),
    ).length;
    return res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res
      .status(500)
      .json({ message: "Không thể lấy danh sách thông báo" });
  }
};
exports.markAsRead = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { notificationId } = req.params;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Không xác định được người dùng" });
    }
    const updated = await notificationModel.markNotificationAsRead({
      notificationId,
      userId,
    });
    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    }
    return res.status(200).json({ message: "Đã đánh dấu thông báo là đã đọc" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ message: "Không thể cập nhật thông báo" });
  }
};
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Không xác định được người dùng" });
    }
    const updatedCount =
      await notificationModel.markAllNotificationsAsRead(userId);
    return res
      .status(200)
      .json({ message: "Đã đánh dấu tất cả là đã đọc", updatedCount });
  } catch (error) {
    console.error("Mark all notifications error:", error);
    return res.status(500).json({ message: "Không thể cập nhật thông báo" });
  }
};
