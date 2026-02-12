require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const GroupMessage = require('./models/GroupMessage');
const PrivateMessage = require('./models/PrivateMessage');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static('../view'));
app.use('/public', express.static('../public'));

app.use('/api', authRoutes);

const PORT = process.env.PORT || 8081;

mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB connected")).catch((err) => console.log(err));

const server = app.listen(PORT, () => {
    console.log('Server is running....');
});

const io = require('socket.io')(server, {
    cors: { origin: "*"}
});

const onlineUsers = {};

function getNow() {
    const d = new Date;
    return `${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString()
        .padStart(2,'0')}-${d.getFullYear()} ${d.toLocaleTimeString()}`;
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', ({ username, room }) => {
        onlineUsers[socket.id] = username;
        socket.join(room);

        io.to(room).emit('systemMsg', { message: `${username} joined ${room}`});
    });

    socket.on('leaveRoom', ({ username, room }) => {
        socket.leave(room);

        io.to(room).emit('systemMsg', { message: `${username} left ${room}`});
    });

    socket.on('groupMessage', async ({ from_user, room, message }) => {
        const msgDoc = new GroupMessage({
            from_user,
            room,
            message,
            date_sent: getNow()
        });

        await msgDoc.save();
        io.to(room).emit('groupMessage', msgDoc);
    });

    socket.on('privateMessage', async ({ from_user, to_user, message }) => {
        const msgDoc = new PrivateMessage({
            from_user,
            to_user,
            message,
            date_sent: getNow()
        });

        await msgDoc.save();
        io.emit('privateMessage', msgDoc);
    });

    socket.on('typing', ({ from_user, to_user }) => {        
        io.emit('typing', { from_user, to_user });
    });

    socket.on('stopTyping', ({ from_user, to_user }) => {        
        io.emit('stopTyping', { from_user, to_user });
    });

    socket.on('disconnect', () => {        
        delete onlineUsers[socket.id];
    });

});