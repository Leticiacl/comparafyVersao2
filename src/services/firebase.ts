// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBIx4gATd2e69AMoA2G59JurPvir4eP8do",
  authDomain: "comparafy-versao-2.firebaseapp.com",
  projectId: "comparafy-versao-2",
  storageBucket: "comparafy-versao-2.firebasestorage.app",
  messagingSenderId: "251867024258",
  appId: "1:251867024258:web:605134aaa454249c1d9d9b",
  measurementId: "G-80ZRH94489"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);