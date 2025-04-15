
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import {
  getDatabase, ref, push, onValue,
  query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD1my79wPEDlsfsgg2oW6lCv-PI1_XqLZs",
  authDomain: "sol3mates.firebaseapp.com",
  databaseURL: "https://sol3mates-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sol3mates",
  storageBucket: "sol3mates.firebasestorage.app",
  messagingSenderId: "412759700453",
  appId: "1:412759700453:web:fc9269184892d60176350c"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Core game logic would continue here...
