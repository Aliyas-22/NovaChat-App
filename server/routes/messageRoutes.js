const express = require("express");
const router = express.Router();
const {
    getMessages,
    sendMessage,
    toggleReaction,
    deleteMessage,
    getUnreadCounts,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/unread", getUnreadCounts);
router.get("/:userId", getMessages);
router.post("/send", sendMessage);
router.post("/:messageId/reaction", toggleReaction);
router.delete("/:messageId", deleteMessage);

module.exports = router;