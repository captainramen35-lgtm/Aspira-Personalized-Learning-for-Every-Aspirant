import os
import sys
from firebase_admin import firestore

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import backend.firebase_admin_init
from backend.firebase_admin_init import db

def clean_text(text):
    if not isinstance(text, str):
        return text
    # 1. Remove U+20D7 combining right arrow (causes overlapping/glitches)
    text = text.replace("\u20d7", "")
    # 2. Replace î, ĵ, and k̂ with standard plain letters
    text = text.replace("i\u0302", "i")
    text = text.replace("j\u0302", "j")
    text = text.replace("k\u0302", "k")
    text = text.replace("î", "i")
    text = text.replace("ĵ", "j")
    text = text.replace("k̂", "k")
    text = text.replace("\u0302", "")
    # 3. Replace subscript n
    text = text.replace("\u2099", "n")
    return text

def clean_historical_data():
    print("Scrubbing historical submissions in Firestore...")
    submissions_ref = db.collection("submissions")
    docs = submissions_ref.stream()
    
    count = 0
    for doc in docs:
        data = doc.to_dict()
        modified = False
        
        # Clean results list
        results = data.get("results", [])
        if results and isinstance(results, list):
            for r in results:
                if not isinstance(r, dict):
                    continue
                
                # Clean text fields
                for key in ["question_text", "detailed_solution", "formula_or_concept"]:
                    if key in r:
                        old_val = r[key]
                        new_val = clean_text(old_val)
                        if old_val != new_val:
                            r[key] = new_val
                            modified = True
                            
                # Clean options
                opts = r.get("options", [])
                if opts and isinstance(opts, list):
                    new_opts = [clean_text(o) for o in opts]
                    if opts != new_opts:
                        r["options"] = new_opts
                        modified = True
                        
                # Clean AI details
                if "ai_score_details" in r and isinstance(r["ai_score_details"], dict):
                    reasoning = r["ai_score_details"].get("reasoning", "")
                    new_reasoning = clean_text(reasoning)
                    if reasoning != new_reasoning:
                        r["ai_score_details"]["reasoning"] = new_reasoning
                        modified = True
                        
                # Clean Socratic feedback
                if "socratic_feedback" in r and isinstance(r["socratic_feedback"], dict):
                    for k in ["hint1", "hint2", "hint3", "final_explanation"]:
                        if k in r["socratic_feedback"]:
                            old_val = r["socratic_feedback"][k]
                            new_val = clean_text(old_val)
                            if old_val != new_val:
                                r["socratic_feedback"][k] = new_val
                                modified = True

        if modified:
            submissions_ref.document(doc.id).update({"results": results})
            count += 1
            print(f"Cleaned submission document ID: {doc.id}")

    print(f"Completed! Cleaned {count} historical submission documents.")

if __name__ == "__main__":
    clean_historical_data()
