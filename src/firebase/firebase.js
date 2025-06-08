import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAa_g9Lny7dwhtN0GUXV9nzMe4nw09AzSU",
  authDomain: "robogo-62663.firebaseapp.com",
  databaseURL:
    "https://robogo-62663-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "robogo-62663",
  storageBucket: "robogo-62663.firebasestorage.app",
  messagingSenderId: "468853312971",
  appId: "1:468853312971:web:690a9dedfdff58d7e37a4e",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
