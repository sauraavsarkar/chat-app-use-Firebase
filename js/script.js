// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    push, 
    set,
    onChildAdded, 
    onValue,
    serverTimestamp,
    off
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

const appBody = document.getElementById('app-body');
const usersList = document.getElementById('users-list');
const emptyChatState = document.getElementById('empty-chat-state');
const activeChatContainer = document.getElementById('active-chat-container');
const chatArea = document.getElementById('chat-area');
const activeChatAvatar = document.getElementById('active-chat-avatar');
const activeChatName = document.getElementById('active-chat-name');
const btnBack = document.getElementById('btn-back');

const chatMain = document.getElementById('chat-main');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const headerActions = document.getElementById('header-actions');
const headerAvatar = document.getElementById('header-avatar');
const logoutButton = document.getElementById('logout-button');

// --- App State ---
let currentUser = null; 
let isLoginMode = true; 
let activeChatUserId = null;
let currentChatListenerRef = null;

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
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
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

btnBack.addEventListener('click', () => {
    chatArea.classList.remove('mobile-active');
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    
    if (text && currentUser && activeChatUserId) {
        const chatId = [currentUser.uid, activeChatUserId].sort().join('_');
        const chatMessagesRef = ref(db, `chats/${chatId}/messages`);
        
        push(chatMessagesRef, {
            name: currentUser.displayName || "Unknown User",
            photoURL: currentUser.photoURL || getAvatarUrl(currentUser.displayName || "User"),
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

// --- Dynamic Rendering Functions ---
function loadUsersList() {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
        usersList.innerHTML = '';
        const users = snapshot.val();
        if (users) {
            Object.values(users).forEach(user => {
                if (user.uid !== currentUser.uid) { // Don't show yourself
                    appendUserToList(user);
                }
            });
        }
    });
}

function appendUserToList(user) {
    const li = document.createElement('li');
    li.classList.add('user-item');
    if (activeChatUserId === user.uid) li.classList.add('active');
    
    li.innerHTML = `
        <img src="${user.photoURL}" class="user-avatar" alt="${escapeHTML(user.displayName)}">
        <div class="user-details">
            <div class="user-name">${escapeHTML(user.displayName)}</div>
        </div>
    `;
    
    li.addEventListener('click', () => {
        openChat(user);
    });
    
    usersList.appendChild(li);
}

function openChat(targetUser) {
    activeChatUserId = targetUser.uid;
    
    emptyChatState.classList.add('hidden');
    activeChatContainer.classList.remove('hidden');
    activeChatAvatar.src = targetUser.photoURL;
    activeChatName.textContent = targetUser.displayName;
    
    // Update active class in list manually for instant feedback
    document.querySelectorAll('.user-item').forEach(item => {
        if (item.querySelector('.user-name').textContent === targetUser.displayName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    if(window.innerWidth <= 767) {
        chatArea.classList.add('mobile-active');
    }
    
    const chatId = [currentUser.uid, targetUser.uid].sort().join('_');
    chatMessages.innerHTML = '';
    
    if (currentChatListenerRef) {
        off(currentChatListenerRef);
    }
    
    currentChatListenerRef = ref(db, `chats/${chatId}/messages`);
    onChildAdded(currentChatListenerRef, (snapshot) => {
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

    const avatarHtml = `<img src="${messageData.photoURL || getAvatarUrl(messageData.name)}" class="message-avatar" alt="${escapeHTML(messageData.name)}">`;

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

// Helper to prevent XSS
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- Auth State Observer ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        
        // Save/Update user profile in global DB so others can find them
        const userPhoto = user.photoURL || getAvatarUrl(user.displayName || "User");
        set(ref(db, `users/${user.uid}`), {
            uid: user.uid,
            displayName: user.displayName || "Unknown User",
            photoURL: userPhoto
        });

        setupContainer.classList.add('hidden');
        appBody.classList.remove('hidden');
        headerActions.classList.remove('hidden');
        headerAvatar.src = userPhoto;
        
        loadUsersList();
    } else {
        currentUser = null;
        activeChatUserId = null;
        setupContainer.classList.remove('hidden');
        appBody.classList.add('hidden');
        headerActions.classList.add('hidden');
    }
});
