const socket = io('http://localhost:8081')

const rooms = ['devops', 'cloud computing', 'covid19', 'sports', 'nodeJS']

let currentRoom = '';
let currentUser = null;

function $(id){ return document.getElementById(id);}

function loadUser() {
    const u = localStorage.getItem('user');
    if (!u) window.location.href = '/login.html';
    currentUser = JSON.parse(u);
    $('welcome').innerText = `Welcome ${currentUser.username}`;
}

function fillRooms() {
    const sel = $('roomSelect');
    rooms.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.textContent = r;
        sel.appendChild(opt);
    });
}

function addMsg(text) {
    const box = $('messages');
    const div = document.createElement('div');
    div.className = 'msg';
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

window.addEventListener('load', () => {
    loadUser();
    fillRooms();

    $('joinBtn').addEventListener('click', () => {
        const room = $('roomSelect').value;
        currentRoom = room;
        socket.emit('joinRoom', { username: currentUser.username, room });
        $('roomName').innerText = room;
    });

    $('leaveBtn').addEventListener('click', () => {
        if (!currentRoom) return;
        socket.emit('leaveRoom', { username: currentUser.username, room: currentRoom });
        currentRoom = "";
        $('roomName').innerText = '-';
    });

    $('sendBtn').addEventListener('click', () => {
        const text = $('msgInput').value.trim();
        if (!text || !currentRoom) return;

        socket.emit('groupMessage', {
            from_user: currentUser.username,
            room: currentRoom,
            message: text
        });

        $('msgInput').value = '';
        socket.emit('stopTyping', { from_user: currentUser.username, to_user: 'room' });
    });

    $('sendPrivateBtn').addEventListener('click', () => {
        const toUser = $('toUser').value.trim();
        const text = $('privateInput').value.trim();
        if (!toUser || !text) return;

        socket.emit('privateMessage', {
            from_user: currentUser.username,
            to_user: toUser,
            message: text
        });

        $('privateInput').value = '';
        socket.emit('stopTyping', { from_user: currentUser.username, to_user: toUser });
    });

    $('privateInput').addEventListener('input', () => {
        const toUser = $('toUser').value.trim();
        if (!toUser) return;

        socket.emit('typing', {
            from_user: currentUser.username,
            to_user: toUser
        });

        clearTimeout(window._typingTimer);
        window._typingTimer = setTimeout(() => {
            socket.emit('stopTyping', { from_user: currentUser.username, to_user: toUser });
        }, 800);        
    });

    $('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    });
});


socket.on('systemMsg', (data) => addMsg(`[SYSTEM] ${data.message}`));

socket.on('groupMessage', (data) => {
    if (data.room === currentRoom) {
        addMsg(`[${data.room}] ${data.from_user}: ${data.message} (${data.date_sent})`);
    }
});

socket.on('privateMessage', (data) => {
    if (data.to_user === currentUser.username || data.from_user === currentUser.username) {
        addMsg(`[PRIVATE] ${data.from_user} -> ${data.to_user}: ${data.message} (${data.date_sent})`);
    }
});

socket.on('typing', ({ from_user, to_user }) => {        
        if (to_user === currentUser.username) {
            $('typing').innerText = `${from_user} is typing...`;
        }
    });

    socket.on('stopTyping', ({ from_user, to_user }) => {        
        if (to_user === currentUser.username) {
            $('typing').innerText = '';
        }
    });