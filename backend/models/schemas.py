from pydantic import BaseModel
from typing import Dict, List, Optional

class DiagnosticSubmitRequest(BaseModel):
    answers: Dict[str, str]  # q_id -> answer ("A", "B", etc.)
    timestamps: Optional[Dict[str, float]] = None  # q_id -> time spent in seconds

class TestSubmitRequest(BaseModel):
    paper_id: str
    answers: Dict[str, str]  # q_id -> answer
    timestamps: Dict[str, float]  # q_id -> time spent in seconds

class TestQuestionResponse(BaseModel):
    id: str
    subject: str
    topic: str
    difficulty: str
    question_text: str
    options: List[str]

class GeneratedPaperResponse(BaseModel):
    paper_id: str
    questions: List[TestQuestionResponse]

class MasteryTopicDetail(BaseModel):
    accuracy: float
    attempts: int
    avg_time_sec: float

class MasteryProfileResponse(BaseModel):
    student_id: str
    name: str
    email: str
    mastery: Dict[str, MasteryTopicDetail]
    tests_completed: int
    joined_date: str

class StudentRosterItem(BaseModel):
    student_id: str
    name: str
    email: str
    tests_completed: int
    avg_accuracy: float

class ClassAnalyticsResponse(BaseModel):
    roster: List[StudentRosterItem]
    weakest_topics: List[Dict[str, float]]  # List of {"topic": str, "avg_accuracy": float}
    strong_weak_ratio: Dict[str, int]  # {"strong": int, "weak": int}
