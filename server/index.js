import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import {Message} from "./models/userModel.js"; // Import the message model

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const server = createServer(app);

// Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => console.log("MongoDB connected"))
//   .catch(err => console.log("MongoDB connection error: ", err));

app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

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

io.on("connection", (socket) => {
  console.log("User connected with ID -> ", socket.id);

  // Handle incoming messages
  socket.on("message", async ({ message, roomId }) => {
    console.log(`Received message: ${message} in room: ${roomId}`);

    // Save the message to the database
    // const newMessage = new Message({
    //   roomId,
    //   senderId: socket.id,
    //   message,
    // });

    try {
      // await newMessage.save();
      // console.log("Message saved to database");

      // Emit the message to all users in the room
      io.to(roomId).emit("received-message", message);
    } catch (err) {
      console.error("Error saving message: ", err);
    }
  });

  // Handle joining a room
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`User joined room ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

server.listen(PORT, () => {
  console.log("Server is running on ", PORT);
});