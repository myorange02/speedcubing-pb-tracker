import os, requests
from flask import Flask, redirect, request, jsonify, make_response
from flask_cors import CORS #CORS 설정용
from dotenv import load_dotenv #.env 로드용
from urllib.parse import urlencode

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

# WCA 토큰/유저 API 엔드포인트 상수
WCA_TOKEN = "https://www.worldcubeassociation.org/oauth/token"
WCA_ME = "https://www.worldcubeassociation.org/api/v0/me"

# .env 저장된 값 상수
CLIENT_ID = os.getenv("WCA_CLIENT_ID")
CLIENT_SECRET = os.getenv("WCA_CLIENT_SECRET")
REDIRECT_URI = os.getenv("WCA_REDIRECT_URI")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

# Routing
@app.get("/auth/wca/callback")
def wca_callback():
    # 1) 쿼리에서 code 받기
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "missing_code"}), 400
    
    # 2) 환경변수 검사 (없으면 에러)
    if not all([CLIENT_ID, CLIENT_SECRET, REDIRECT_URI]):
        return jsonify({"error": "missing_env", "need": ["WCA_CLIENT_ID", "WCA_CLIENT_SECRET", "WCA_REDIRECT_URI"]}), 500

    # 3) code -> access_token 교환
    try:
        token_res = requests.post(
            WCA_TOKEN,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": REDIRECT_URI,
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET
            },
            timeout = 10
        )
        token_res.raise_for_status()
        token_json = token_res.json()
    except Exception as e:
        return jsonify({"error": "token_exchange_failed", "detail": str(e)}), 400
    
    access_token = token_json.get("access_token")
    if not access_token:
        return jsonify({"error": "no_access_token", "raw": token_json}), 400
    
    # 4) 사용자 정보 조회
    try:
        me_res = requests.get(
            WCA_ME,
            headers = {"Authorization": f'Bearer {access_token}'},
            timeout = 10
        )
        me_res.raise_for_status()
        me_json = me_res.json()
    except Exception as e:
        return jsonify({"error": "me_fetch_failed", "detail": str(e)}), 400

    u = me_json.get("me") or me_json
    wca_id = u.get("wca_id") or (u.get("id") and str(u["id"]))
    email = u.get("email") or ""
    name = u.get("name") or ""
    if not wca_id:
        return jsonify({"error": "no_wca_id", "raw": me_json}), 400
    
    # 5) Firebase 커스텀 토큰 발급
    try:
        uid = f'wca: {wca_id}'
        custom_token = auth.create_custom_token(uid, {"email": email, "wcaName": name}).decode("utf-8")
    except Exception as e:
        return jsonify({"error": "custom_token_failed", "detail": str(e)}), 500
    
    # 6) 프린트로 전달 후 팝업 닫기
    html = f"""<!doctype html>
        <meta charset="utf-8" />
        <script>
            try {{
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: "WCA_CUSTOM_TOKEN",
                        token: "{custom_token}"
                    }}, "{FRONTEND_ORIGIN}");
                }}
            }} catch (e) {{
                console.error("postMessage failed", e);
            }} finally {{
                window.close();
            }}
        </script> """
    resp = make_response(html)
    resp.headers["Content-Type"] = "text/html; charset=utf-8"
    return resp

@app.get("/auth/wca/login")
def wca_login():
    # 아직 환경변수 비었으면 이유 설명
    if not CLIENT_ID or not REDIRECT_URI:
        return {"error": "missing_wca_oauth_config"}, 500
    
    # scope는 사용자 식별용으로 가볍게, (WCA 정책에 따라 'public' 또는 유사 스코프)
    url = f"{WCA_AUTH}?{urlencode({"client_id":CLIENT_ID, "redirect_uri": REDIRECT_URI, "response_type": "code", "scope": "public"})}"
    return redirect(url)

@app.get("/health")
def health():
    return {"ok": True, "frontend": os.getenv("FRONTEND_ORIGIN")}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port = 5000, debug = True)