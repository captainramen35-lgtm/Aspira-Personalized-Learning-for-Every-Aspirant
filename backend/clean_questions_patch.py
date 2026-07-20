import os
import sys
import json
from firebase_admin import firestore

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import backend.firebase_admin_init
from backend.firebase_admin_init import db

def clean_text(text):
    if not isinstance(text, str):
        return text
    
    # Replace glitched combining arrow characters
    text = text.replace("\u20d7", "") # combining right arrow
    
    # Replace unit vectors containing combining circumflex (U+0302) or precomposed î, ĵ with standard i, j, k
    # First deal with î (i + combining circumflex), ĵ (j + combining circumflex), k̂ (k + combining circumflex)
    text = text.replace("i\u0302", "i")
    text = text.replace("j\u0302", "j")
    text = text.replace("k\u0302", "k")
    # Precomposed î, ĵ, and k̂ with combined
    text = text.replace("î", "i")
    text = text.replace("ĵ", "j")
    text = text.replace("k̂", "k")
    
    # Replace combining circumflex generally if any remain
    text = text.replace("\u0302", "")
    
    # Replace specific subscripts like ₙ (U+2099) with standard n
    text = text.replace("\u2099", "n")
    
    return text

def clean_json_file(filepath):
    print(f"Cleaning JSON file: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    cleaned_count = 0
    for q in data:
        # Clean question text
        old_text = q.get("question_text", "")
        new_text = clean_text(old_text)
        if old_text != new_text:
            q["question_text"] = new_text
            cleaned_count += 1
            
        # Clean options
        opts = q.get("options", [])
        new_opts = [clean_text(o) for o in opts]
        q["options"] = new_opts
        
        # Clean solution/explanations
        if "detailed_solution" in q:
            q["detailed_solution"] = clean_text(q["detailed_solution"])
        if "formula_or_concept" in q:
            q["formula_or_concept"] = clean_text(q["formula_or_concept"])
        if "ai_explanation_seed" in q:
            q["ai_explanation_seed"] = clean_text(q["ai_explanation_seed"])

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print(f"Cleaned {cleaned_count} questions in {os.path.basename(filepath)}")
    return data

def update_firestore():
    subjects = ["mathematics", "physics", "chemistry", "biology"]
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "question_bank")
    
    for sub in subjects:
        filepath = os.path.join(data_dir, f"{sub}.json")
        if os.path.exists(filepath):
            questions = clean_json_file(filepath)
            
            print(f"Uploading cleaned questions for {sub} to Firestore...")
            batch = db.batch()
            count = 0
            
            for q in questions:
                q_id = q["id"]
                ref = db.collection("questions").document(q_id)
                batch.set(ref, q, merge=True)
                count += 1
                
                # Commit batch every 400 documents
                if count % 400 == 0:
                    batch.commit()
                    batch = db.batch()
                    print(f"Committed {count} questions...")
            
            batch.commit()
            print(f"Successfully uploaded {count} cleaned questions to Firestore for {sub}.")

if __name__ == "__main__":
    update_firestore()
