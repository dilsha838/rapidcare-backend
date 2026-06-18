import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBqCcjYrcBtLl_OPGqj8khficTjC9ziY-8",
  authDomain: "rapidcare-6f650.firebaseapp.com",
  projectId: "rapidcare-6f650",
  storageBucket: "rapidcare-6f650.firebasestorage.app",
  messagingSenderId: "193210164345",
  appId: "1:193210164345:web:0816736f86240403f120a8",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
