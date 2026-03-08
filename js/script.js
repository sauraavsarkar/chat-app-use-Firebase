// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    push, 
    onChildAdded, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    updateProfile, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

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
const auth = getAuth(app);
const messagesRef = ref(db, 'messages');

// --- DOM Elements ---
const setupContainer = document.getElementById('setup-container');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const signupFields = document.getElementById('signup-fields');
const usernameInput = document.getElementById('username-input');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const authError = document.getElementById('auth-error');
const authSubmit = document.getElementById('auth-submit');
const toggleText = document.getElementById('toggle-text');
const toggleAuth = document.getElementById('toggle-auth');

const chatMain = document.getElementById('chat-main');
const chatFooter = document.getElementById('chat-footer');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const headerActions = document.getElementById('header-actions');
const headerAvatar = document.getElementById('header-avatar');
const logoutButton = document.getElementById('logout-button');

// --- App State ---
let currentUser = null; // Will hold the Firebase Auth user object
let isLoginMode = true; // Toggle between Login and Register

// --- Event Listeners ---
toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    authError.classList.add('hidden');
    
    if (isLoginMode) {
        authTitle.textContent = 'Welcome Back';
        authSubtitle.textContent = 'Log in to enter the chat.';
        signupFields.classList.add('hidden');
        usernameInput.required = false;
        authSubmit.textContent = 'Log In';
        toggleText.textContent = "Don't have an account?";
        toggleAuth.textContent = 'Sign Up';
    } else {
        authTitle.textContent = 'Create Account';
        authSubtitle.textContent = 'Sign up to join the chat.';
        signupFields.classList.remove('hidden');
        usernameInput.required = true;
        authSubmit.textContent = 'Sign Up';
        toggleText.textContent = "Already have an account?";
        toggleAuth.textContent = 'Log In';
    }
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const displayName = usernameInput.value.trim();

    authError.classList.add('hidden');
    authSubmit.disabled = true;

    try {
        if (isLoginMode) {
            // Login logic
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            // Sign up logic
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Generate Avatar and Update Profile
            const photoURL = getAvatarUrl(displayName);
            await updateProfile(user, {
                displayName: displayName,
                photoURL: photoURL
            });
            // Force reload the user state correctly
            currentUser = auth.currentUser;
        }
    } catch (error) {
        authError.textContent = error.message;
        authError.classList.remove('hidden');
    } finally {
        authSubmit.disabled = false;
    }
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    
    if (text && currentUser) {
        // --- Real Firebase implementation ---
        push(messagesRef, {
            name: currentUser.displayName || "Unknown User",
            photoURL: currentUser.photoURL || getAvatarUrl("User"),
            uid: currentUser.uid,
            text: text,
            timestamp: serverTimestamp()
        });
        
        messageInput.value = '';
        messageInput.focus();
    }
});

logoutButton.addEventListener('click', () => {
    signOut(auth).then(() => {
        location.reload();
    });
});

// Helper to generate a consistent avatar using UI Avatars
function getAvatarUrl(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true`;
}

// --- Functions ---
function appendMessage(messageData) {
    const li = document.createElement('li');
    
    // Determine if message is from the current user (using Firebase UID)
    const isSentByMe = currentUser && messageData.uid === currentUser.uid;
    li.classList.add('message-row');
    li.classList.add(isSentByMe ? 'sent-row' : 'received-row');
    
    // Format time
    let timeString = '';
    if (messageData.timestamp) {
        const date = new Date(messageData.timestamp);
        timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const avatarHtml = `<img src="${messageData.photoURL || getAvatarUrl(messageData.name)}" class="message-avatar" alt="${escapeHTML(messageData.name)}">`;

    // Create message HTML
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
let isListening = false;
function setupFirebaseListener() {
    if (isListening) return; // Prevent multiple listeners
    isListening = true;
    onChildAdded(messagesRef, (snapshot) => {
        const messageData = snapshot.val();
        appendMessage(messageData);
    });
}

// --- Auth State Observer ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in.
        currentUser = user;
        setupContainer.classList.add('hidden');
        chatMain.classList.remove('hidden');
        chatFooter.classList.remove('hidden');
        headerActions.classList.remove('hidden');
        headerAvatar.src = user.photoURL || getAvatarUrl(user.displayName);
        
        setupFirebaseListener();
        setTimeout(() => messageInput.focus(), 100);
    } else {
        // No user is signed in.
        currentUser = null;
        setupContainer.classList.remove('hidden');
        chatMain.classList.add('hidden');
        chatFooter.classList.add('hidden');
        headerActions.classList.add('hidden');
    }
});
