// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { 
    getDatabase, ref, push, onChildAdded, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDO5-iu4q31R0-Au6TPwDDSh3Hk6zqXAUw",
  authDomain: "chat-app-8017e.firebaseapp.com",
  databaseURL: "https://chat-app-8017e-default-rtdb.firebaseio.com",
  projectId: "chat-app-8017e",
  storageBucket: "chat-app-8017e.firebasestorage.app",
  messagingSenderId: "177269061609",
  appId: "1:177269061609:web:e6d57aa3e073c06d733d78",
  measurementId: "G-S68TM9EVN6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// --- DOM Elements ---
const chatMain = document.getElementById('chat-main');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const btnBack = document.getElementById('btn-back');

// --- App State ---
let currentUser = null; 

// Ensure User is Logged In
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadGlobalChat();
    } else {
        window.location.href = 'index.html'; // Redirect to login
    }
});

btnBack.addEventListener('click', () => {
    window.location.href = 'index.html';
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    
    if (text && currentUser) {
        const globalMessagesRef = ref(db, `chats/global/messages`);
        
        const photoURL = currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || "User")}&background=random&color=fff&bold=true`;
        
        push(globalMessagesRef, {
            name: currentUser.displayName || "Unknown User",
            photoURL: photoURL,
            uid: currentUser.uid,
            text: text,
            timestamp: serverTimestamp()
        });
        
        messageInput.value = '';
        messageInput.focus();
    }
});

function loadGlobalChat() {
    const globalMessagesRef = ref(db, `chats/global/messages`);
    onChildAdded(globalMessagesRef, (snapshot) => {
        appendMessage(snapshot.val());
    });
    
    setTimeout(() => messageInput.focus(), 100);
}

function appendMessage(messageData) {
    const li = document.createElement('li');
    const isSentByMe = currentUser && messageData.uid === currentUser.uid;
    li.classList.add('message-row');
    li.classList.add(isSentByMe ? 'sent-row' : 'received-row');
    
    let timeString = '';
    if (messageData.timestamp) {
        const date = new Date(messageData.timestamp);
        timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const backupAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(messageData.name)}&background=random&color=fff&bold=true`;
    const avatarHtml = `<img src="${messageData.photoURL || backupAvatar}" class="message-avatar" alt="${escapeHTML(messageData.name)}">`;

    li.innerHTML = `
        ${!isSentByMe ? avatarHtml : ''}
        <div class="message ${isSentByMe ? 'sent' : 'received'}">
            ${!isSentByMe ? `<div class="message-sender">${escapeHTML(messageData.name)}</div>` : ''}
            <div class="message-content">${escapeHTML(messageData.text)}</div>
            ${timeString ? `<div class="message-time">${timeString}</div>` : ''}
        </div>
        ${isSentByMe ? avatarHtml : ''}
    `;
    
    chatMessages.appendChild(li);
    chatMain.scrollTop = chatMain.scrollHeight;
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
