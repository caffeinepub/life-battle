import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCBHA-b9jNTcd-bf0iAUaUVnt4gnSlMjaU",
  authDomain: "life-battle-efd11.firebaseapp.com",
  databaseURL: "https://life-battle-efd11-default-rtdb.firebaseio.com",
  projectId: "life-battle-efd11",
  storageBucket: "life-battle-efd11.firebasestorage.app",
  messagingSenderId: "668725379164",
  appId: "1:668725379164:web:080dd18c130225ed2de699",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
