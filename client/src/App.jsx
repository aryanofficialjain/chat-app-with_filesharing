import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import './index.css'

const App = () => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [roomId] = useState("lambo");
  const [socketId, setSocketId] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const [users, setUsers] = useState({});
  const [socket, setSocket] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);

  console.log(users);

  useEffect(() => {
    const socketInstance = io("http://localhost:3000");
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setSocketId(socketInstance.id);
      console.log("connected", socketInstance.id);
    });

    socketInstance.on("received-message", ({ message, senderId, senderUsername }) => {
      setAllMessages((prevMessages) => [...prevMessages, { message, senderId, senderUsername }]);
    });

    socketInstance.on("user-connected", ({ userId, username }) => {
      setUsers((prevUsers) => ({ ...prevUsers, [userId]: username }));
    });

    socketInstance.on("user-disconnected", ({ userId, username }) => {
      setUsers((prevUsers) => {
        const updatedUsers = { ...prevUsers };
        delete updatedUsers[userId];
        return updatedUsers;
      });
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
    if (username.trim() === "") {
      alert("Username cannot be empty");
      return;
    }
    setHasJoined(true);
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
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-150"
              >
                Send
              </button>
            </form>
            <div className="mt-6 flex-grow overflow-auto">
              <h2 className="text-lg font-semibold mb-2">Messages:</h2>
              <div className="flex flex-col space-y-2">
                {allMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md ${msg.senderId === socketId ? "bg-blue-100 text-right ml-auto" : "bg-gray-200 text-left mr-auto"}`}
                    style={{ alignSelf: msg.senderId === socketId ? "flex-end" : "flex-start" }}
                  >
                    <p className="font-semibold">{msg.senderUsername || "Anonymous"}:</p>
                    <p>{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;