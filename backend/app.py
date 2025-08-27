import os
from flask import Flask
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

@app.get("/health")
def health():
    return {"ok": True, "frontend": os.getenv("FRONTEND_ORIGIN")}

if __name__ == "__main__":
    app.run(port = 5000, debug = True)