const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error("Authentication error"));
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (!user) return next(new Error("User not found"));
            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", async (socket) => {
        const user = socket.user;
        console.log(`🔌 Connected: ${user.username} (${socket.id})`);

        await User.findByIdAndUpdate(user._id, {
            isOnline: true,
            socketId: socket.id,
            lastSeen: new Date(),
        });

        socket.broadcast.emit("user:online", {
            userId: user._id,
            isOnline: true,
        });

        socket.join(user._id.toString());

        // ---- SEND MESSAGE ----
        socket.on("message:send", async (data) => {
            try {
                const {
                    receiverId,
                    content,
                    type = "text",
                    fileUrl,
                    fileName,
                    fileSize,
                } = data;

                const message = await Message.create({
                    sender: user._id,
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

                // Send to receiver
                io.to(receiverId).emit("message:receive", populated);
                // Confirm to sender
                socket.emit("message:sent", populated);

                // Send notification
                io.to(receiverId).emit("notification:new", {
                    type: "message",
                    from: {
                        _id: user._id,
                        username: user.username,
                        avatar: user.avatar,
                    },
                    content: type === "text" ? content : `Sent a ${type}`,
                    timestamp: new Date(),
                });
            } catch (err) {
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // ---- REACTION ----
        socket.on("message:reaction", async (data) => {
            try {
                const { messageId, emoji, receiverId } = data;

                // Find message
                const message = await Message.findById(messageId);
                if (!message) return;

                // Toggle reaction
                const existingReaction = message.reactions.find(
                    (r) => r.emoji === emoji
                );

                if (existingReaction) {
                    const idx = existingReaction.users.findIndex(
                        (u) => u.toString() === user._id.toString()
                    );
                    if (idx > -1) {
                        existingReaction.users.splice(idx, 1);
                        if (existingReaction.users.length === 0) {
                            message.reactions = message.reactions.filter(
                                (r) => r.emoji !== emoji
                            );
                        }
                    } else {
                        existingReaction.users.push(user._id);
                    }
                } else {
                    message.reactions.push({ emoji, users: [user._id] });
                }

                await message.save();

                const update = {
                    messageId,
                    reactions: message.reactions,
                };

                // Send to BOTH sender and receiver
                io.to(receiverId).emit("message:reaction:update", update);
                io.to(user._id.toString()).emit(
                    "message:reaction:update",
                    update
                );
            } catch (err) {
                socket.emit("error", { message: "Failed to react" });
            }
        });

        // ---- DELETE MESSAGE ----
        socket.on("message:delete", async (data) => {
            try {
                const { messageId, receiverId } = data;
                const message = await Message.findById(messageId);
                if (
                    !message ||
                    message.sender.toString() !== user._id.toString()
                )
                    return;

                message.isDeleted = true;
                message.content = "This message was deleted";
                await message.save();

                const update = { messageId };
                io.to(receiverId).emit("message:deleted", update);
                io.to(user._id.toString()).emit("message:deleted", update);
            } catch (err) {
                socket.emit("error", { message: "Failed to delete" });
            }
        });

        // ---- TYPING ----
        socket.on("typing:start", (data) => {
            socket.to(data.receiverId).emit("typing:start", {
                userId: user._id,
                username: user.username,
            });
        });

        socket.on("typing:stop", (data) => {
            socket.to(data.receiverId).emit("typing:stop", {
                userId: user._id,
            });
        });

        // ---- READ RECEIPTS ----
        socket.on("message:read", async (data) => {
            try {
                const { senderId } = data;

                await Message.updateMany(
                    {
                        sender: senderId,
                        receiver: user._id,
                        isRead: false,
                    },
                    { isRead: true }
                );

                // Instant blue tick
                io.to(senderId).emit("message:read:ack", {
                    readBy: user._id,
                    senderId: senderId,
                });
            } catch (err) { }
        });

        // ---- DISCONNECT ----
        socket.on("disconnect", async () => {
            console.log(`❌ Disconnected: ${user.username}`);
            await User.findByIdAndUpdate(user._id, {
                isOnline: false,
                socketId: null,
                lastSeen: new Date(),
            });
            socket.broadcast.emit("user:online", {
                userId: user._id,
                isOnline: false,
                lastSeen: new Date(),
            });
        });
    });

    return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };