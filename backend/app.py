from flask import Flask

app = Flask(__name__)

@app.get("/health")
def health():
    return {"ok": True}

if __name__ == "__main__":
    app.run(port = 5000, debug = True)