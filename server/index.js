const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("http");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const server = createServer(app);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

app.use(express.json());
app.use("/upload", express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }
  res.json({ fileName: file.originalname, filePath: `/upload/${file.filename}` });
});

const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.get("/", (req, res) => {
  res.send("Hello world");
});

const users = {}; // To keep track of connected users
const roomUsers = {}; // To keep track of users in each room

io.on("connection", (socket) => {
  const userId = Math.floor(Math.random() * 999999);
  socket.userId = userId;
  users[userId] = socket.id;

  socket.emit("user-id", userId);

  socket.on("set-username", (username) => {
    socket.username = username;
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    if (!roomUsers[roomId]) {
      roomUsers[roomId] = {};
    }
    roomUsers[roomId][socket.userId] = socket.username;

    socket.to(roomId).emit("user-connected", { userId: socket.userId, username: socket.username });
    
    // Notify the user who just joined
    socket.emit("notification", { type: "info", message: `You have joined room ${roomId}` });
    
    // Notify all users in the room
    io.to(roomId).emit("notification", { type: "info", message: `${socket.username} has joined the room` });
  });

  socket.on("message", ({ message, roomId }) => {
    // Room message
    io.to(roomId).emit("received-message", {
      message,
      senderId: socket.userId,
      senderUsername: socket.username,
      isDirect: false, // Mark as room message
    });
  });

  socket.on("direct-message", ({ message, targetUserId }) => {
    if (targetUserId) {
      // Direct message to specific user
      const targetSocketId = users[targetUserId];
      if (targetSocketId) {
        io.to(targetSocketId).emit("received-message", {
          message,
          senderId: socket.userId,
          senderUsername: socket.username,
          isDirect: true, // Mark as direct message
        });
      }
    }
  });

  socket.on("file-upload", ({ roomId, fileName, filePath }) => {
    io.to(roomId).emit("file-received", { fileName, filePath, senderId: socket.userId, senderUsername: socket.username });
  });

  socket.on("disconnect", () => {
    const userId = socket.userId;
    const username = socket.username;
    delete users[userId];

    // Notify all users in rooms the disconnected user was part of
    Object.keys(roomUsers).forEach(roomId => {
      if (roomUsers[roomId][userId]) {
        delete roomUsers[roomId][userId];
        socket.to(roomId).emit("user-disconnected", { userId, username });
        io.to(roomId).emit("notification", { type: "info", message: `${username} has left the room` });
      }
    });

    // Notify all connected clients
    socket.broadcast.emit("notification", { type: "info", message: `${username} has disconnected` });
  });
});

server.listen(PORT, () => {
  console.log("Server is running on ", PORT);
});