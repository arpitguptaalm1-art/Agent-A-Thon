from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from agents import UserDataAgent, SchemeAnalyzerAgent, SimplifierAgent
import uvicorn
import os

app = FastAPI(title="Government Scheme AI Backend")

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize Agents
data_agent = UserDataAgent()
# Ensure schemes.json exists or is loaded correctly
scheme_agent = SchemeAnalyzerAgent(schemes_file="schemes.json")
simplifier_agent = SimplifierAgent()

# --- Pydantic Models for Input Validation ---
class UserProfile(BaseModel):
    name: str
    age: int
    income: float
    occupation: str
    state: str
    disability: str = "No" # Yes/No
    category: str # e.g., student, farmer, general, woman

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Government Scheme AI Backend is Running"}

@app.post("/api/store-user")
def store_user_data(user: UserProfile):
    """
    Endpoint for the Data Agent.
    Stores user info into Excel.
    """
    success, msg = data_agent.save_user(user.dict())
    if not success:
        raise HTTPException(status_code=500, detail=msg)
    return {"status": "success", "message": "User data saved securely."}

@app.post("/api/recommend")
def recommend_schemes(user: UserProfile):
    """
    Endpoint for Analyzer + Simplifier Agents.
    Returns recommended schemes with simplified explanations.
    """
    # 1. Analyze
    recommendations = scheme_agent.recommend(user.dict())
    
    if not recommendations:
        return {"message": "No specific schemes found for your criteria, but check out general schemes.", "data": []}

    # 2. Simplify (Top 3)
    simplified_results = []
    for rec in recommendations[:3]:
        simple_text = simplifier_agent.simplify(rec, user_name=user.name)
        simplified_results.append({
            "scheme_id": rec['scheme']['id'],
            "title": rec['scheme']['title'],
            "match_score": round(rec['score'], 2),
            "simple_explanation": simple_text,
            "original_data": rec['scheme']
        })

    return {
        "count": len(simplified_results),
        "results": simplified_results
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
