const express = require("express");
const notificationController = require("../controllers/notificationControllers");
const { verifyJWT } = require("../middlewares/middlewares");
const router = express.Router();

router.get("/", verifyJWT, notificationController.getNotifications);
router.patch("/read-all", verifyJWT, notificationController.markAllAsRead);
router.patch(
  "/:notificationId/read",
  verifyJWT,
  notificationController.markAsRead,
);

module.exports = router;