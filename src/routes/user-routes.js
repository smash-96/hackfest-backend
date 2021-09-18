const express = require("express");
const {
  addUser,
  fetchOnlineUsers,
  broadcastRequest,
  trackRequests,
  sendMessage,
  fetchMessages,
  deleteRequest,
  nextUser,
} = require("../controller/user-controller");

const router = express.Router();

router.post("/user", addUser);
router.get("/user/fetch-online", fetchOnlineUsers);
router.post("/user/broadcast-request", broadcastRequest);
router.patch("/user/track-requests", trackRequests);
router.post("/user/send-message", sendMessage);
router.get("/user/fetch-messages", fetchMessages);
router.delete("/user/delete", deleteRequest);
// router.get("/students", getAllStudents);
// router.get("/student/:id", getStudent);
// router.put("/student/:id", updateStudent);
// router.delete("/student/:id", deleteStudent);

module.exports = {
  routes: router,
};
