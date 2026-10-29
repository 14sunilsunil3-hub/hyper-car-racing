const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// In-Memory Users for quick auth
const users = {};

// Auth Routes
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    if (users[email]) {
        return res.status(400).json({ success: false, message: 'User already exists!' });
    }
    users[email] = { username, password };
    res.json({ success: true, username });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (users[email] && users[email].password === password) {
        return res.json({ success: true, username: users[email].username });
    }
    res.status(400).json({ success: false, message: 'Invalid credentials!' });
});

// Socket.io Real-time Multiplayer
let players = {};

io.on('connection', (socket) => {
    console.log('Player Joined:', socket.id);

    socket.on('joinGame', (data) => {
        players[socket.id] = {
            id: socket.id,
            username: data.username || 'HyperRacer',
            x: 0,
            z: 0
        };
        io.emit('updatePlayers', players);
    });

    socket.on('playerMove', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].z = data.z;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerLeft', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Hyper Car Racing Server live on port ${PORT}`);
});
