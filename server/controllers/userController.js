const User = require("../models/User");
const Message = require("../models/Message");

// @desc    Search users
// @route   GET /api/users/search?q=query
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 1) {
            return res.json({ users: [] });
        }

        const users = await User.find({
            $and: [
                { _id: { $ne: req.user._id } },
                {
                    $or: [
                        { username: { $regex: q, $options: "i" } },
                        { email: { $regex: q, $options: "i" } },
                    ],
                },
            ],
        })
            .select("username email avatar bio isOnline lastSeen")
            .limit(10);

        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all contacts (users you've chatted with)
// @route   GET /api/users/contacts
const getContacts = async (req, res) => {
    try {
        const userId = req.user._id;

        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }],
        }).select("sender receiver createdAt");

        const contactIds = new Set();
        messages.forEach((msg) => {
            const otherId =
                msg.sender.toString() === userId.toString()
                    ? msg.receiver.toString()
                    : msg.sender.toString();
            contactIds.add(otherId);
        });

        const contacts = await User.find({
            _id: { $in: Array.from(contactIds) },
        }).select("username email avatar bio isOnline lastSeen");

        res.json({ contacts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select(
            "username email avatar bio isOnline lastSeen"
        );
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { searchUsers, getContacts, getUserById };