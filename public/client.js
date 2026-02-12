const socket = io();

// DOM Elements
const joinScreen = document.getElementById('join-screen');
const joinForm = document.getElementById('join-form');
const joinInput = document.getElementById('join-input');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const messagesList = document.getElementById('messages');
const feedback = document.getElementById('feedback');

let username = '';
let typing = false;
let timeout = undefined;
const typingUsers = new Set();

// 1. Join Chat
joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = joinInput.value.trim();
    if (name) {
        username = name;
        joinScreen.style.display = 'none'; // Hide join screen
        socket.emit('user joined', username); // Notify server
        chatInput.focus();
    }
});

// 2. Send Message
chatInput.addEventListener('input', () => {
    if (!username) return;

    if (!typing) {
        typing = true;
        socket.emit('typing', username);
    }

    clearTimeout(timeout);
    timeout = setTimeout(stopTyping, 3000);
});

function stopTyping() {
    typing = false;
    socket.emit('stop typing', username);
}

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (text && username) {
        stopTyping();
        clearTimeout(timeout);

        const messageData = {
            username: username,
            text: text,
            timestamp: new Date().toISOString()
        };

        // Emit to server
        socket.emit('chat message', messageData);

        // Optimistically show own message immediately (or wait for server echo)
        // We'll wait for server echo to keep it simple and consistent
        chatInput.value = '';
    }
});

// 3. Receive Message
socket.on('chat message', (msg) => {
    displayMessage(msg);
});

socket.on('system message', (msg) => {
    const item = document.createElement('li');
    item.classList.add('system-message');
    item.textContent = msg;
    messagesList.appendChild(item);
    scrollToBottom();
});

socket.on('typing', (user) => {
    typingUsers.add(user);
    updateFeedback();
});

socket.on('stop typing', (user) => {
    typingUsers.delete(user);
    updateFeedback();
});

function updateFeedback() {
    if (typingUsers.size === 0) {
        feedback.textContent = '';
        return;
    }

    const users = Array.from(typingUsers);
    if (typingUsers.size === 1) {
        feedback.textContent = `${users[0]} is typing...`;
    } else if (typingUsers.size === 2) {
        feedback.textContent = `${users[0]} and ${users[1]} are typing...`;
    } else {
        feedback.textContent = `${users[0]}, ${users[1]}, and others are typing...`;
    }
}

function displayMessage(msg) {
    const item = document.createElement('li');
    item.classList.add('message');

    // Check if it's my message or someone else's
    if (msg.username === username) {
        item.classList.add('sent');
    } else {
        item.classList.add('received');
        // Add username label for others
        const nameLabel = document.createElement('span');
        nameLabel.classList.add('username');
        nameLabel.textContent = msg.username;
        item.appendChild(nameLabel);
    }

    // Message text
    const textNode = document.createTextNode(msg.text);
    item.appendChild(textNode);

    messagesList.appendChild(item);
    scrollToBottom();
}

function scrollToBottom() {
    messagesList.scrollTop = messagesList.scrollHeight;
}
