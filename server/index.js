const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

// Initialize Express app
const app = express();

// Initialize HTTP server with Express app
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins, adjust as necessary for your use case
        methods: ["GET", "POST"],
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

// Start the server on port 8000
server.listen(8000, () => console.log("Server running at http://localhost:8000"));
