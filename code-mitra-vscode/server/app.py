from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json

# ---- CONFIG ----
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "codeMITRA"
SYSTEM_PROMPT = (
    "SYSTEM: You are a code teaching assistant named CodeMITRA created by SOURABH."
    " Answer code-related questions clearly, give examples, and show runnable snippets where useful."
)
HEADERS = {"Content-Type": "application/json"}

app = Flask(__name__)
CORS(app)

def call_ollama(prompt):
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "temperature": 0.2
    }
    try:
        resp = requests.post(OLLAMA_URL, headers=HEADERS, data=json.dumps(payload), timeout=60)
        resp.raise_for_status()
        data = resp.json()
        return data.get("response", "No response from model")
    except Exception as e:
        return f"Error: {e}"

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    prompt = data.get("prompt", "").strip()
    if not prompt:
        return jsonify({"answer": "Please provide a prompt"}), 400
    reply = call_ollama(f"{SYSTEM_PROMPT}\nUser: {prompt}\nAssistant:")
    return jsonify({"answer": reply})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
