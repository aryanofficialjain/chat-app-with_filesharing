import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import './index.css';
import axios from 'axios';
import React from "react";

const App = () => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [roomId, setRoomId] = useState("");
  const [socketId, setSocketId] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const [users, setUsers] = useState({});
  const [socket, setSocket] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(""); // State for preview URL
  const [directMessageUserId, setDirectMessageUserId] = useState(""); // New state for direct message
  const [notifications, setNotifications] = useState([]); // State for notifications

  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_SITE_URL);
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Connected to server");
    });

    socketInstance.on("user-id", (userId) => {
      setSocketId(userId);
      console.log(`Received user ID: ${userId}`);
    });

    socketInstance.on("received-message", ({ message, senderId, senderUsername, isDirect }) => {
      setAllMessages(prevMessages => [...prevMessages, { message, senderId, senderUsername, isDirect }]);
    });

    socketInstance.on("file-received", ({ fileName, filePath, senderId, senderUsername }) => {
      setAllMessages(prevMessages => [...prevMessages, { fileName, filePath, senderId, senderUsername, isFile: true }]);
    });

    socketInstance.on("user-connected", ({ userId, username }) => {
      setUsers(prevUsers => ({ ...prevUsers, [userId]: username }));
      setNotifications(prevNotifications => [
        ...prevNotifications,
        { type: "info", message: `${username} has joined the chat` }
      ]);
    });

    socketInstance.on("user-disconnected", ({ userId, username }) => {
      setUsers(prevUsers => {
        const updatedUsers = { ...prevUsers };
        delete updatedUsers[userId];
        return updatedUsers;
      });
      setNotifications(prevNotifications => [
        ...prevNotifications,
        { type: "info", message: `${username} has left the chat` }
      ]);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && username && hasJoined) {
      socket.emit("set-username", username);
      socket.emit("join-room", roomId);
    }
  }, [socket, username, hasJoined, roomId]);

  const handleJoin = () => {
    if (username.trim() === "" || roomId.trim() === "") {
      alert("Username and Room ID cannot be empty");
      return;
    }
    setHasJoined(true);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile)); // Generate preview URL
  };

  const handleFileUpload = async () => {
    if (file && socket) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await axios.post(`${import.meta.env.VITE_SITE_URL}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const { fileName, filePath } = res.data;
        socket.emit("file-upload", { roomId, fileName, filePath });
        setFile(null); // Clear file input after upload
        setPreviewUrl(""); // Clear preview after upload
      } catch (error) {
        console.error("File upload failed:", error);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (socket && socket.connected) {
      socket.emit("message", { message, roomId });
      setMessage("");
    } else {
      console.error("Socket is not connected");
    }
  };

  const handleDirectMessage = (e) => {
    e.preventDefault();
    if (socket && socket.connected && directMessageUserId) {
      socket.emit("direct-message", { message, targetUserId: directMessageUserId });
      setMessage("");
    } else {
      console.error("Socket is not connected or Direct Message User ID is missing");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-500 text-white py-4 px-6 shadow-md">
        <h1 className="text-2xl font-bold">Chat Application</h1>
      </header>
  
      <main className="flex-grow p-6 overflow-auto">
        {!hasJoined ? (
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleJoin}
              className="w-full mt-4 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-150"
            >
              Join
            </button>
          </div>
        ) : (
          <div className="flex flex-col max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Socket ID: {socketId}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col">
              <input
                type="text"
                placeholder="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
  
              {previewUrl && (
                <div className="mb-4">
                  <h4 className="text-lg font-semibold">Preview:</h4>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full rounded-md shadow-md"
                  />
                </div>
              )}
  
              <button
                type="button"
                onClick={handleFileUpload}
                className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition duration-150 mb-4"
              >
                Upload File
              </button>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-150"
              >
                Send Message
              </button>
            </form>
  
            {/* Direct Message Form */}
            <form onSubmit={handleDirectMessage} className="flex flex-col mt-4">
              <input
                type="text"
                placeholder="Direct Message User ID"
                value={directMessageUserId}
                onChange={(e) => setDirectMessageUserId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition duration-150"
              >
                Send Direct Message
              </button>
            </form>
  
            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-md shadow-md">
                {notifications.map((notif, index) => (
                  <div key={index} className="mb-2">
                    {notif.message}
                  </div>
                ))}
              </div>
            )}
  
            {/* Messages and Files */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-2">Messages</h4>
              <ul className="space-y-4">
                {allMessages.map((msg, index) => (
                  <li
                    key={index}
                    className={`p-4 rounded-lg shadow ${
                      msg.senderId === socketId
                        ? "bg-blue-100 text-right"
                        : "bg-gray-100 text-left"
                    } ${msg.isDirect ? "bg-red-100" : ""}`}
                  >
                    {msg.isFile && msg.filePath.match(/\.(jpeg|jpg|png|gif)$/) ? (
                      <div>
                        <strong>{msg.senderUsername}:</strong>
                      <a href={`${import.meta.env.VITE_SITE_URL}${msg.filePath}`} target="_blank" download>
  <img src={`${import.meta.env.VITE_SITE_URL}${msg.filePath}`} alt={msg.fileName} className="w-full max-w-xs rounded-md shadow-md mt-2" />
</a>
                      </div>
                    ) : msg.isFile ? (
                      <div>
                        <strong>{msg.senderUsername}:</strong>
                        <a
                          href={`${import.meta.env.VITE_SITE_URL}${msg.filePath}`}
                          target="_blank"
                          download
                        >
                          {msg.fileName}
                        </a>
                      </div>
                    ) : (
                      <div>
                        <strong>{msg.senderUsername}:</strong> {msg.message}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};


export default App;
