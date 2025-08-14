

# interface=gr.Interface(
#     fn=generate_response,
#     inputs=gr.Textbox(lines=4,placeholder="Enter your Prompt"),
#     outputs="text"
# )
# interface.launch()

# app.py
import json
import requests
import gradio as gr
from typing import List, Dict

# ---- CONFIG ----
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "codeMITRA"   # the name you built from your modelfile
SYSTEM_PROMPT = (
    "SYSTEM: You are a code teaching assistant named CodeMITRA created by SOURABH. "
    "Answer code-related questions clearly, give examples, and show runnable snippets where useful."
)
HEADERS = {"Content-Type": "application/json"}

# how many last (user+assistant) pairs to keep in the prompt
MAX_TURNS_TO_KEEP = 6

# ---- stateful history: list of {"role":"user"|"assistant","content": str} ----
history: List[Dict[str, str]] = []

def _truncate_history(h: List[Dict[str, str]], keep_turns: int) -> List[Dict[str, str]]:
    """
    Keep at most keep_turns user/assistant pairs (i.e. 2*keep_turns messages)
    from the end of history.
    """
    max_msgs = keep_turns * 2
    if len(h) <= max_msgs:
        return h
    return h[-max_msgs:]

def _build_prompt(h: List[Dict[str, str]]) -> str:
    """
    Build the final prompt sent to the model. We prepend SYSTEM_PROMPT once,
    then append messages as "User: ..." / "Assistant: ...".
    """
    parts = [SYSTEM_PROMPT.strip()]
    for msg in h:
        role = msg["role"].capitalize()
        parts.append(f"{role}: {msg['content'].strip()}")
    # we can end with "Assistant:" to nudge model to reply, but many models accept just the history
    parts.append("Assistant:")
    return "\n".join(parts)

def call_ollama(prompt: str, model: str = MODEL_NAME, stream: bool = False, temperature: float = 0.2):
    """
    POST to /api/generate with the prompt and return the assistant text on success.
    """
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": stream,
        "temperature": temperature
    }
    try:
        resp = requests.post(OLLAMA_URL, headers=HEADERS, data=json.dumps(payload), timeout=60)
    except requests.RequestException as e:
        return False, f"Request failed: {e}"

    if resp.status_code != 200:
        # return error message
        return False, f"Error from server (status {resp.status_code}): {resp.text}"

    # expect JSON response with field 'response' like in your example
    try:
        data = resp.json()
    except ValueError:
        return False, f"Invalid JSON returned: {resp.text[:1000]}"

    assistant_text = data.get("response") or data.get("output") or data.get("text")
    if assistant_text is None:
        return False, f"No 'response' in model output: {data}"
    return True, assistant_text

# ---- Gradio callback ----
def respond(user_message: str, chat_history):
    """
    user_message: new user input string
    chat_history: the Gradio chat history (list of tuples) provided by Gradio; we ignore it and use our own `history`
    Returns updated chat history (list of (user, assistant) tuples).
    """
    user_message = user_message.strip()
    if user_message == "":
        return chat_history  # no change

    # append user message to our history
    history.append({"role": "user", "content": user_message})

    # truncate if necessary
    truncated = _truncate_history(history, MAX_TURNS_TO_KEEP)

    prompt = _build_prompt(truncated)

    ok, result = call_ollama(prompt, temperature=0.2)
    if not ok:
        assistant_reply = f"[Error] {result}"
    else:
        assistant_reply = result.strip()

    # append assistant reply to our history
    history.append({"role": "assistant", "content": assistant_reply})

    # build gradio chat tuples from history (only user+assistant pairs)
    gradio_pairs = []
    # iterate history in steps of 2 (user, assistant)
    i = 0
    while i < len(history):
        if history[i]["role"] == "user":
            user_text = history[i]["content"]
            # find the next assistant message (if exists)
            assistant_text = ""
            if i + 1 < len(history) and history[i + 1]["role"] == "assistant":
                assistant_text = history[i + 1]["content"]
                i += 2
            else:
                i += 1
            gradio_pairs.append((user_text, assistant_text))
        else:
            # if somehow an assistant msg appears without preceding user, skip it
            i += 1

    return gradio_pairs

# ---- Build Gradio interface ----
with gr.Blocks(theme=None) as demo:
    gr.Markdown("## CodeMITRA — Local Code Teaching Assistant\nAsk code questions, get examples and runnable snippets.")
    chatbot = gr.Chatbot(label="CodeMITRA Chat")
    txt = gr.Textbox(show_label=False, placeholder="Ask a code question...", lines=3)
    send = gr.Button("Send")

    # wire up
    send.click(respond, inputs=[txt, chatbot], outputs=chatbot)
    txt.submit(respond, inputs=[txt, chatbot], outputs=chatbot)

# ---- Run ----
if __name__ == "__main__":
    demo.launch(share=False, server_name="127.0.0.1", server_port=7860)












