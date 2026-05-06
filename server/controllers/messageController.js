const Message = require("../models/Message");
const User = require("../models/User");

// @desc    Get messages between two users
// @route   GET /api/messages/:userId
const getMessages = async (req, res) => {
    try {
        const myId = req.user._id;
        const { userId } = req.params;
        const { page = 1, limit = 30 } = req.query;

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: userId },
                { sender: userId, receiver: myId },
            ],
            isDeleted: false,
        })
            .populate("sender", "username avatar")
            .populate("receiver", "username avatar")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        // Mark messages as read
        await Message.updateMany(
            { sender: userId, receiver: myId, isRead: false },
            { isRead: true }
        );

        res.json({ messages: messages.reverse() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send a message
// @route   POST /api/messages/send
const sendMessage = async (req, res) => {
    try {
        const {
            receiverId,
            content,
            type = "text",
            fileUrl,
            fileName,
            fileSize,
        } = req.body;

        if (!receiverId) {
            return res.status(400).json({ message: "Receiver is required" });
        }
        if (type === "text" && !content?.trim()) {
            return res.status(400).json({ message: "Message content is required" });
        }

        const receiver = await User.findById(receiverId);
        if (!receiver)
            return res.status(404).json({ message: "Receiver not found" });

        const message = await Message.create({
            sender: req.user._id,
            receiver: receiverId,
            content: content || "",
            type,
            fileUrl,
            fileName,
            fileSize,
        });

        const populated = await message.populate([
            { path: "sender", select: "username avatar" },
            { path: "receiver", select: "username avatar" },
        ]);

        res.status(201).json({ message: populated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add/toggle emoji reaction
// @route   POST /api/messages/:messageId/reaction
const toggleReaction = async (req, res) => {
    try {
        const { emoji } = req.body;
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message)
            return res.status(404).json({ message: "Message not found" });

        const existingReaction = message.reactions.find((r) => r.emoji === emoji);

        if (existingReaction) {
            const userIndex = existingReaction.users.indexOf(userId.toString());
            if (userIndex > -1) {
                existingReaction.users.splice(userIndex, 1);
                if (existingReaction.users.length === 0) {
                    message.reactions = message.reactions.filter(
                        (r) => r.emoji !== emoji
                    );
                }
            } else {
                existingReaction.users.push(userId);
            }
        } else {
            message.reactions.push({ emoji, users: [userId] });
        }

        await message.save();
        res.json({ reactions: message.reactions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:messageId
const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);
        if (!message)
            return res.status(404).json({ message: "Message not found" });

        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        message.isDeleted = true;
        message.content = "This message was deleted";
        await message.save();

        res.json({ message: "Message deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get unread message count per contact
// @route   GET /api/messages/unread
const getUnreadCounts = async (req, res) => {
    try {
        const userId = req.user._id;
        const unread = await Message.aggregate([
            { $match: { receiver: userId, isRead: false } },
            { $group: { _id: "$sender", count: { $sum: 1 } } },
        ]);
        res.json({ unread });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMessages,
    sendMessage,
    toggleReaction,
    deleteMessage,
    getUnreadCounts,
};