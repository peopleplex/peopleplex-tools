import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDzvyuD9a1bFGM_seeg-XLNyH6N14zv2HE",
    authDomain: "people-plex.firebaseapp.com",
    projectId: "people-plex",
    storageBucket: "people-plex.firebasestorage.app",
    messagingSenderId: "268526508372",
    appId: "1:268526508372:web:6a57a7e6d0ec2ebaa190c1",
    measurementId: "G-M1WDPCWX9T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
