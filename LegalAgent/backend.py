from fastapi import FastAPI
from pydantic import BaseModel
from legal_agent import legal_agent
from database import SessionLocal, LegalQuery

app = FastAPI(title="LexiGuard Legal Safety API")

class Question(BaseModel):
    question: str

@app.post("/ask")
def ask_legal_question(q: Question):
    try:
        result = legal_agent(q.question)

        db = SessionLocal()
        log = LegalQuery(
            question=q.question,
            answer=result["answer"],
            risk_level="high" if result["risk"] > 70 else "low"
        )
        db.add(log)
        db.commit()
        db.close()

        return result

    except Exception as e:
        print("Backend error:", e)
        return {
            "answer": "⚠️ System error during legal evaluation.",
            "confidence": 0,
            "risk": 100,
            "decision": "refuse"
        }


from typing import List

@app.get("/logs")
def get_logs():
    db = SessionLocal()
    logs = db.query(LegalQuery).order_by(LegalQuery.timestamp.desc()).all()
    db.close()

    return [
        {
            "id": log.id,
            "question": log.question,
            "risk_level": log.risk_level,
            "timestamp": log.timestamp
        }
        for log in logs
    ]


@app.get("/")
def read_root():
    return {"message": "LexiGuard Legal Safety API is running"}


