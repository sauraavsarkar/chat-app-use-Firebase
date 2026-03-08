// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";
import { 
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
    updateProfile, onAuthStateChanged, signOut 
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

const dashboardContainer = document.getElementById('dashboard-container');
const headerActions = document.getElementById('header-actions');
const headerAvatar = document.getElementById('header-avatar');
const logoutButton = document.getElementById('logout-button');

// --- App State ---
let isLoginMode = true; 

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
            
            const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&bold=true`;
            await updateProfile(user, {
                displayName: displayName,
                photoURL: photoURL
            });
            // Auto reload via onAuthStateChanged
        }
    } catch (error) {
        authError.textContent = error.message;
        authError.classList.remove('hidden');
    } finally {
        authSubmit.disabled = false;
    }
});

logoutButton.addEventListener('click', () => {
    signOut(auth).then(() => {
        location.reload();
    });
});

headerAvatar.addEventListener('click', () => {
    if (currentUser) {
        alert(`Profile Information:\n\nName: ${currentUser.displayName}\nEmail: ${currentUser.email}\nUID: ${currentUser.uid}`);
    }
});

// --- Auth State Observer ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userPhoto = user.photoURL || `https://ui-avatars.com/api/?name=User&background=random&color=fff&bold=true`;
        
        // Ensure user is captured in the database directory
        set(ref(db, `users/${user.uid}`), {
            uid: user.uid,
            displayName: user.displayName || "Unknown User",
            photoURL: userPhoto
        });

        // Hide login, show dashboard
        setupContainer.classList.add('hidden');
        dashboardContainer.classList.remove('hidden');
        headerActions.classList.remove('hidden');
        headerAvatar.src = userPhoto;
    } else {
        // Show login, hide dashboard
        setupContainer.classList.remove('hidden');
        dashboardContainer.classList.add('hidden');
        headerActions.classList.add('hidden');
    }
});
