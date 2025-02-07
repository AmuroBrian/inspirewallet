// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD2MVTPMsY3XlgzcIjDWqfJTWP1CsdnFvY",
    authDomain: "inspire-wallet.firebaseapp.com",
    projectId: "inspire-wallet",
    storageBucket: "inspire-wallet.appspot.com",
    messagingSenderId: "1091026046056",
    appId: "1:1091026046056:web:1440a666dad63cc9cb3fdd",
    measurementId: "G-HSVD3JN0S9"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});