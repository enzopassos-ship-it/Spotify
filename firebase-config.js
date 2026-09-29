import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9l6PzTlXZsq7tZ1aVbxPYv91lob0JKmw",
  authDomain: "enzo-48a4a.firebaseapp.com",
  databaseURL: "https://enzo-48a4a-default-rtdb.firebaseio.com",
  projectId: "enzo-48a4a",
  storageBucket: "enzo-48a4a.firebasestorage.app",
  messagingSenderId: "697747200629",
  appId: "1:697747200629:web:36aefd1339e3569d7e363c",
  measurementId: "G-6XJBNYMFES"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);