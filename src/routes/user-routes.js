const express = require("express");
const {
  addUser,
  fetchOnlineUsers,
  broadcastRequest,
  checkRequests,
  sendMessage,
  fetchMessages,
  deleteRequest,
  nextUser,
} = require("../controller/user-controller");

const router = express.Router();

router.post("/user", addUser);
router.get("/user/fetch-online", fetchOnlineUsers);
router.post("/user/broadcast-request", broadcastRequest);
router.patch("/user/check-requests", checkRequests);
router.post("/user/send-message", sendMessage);
router.get("/user/fetch-messages", fetchMessages);
router.delete("/user/delete", deleteRequest);

module.exports = {
  routes: router,
};
