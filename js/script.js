// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    push, 
    onChildAdded, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, 'messages');

// --- DOM Elements ---
const setupContainer = document.getElementById('setup-container');
const joinForm = document.getElementById('join-form');
const usernameInput = document.getElementById('username-input');

const chatMain = document.getElementById('chat-main');
const chatFooter = document.getElementById('chat-footer');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');

// --- App State ---
let currentUser = localStorage.getItem('chatUsername') || '';

// --- Initialization ---
if (currentUser) {
    // User already logged in, skip setup screen
    setupContainer.classList.add('hidden');
    chatMain.classList.remove('hidden');
    chatFooter.classList.remove('hidden');
    messageInput.focus();
    setupFirebaseListener();
}

// --- Event Listeners ---
joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = usernameInput.value.trim();
    if (name) {
        currentUser = name;
        localStorage.setItem('chatUsername', name); // Save to local storage
        setupContainer.classList.add('hidden');
        chatMain.classList.remove('hidden');
        chatFooter.classList.remove('hidden');
        messageInput.focus();
        
        // Setup Firebase Listener here once config is added
        setupFirebaseListener();
    }
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    
    if (text && currentUser) {
        // --- Real Firebase implementation ---
        push(messagesRef, {
            name: currentUser,
            text: text,
            timestamp: serverTimestamp()
        });
        
        messageInput.value = '';
        messageInput.focus();
    }
});

// --- Functions ---
function appendMessage(messageData) {
    const li = document.createElement('li');
    
    // Determine if message is from the current user
    const isSentByMe = messageData.name === currentUser;
    li.classList.add('message');
    li.classList.add(isSentByMe ? 'sent' : 'received');
    
    // Format time
    let timeString = '';
    if (messageData.timestamp) {
        const date = new Date(messageData.timestamp);
        timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Create message HTML
    li.innerHTML = `
        ${!isSentByMe ? `<div class="message-sender">${escapeHTML(messageData.name)}</div>` : ''}
        <div class="message-content">${escapeHTML(messageData.text)}</div>
        ${timeString ? `<div class="message-time">${timeString}</div>` : ''}
    `;
    
    chatMessages.appendChild(li);
    
    // Scroll to bottom
    chatMain.scrollTop = chatMain.scrollHeight;
}

// Helper to prevent XSS
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- Firebase Listener Setup ---
function setupFirebaseListener() {
    onChildAdded(messagesRef, (snapshot) => {
        const messageData = snapshot.val();
        appendMessage(messageData);
    });
}
