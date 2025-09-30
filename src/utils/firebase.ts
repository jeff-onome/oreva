// FIX: Use firebase v9 compat libraries to support v8 syntax.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

const firebaseConfig = {
  apiKey: "AIzaSyAQbTLVrcV7DcwZUO4qoPAGA1OcLjGurBE",
  authDomain: "ecommerce-e9230.firebaseapp.com",
  databaseURL: "https://ecommerce-e9230-default-rtdb.firebaseio.com",
  projectId: "ecommerce-e9230",
  storageBucket: "ecommerce-e9230.appspot.com", // unused now
  messagingSenderId: "977540607737",
  appId: "1:977540607737:web:03b17947e71a163073fc28",
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ✅ Only auth + database
const auth = firebase.auth();
const db = firebase.database();

export { db, auth };
