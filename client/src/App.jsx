
import { io } from "socket.io-client";
import { useEffect, useMemo, useState } from "react";

const App = () => {
  const socket = useMemo(() => io("http://localhost:3000"), []);

  const [message, setMessage] = useState("");
  const roomId = "lambo";
  const [socketId, setsocketId] = useState("");
  const [allMessages, setAllMessages] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      setsocketId(socket.id);
      console.log("connected", socket.id);
    });

    socket.on("received-message", (message) => {
      console.log(message);
      setAllMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.emit("join-room", roomId);

    socket.on("welcome", (s) => console.log(s));

    return () => socket.disconnect();
  }, [socket]);

  const Submit = (e) => {
    e.preventDefault();
    
    if (socket && socket.connected) {
      socket.emit("message", { message, roomId });
      setMessage("")
    } else {
      console.error("Socket is not connected");
    }
  };

  

  return (
    <div>
      <h1>Message only</h1>
      <h3>{socketId}</h3>
      <form onSubmit={Submit}>
        <input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">submit</button>
      </form>
      <div>
        <h2>Messages:</h2>
        {allMessages.map((msg) => (
          <p>{msg}</p>
        ))}
      </div>
    </div>
  );
};

export default App;