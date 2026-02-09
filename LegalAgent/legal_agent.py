import os
from dotenv import load_dotenv
from google import genai
from google.genai.types import Tool, FunctionDeclaration, Schema, Type

SAFETY_CLASSIFIER_PROMPT = """
You are a Legal Safety Classifier AI.

Your job is ONLY to decide if a legal question is SAFE or UNSAFE to answer.

UNSAFE if:
- The user asks what THEY should do in a legal situation
- The question involves court cases, charges, lawsuits, or deadlines
- The answer could affect legal rights or outcomes
- Important personal legal details are missing

SAFE if:
- The question is general legal knowledge
- No personal legal strategy is requested

Respond with ONLY ONE WORD:
SAFE or UNSAFE
"""

LEGAL_INFO_PROMPT = """
You are a Legal Information Assistant, not a lawyer.

Provide GENERAL legal information for educational purposes only.

RULES:
- Do NOT give personal legal advice
- Do NOT tell users what they should do
- Do NOT predict legal outcomes
- Use phrases like "generally", "in many places", "laws vary by location"

If a situation sounds serious, remind the user to consult a qualified lawyer.
"""

load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
MODEL_NAME = "gemini-2.5-flash"

legal_safety_tool = Tool(
    function_declarations=[
        FunctionDeclaration(
            name="evaluate_legal_safety",
            description="Evaluate how safely the AI can answer a legal question",
            parameters=Schema(
                type=Type.OBJECT,
                properties={
                    "evidence": Schema(type=Type.NUMBER),
                    "completeness": Schema(type=Type.NUMBER),
                    "risk": Schema(type=Type.NUMBER),
                    "contradictions": Schema(type=Type.BOOLEAN),
                },
                required=["evidence", "completeness", "risk", "contradictions"],
            ),
        )
    ]
)

def analyze_risk(user_question):
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=SAFETY_CLASSIFIER_PROMPT + f"\n\nQuestion: {user_question}"
    )
    decision = response.text.strip().upper()
    if decision not in ["SAFE", "UNSAFE"]:
        return "UNSAFE"
    return decision

def evaluate_confidence(user_question):
    prompt = f"""
You are a legal safety evaluator AI.
Analyze the legal question and CALL the function `evaluate_legal_safety`.

Question: {user_question}
"""
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            tools=[legal_safety_tool]
        )
        function_call = None
        for part in response.candidates[0].content.parts:
            if hasattr(part, "function_call") and part.function_call:
                function_call = part.function_call
                break
        if not function_call:
            return 50, 50, False

        args = function_call.args
        evidence = int(args.get("evidence", 50))
        completeness = int(args.get("completeness", 50))
        risk = int(args.get("risk", 50))
        contradictions = bool(args.get("contradictions", False))
        confidence = int((evidence * 0.45) + (completeness * 0.45) + ((100 - risk) * 0.10))
        return confidence, risk, contradictions

    except:
        return 50, 50, False

def generate_refusal_reason(user_question):
    prompt = f"""
Explain briefly (1 sentence) why this legal question is unsafe for an AI to answer.
Do NOT give legal advice.

Question: {user_question}
"""
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )
    return response.text.strip()

def legal_agent(user_question):

    safety_decision = analyze_risk(user_question)

    if safety_decision == "UNSAFE":
        reason = generate_refusal_reason(user_question)
        return {
            "answer": f"⚖️ I can't safely help with this.\n\nReason: {reason}\n\nPlease consult a qualified lawyer.",
            "confidence": 0,
            "risk": 100,
            "decision": "refuse",
            "safety_decision": safety_decision
        }

    confidence, risk, contradictions = evaluate_confidence(user_question)

    if contradictions:
        reason = generate_refusal_reason(user_question)
        return {
            "answer": f"⚖️ I can't safely help with this.\n\nReason: {reason}\n\nPlease consult a qualified lawyer.",
            "confidence": confidence,
            "risk": risk,
            "decision": "refuse",
            "safety_decision": safety_decision
        }

    if confidence < 40 or risk > 75:
        reason = generate_refusal_reason(user_question)
        return {
            "answer": f"⚖️ I can't safely help with this.\n\nReason: {reason}\n\nPlease consult a qualified lawyer.",
            "confidence": confidence,
            "risk": risk,
            "decision": "refuse",
            "safety_decision": safety_decision
        }

    if 50 <= confidence <= 80:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=LEGAL_INFO_PROMPT + f"\nUser question: {user_question}"
        ).text
        return {
            "answer": "⚠️ This is general legal information with some uncertainty.\n\n" + response,
            "confidence": confidence,
            "risk": risk,
            "decision": "warn",
            "safety_decision": safety_decision
        }

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=LEGAL_INFO_PROMPT + f"\nUser question: {user_question}"
    ).text

    return {
        "answer": response,
        "confidence": confidence,
        "risk": risk,
        "decision": "act",
        "safety_decision": safety_decision
    }

if __name__ == "__main__":
    print("⚖️ Legal Safety Agent (Educational Use Only)")
    while True:
        user_input = input("Ask a legal question: ")
        if user_input.lower() == "exit":
            break
        print(legal_agent(user_input))
