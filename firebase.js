// 🔥 DIN FIREBASE CONFIG
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCk4mpUb6jZtefwSJRQvegbT2wLITTvr6w",
  authDomain: "liv-i-bygda.firebaseapp.com",
  databaseURL: "https://liv-i-bygda-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "liv-i-bygda",
  storageBucket: "liv-i-bygda.firebasestorage.app",
  messagingSenderId: "980667580500",
  appId: "1:980667580500:web:dad18f4bc3ad0c838b6dc1",
  measurementId: "G-F8443EVCS4"
};

// 🚀 INITIALISER FIREBASE
firebase.initializeApp(firebaseConfig);

// 🌐 DATABASE
const db = firebase.database();
