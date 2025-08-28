import { useState, useEffect } from 'react';
import { getAuth, signInWithCustomToken } from "firebase/auth";

const BACKEND_BASE = "https://arrival-portable-holder-vpn.trycloudflare.com"

export default function App() {
  const openWCA = () => {
    window.open(`${BACKEND_BASE}/auth/wca/login`, 'wca', "width=480, height=720");
  }

  return (
    <div style={{ padding: 24}}>
      <h1>PB Tracker</h1>
      <button onClick={openWCA}>WCA로 로그인</button>
    </div>
  )
}