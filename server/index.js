const express = require("express");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

// Initialize Express app
const app = express();

// Start server
const server = app.listen(8000, console.log(`Server Started on PORT 8000`));

// Initialize Socket.IO
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
  },
});

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// In-memory mappings for email-to-socket and socket-to-email
const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

// Socket.IO event handling
io.on("connection", (socket) => {
  console.log("new Connection", socket.id);

  // User joins a room
  socket.on("join-room", (data) => {
    const { roomId, emailId } = data;
    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);
    console.log("user", emailId, "Joined Room", roomId);

    socket.join(roomId);
    socket.emit("joined-room", { roomId });
    socket.broadcast.to(roomId).emit("user-joined", { emailId });
  });

  // Call user event
  socket.on("call-user", (data) => {
    const { emailId, offer } = data;
    const fromEmail = socketToEmailMapping.get(socket.id);
    const socketId = emailToSocketMapping.get(emailId);
    socket.to(socketId).emit("incoming-call", { from: fromEmail, offer });
  });

  // Call accept event
  socket.on("call-accept", (data) => {
    const { emailId, ans } = data;
    const socketId = emailToSocketMapping.get(emailId);
    socket.to(socketId).emit("call-accepted", { ans });
  });

  // Negotiation needed event
  socket.on("negotiation-needed", (data) => {
    const { offer, to } = data;
    const socketId = emailToSocketMapping.get(to);
    console.log("negotiation-needed", offer);
    socket.to(socketId).emit("negotiation-needed", { from: socket.id, offer });
  });

  // Negotiation done event
  socket.on("negotiation-done", (data) => {
    const { ans, to } = data;
    console.log("negotiation-done", ans);
    socket.to(to).emit("negotiation-final", { from: socket.id, ans });
  });
});

// Route to serve JSON or static content (if needed)
app.get("/", (req, res) => {
  res.send("Welcome to the WebSocket server!");
});
