import os
from flask import Flask, redirect
from flask_cors import CORS #CORS 설정용
from dotenv import load_dotenv #.env 로드용

#Firebase 관련 import
import firebase_admin #firebase Admin SDK 루트
from firebase_admin import credentials, auth

app = Flask(__name__)

load_dotenv() #.env 파일 읽기

CORS(
    app,
    supports_credentials=True,
    origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")]
)

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

# --- WCA OAuth authorize URL ---
WCA_AUTH = "https://www.worldcubeassociation.org/oauth/authorize"

@app.get("/auth/wca/login")
def wca_login():
    client_id = os.getenv("WCA_CLIENT_ID")
    redirect_uri = os.getenv("WCA_REDIRECT_URI")

    # 아직 환경변수 비었으면 이유 설명
    if not client_id or not redirect_uri:
        return {
            "error": "missing_wca_oauth_config",
            "message": "Set WCA_CLIENT_ID and WCA_REDIRECT_URI in backend/.env"
        }, 500
    
    # scope는 사용자 식별용으로 가볍게, (WCA 정책에 따라 'public' 또는 유사 스코프)
    url = (
        f"{WCA_AUTH}?client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope=public"
    )

    return redirect(url)

@app.get("/health")
def health():
    return {"ok": True, "frontend": os.getenv("FRONTEND_ORIGIN")}

if __name__ == "__main__":
    app.run(port = 5000, debug = True)