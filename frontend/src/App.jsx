import { useState, useEffect } from 'react';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { savePB3x3 } from './pbRepo';

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
      console.log("onMsg origin:", e.origin);         // ← 여기 꼭 보세요
      console.log("onMsg data:", e.data);
      console.log(typeof(e.data.type));
      //if (!e.origin.startsWith(BACKEND_BASE)) return; // 보안: 백엔드 도메인만 허용
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

  const save = async () => {
    try {
      await savePB3x3({
        singleMs: Number(singleMs),
        ao5Ms: Number(ao5Ms),
      });
      alert("저장 완료");
    } catch(e) {
      console.error(e);
      alert(e.message || "저장 실패");
    }
  };

  return (
    <div style={{ padding: 24, display: "grid", gap: 12, maxWidth: 360 }}>
      <h1>PB Tracker</h1>
      <button onClick={openWCA}>{uid ? "다시 로그인" : "WCA로 로그인"}</button>
      {uid && <small>Signed in: {uid}</small>}

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