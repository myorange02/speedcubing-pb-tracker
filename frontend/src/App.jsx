import { useState, useEffect } from 'react';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { savePB3x3 } from './pbRepo';
import usePB3x3 from "./hooks/usePB3x3";

const BACKEND_BASE = "https://continuously-property-jews-cloth.trycloudflare.com"

export default function App() {
  const [singleMs, setSingleMs] = useState("");
  const [ao5Ms, setAo5Ms] = useState("");
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const un = onAuthStateChanged(getAuth(), (user) => {
      console.log("onAuthStateChanged uid =", user?.uid);
      setUid(user?.uid ?? null);
    })
    return un;
  }, []);

  useEffect(() => {
    const onMsg = async (e) => {
      if (!e.origin.startsWith(BACKEND_BASE)) return; // 보안: 백엔드 도메인만 허용
      if (e.data?.type === "WCA_CUSTOM_TOKEN" && typeof e.data.token === "string") {
        console.log("token length:", e.data.token.length);
        await signInWithCustomToken(getAuth(),e.data.token);
        setUid(getAuth().currentUser?.uid || null);
        alert("로그인 성공!");
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const openWCA = () => {
    const w = window.open(`${BACKEND_BASE}/auth/wca/login`, 'wca', "width=480, height=720");
    if (!w || w.closed || typeof w.closed === "undefined") {
      // 팝업 차단 시 폴백
      window.location.assign(`${BACKEND_BASE}/auth/wca/login`);
    }
  };

  const pb = usePB3x3(uid);

  const save = async () => {
    try {
      await savePB3x3({
        singleMs: Number(singleMs),
        ao5Ms: Number(ao5Ms),
      });
      setSingleMs("");
      setAo5Ms("");
      alert("저장 완료");
    } catch(e) {
      console.error(e);
      alert(e.message || "저장 실패");
    }
  };

  const formatMs = (ms) => {
    if (typeof ms !== "number") return "-";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const mm = String(m);
    const ss = String(s).padStart(2, "0");
    const SSS = String(ms % 1000).padStart(3, "0");
    return m > 0 ? `${mm}:${ss}.${SSS}` : `${s}.${SSS}`;
  };

  return (
    <div style={{ padding: 24, display: "grid", gap: 12, maxWidth: 360 }}>
      <h1>PB Tracker</h1>
      <button onClick={openWCA}>{uid ? "다시 로그인" : "WCA로 로그인"}</button>
      {uid && <small>Signed in: {uid}</small>}

      <div>
        <strong>현재 3x3x3 PB</strong>
        <div>Single: {formatMs(pb?.singleMs)}</div>
        <div>Ao5.  : {formatMs(pb?.ao5Ms)}</div>
      </div>

      <input 
        placeholder="Single (ms)" 
        value={singleMs}
        inputMode="numeric"
        onChange={(e) => setSingleMs(e.target.value)}
      />

      <input
        placeholder="Ao5 (ms)"
        value={ao5Ms}
        inputMode="numeric"
        onChange={(e) => setAo5Ms(e.target.value)}
      />
      <button onClick={save} disabled={!uid}>PB 저장</button>
    </div>
  );
}