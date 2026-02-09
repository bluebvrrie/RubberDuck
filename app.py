import streamlit as st
import requests
from legal_agent import legal_agent

st.set_page_config(page_title="LexiGuard ⚖️", layout="centered")

# --- Sidebar ---
st.sidebar.title("⚖️ About LexiGuard")
st.sidebar.info("""
**LexiGuard provides general legal information only.**  
It is **not a lawyer** and does not provide legal advice.

If your issue involves:
- Court cases
- Criminal charges
- Contracts or lawsuits
- Legal deadlines

Consult a qualified legal professional.
""")
st.sidebar.warning("AI responses may not reflect the latest local laws.")
st.sidebar.divider()

admin_mode = st.sidebar.checkbox("🔒 Admin Dashboard")

# --- Custom Theme ---
st.markdown("""
<style>
body {
    background-color: #0E1117;
    color: #FAFAFA;
}
.stTextArea textarea {
    background-color: floralwhite;
    color: darkgreen;
}
.stButton>button {
    background-color: #C9A227;
    color: black;
    font-weight: bold;
    border-radius: 8px;
    height: 3em;
    width: 100%;
}
.response-card {
    padding: 20px;
    border-radius: 12px;
    background-color: antiquewhite;
    border-left: 6px solid #C9A227;
}
</style>
""", unsafe_allow_html=True)

# --- Header ---
st.title("⚖️ LexiGuard")
st.caption("AI-Powered Legal Safety Assistant")
st.write("Ask general legal questions. For real legal matters, consult a qualified lawyer.")

# --- User Input ---
user_question = st.text_area("Enter your legal question:", height=120)

if st.button("Analyze Question"):
    if user_question.strip():
        with st.spinner("Reviewing legal risk..."):
            response = requests.post(
                "http://127.0.0.1:8000/ask",
                json={"question": user_question}
            )
            data = response.json()

        answer = data["answer"]
        confidence = data["confidence"]
        risk = data["risk"]
        decision = data["decision"]  # ✅ FIX ADDED HERE
        safety = data.get("safety_decision", "UNKNOWN")

        st.markdown("### 📘 Response")
        st.markdown(f"<div class='response-card'>{answer}</div>", unsafe_allow_html=True)

        # --- Confidence & Risk Display ---
        st.markdown("### 🧠 AI Self-Evaluation")
        st.progress(confidence / 100)
        st.caption(f"Confidence Score: {confidence}%")
        st.caption(f"Risk Level: {risk}%")

        st.markdown("### 🛡️ Legal Safety Classification")

        if safety == "UNSAFE":
            st.error("🚨 Classified as HIGH legal risk — requires a real lawyer")
        elif safety == "SAFE":
            st.success("✅ Classified as SAFE for general legal information")
        else:
            st.warning("⚠️ Safety classification unavailable")

        # --- Decision Status ---
        if decision == "refuse":
            st.error("🚨 Agent refused due to low confidence or high risk")
        elif decision == "warn":
            st.warning("⚠️ Agent answered with caution due to some uncertainty")
        else:
            st.success("✅ Agent confident in response")

# --- Admin Dashboard ---
if admin_mode:
    st.subheader("📊 Admin Dashboard — Legal Query Logs")

    response = requests.get("http://127.0.0.1:8000/logs")
    logs = response.json()

    if not logs:
        st.info("No queries logged yet.")
    else:
        for log in logs:
            if log["risk_level"] == "high":
                st.error(f"🚨 HIGH RISK | {log['question']}")
            else:
                st.success(f"✅ LOW RISK | {log['question']}")

            st.caption(f"Asked at: {log['timestamp']}")
