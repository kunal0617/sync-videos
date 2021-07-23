const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

//get video player elemnets
const player = document.querySelector('.player');
const video = player.querySelector('.viewer');
const progress = player.querySelector('.progress');
const progressBar = player.querySelector('.progress__filled');
const toggle = player.querySelector('.toggle');
const skipButtons = player.querySelectorAll('[data-skip]');

//get username and room
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const socket = io();

//join chatroom
socket.emit('joinRoom', { username, room });

//get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
});

socket.on('message', message => {
    console.log(message);
    outputMessage(message);
    //scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

//message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const msg = e.target.elements.msg.value;
    msg = msg.trim();

    if(!msg){return false;}
    socket.emit('chatMessage', msg);

    //clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

//videoplayer listener
video.addEventListener('click', () => {
    const method = video.paused ? 'play' : 'pause';
    const ctime = video.currentTime;
    console.log(username, room, method, ctime);
    socket.emit('play_pause', {method, ctime});
});

toggle.addEventListener('click', ()=> {
    const method = video.paused ? 'play' : 'pause';
    const ctime = video.currentTime;
    console.log(username, room, method);
    socket.emit('play_pause', {method, ctime});
});

socket.on('client_play_pause', ({method, ctime}) => {
    console.log(method, ctime);
    video.currentTime = ctime;
    video[method]();
});

//change icons
video.addEventListener('play', updateButton);
video.addEventListener('pause', updateButton);

video.addEventListener('timeupdate', ()=>{
    const percent = (video.currentTime / video.duration) * 100;
    progressBar.style.flexBasis = `${percent}%`;
});

//skip button sync
skipButtons.forEach(button => button.addEventListener('click', function() {
    let skip_time = video.currentTime + parseFloat(this.dataset.skip);
    console.log(username,room, skip_time);
    socket.emit('skip', skip_time);
}));

socket.on('client_skip', (skip_time) => {
    console.log(skip_time);
    video.currentTime = parseFloat(skip_time);
});

//sync progressbar
progress.addEventListener('click', (e) => {
    const fwdTime = (e.offsetX / progress.offsetWidth) * video.duration;
    console.log(username, room, fwdTime);
    socket.emit('fwd', fwdTime);
});

socket.on('client_fwd', (fwdTime) => {
    video.currentTime = fwdTime;
});

//output msg to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

//add roomname to dom
function outputRoomName(room) {
    roomName.innerText = room; 
}

//add users to DOM
function outputUsers(users) {
    userList.innerHTML = `
        ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
}

function updateButton() {
    const html = `
        <i class="fas fa-pause"></i>
    `;
    const htmll = `
        <i class="fas fa-play"></i>
    `;
    const icon = this.paused ? htmll : html;
    toggle.innerHTML = icon;
}