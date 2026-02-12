const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('user joined', (username) => {
        socket.username = username; // Store on socket session
        io.emit('system message', `${username} has joined the chat`);
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            io.emit('system message', `${socket.username} has left the chat`);
        }
    });

    socket.on('typing', (username) => {
        socket.broadcast.emit('typing', username);
    });

    socket.on('stop typing', (username) => {
        socket.broadcast.emit('stop typing', username);
    });

    socket.on('chat message', (msg) => {
        // msg is now an object: { username, text, time }
        // We can add validation here if needed
        io.emit('chat message', msg);
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('listening on *:3000');
});
