import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Firebase init
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebase";
initializeApp(firebaseConfig);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
