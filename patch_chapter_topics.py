import json
import glob
from backend.firebase_admin_init import db
import os

def patch_chapter_topics():
    # 1. Build chapter_topics map from JSONs
    chapter_topics = {}
    json_files = glob.glob("backend/data/question_bank/*.json")
    for file_path in json_files:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            for q in data:
                ch = q.get("chapter")
                top = q.get("topic")
                if ch and top:
                    if ch not in chapter_topics:
                        chapter_topics[ch] = []
                    if top not in chapter_topics[ch]:
                        chapter_topics[ch].append(top)
    
    print(f"Built map for {len(chapter_topics)} chapters.")
    
    # 2. Patch all mastery profiles
    profiles_ref = db.collection("mastery_profiles")
    docs = profiles_ref.stream()
    count = 0
    for doc in docs:
        doc_data = doc.to_dict()
        existing_ct = doc_data.get("chapter_topics", {})
        
        # Merge existing with the master list, but only include topics the student actually attempted?
        # Wait, the profile should probably have ALL topics for that chapter, or only the ones they attempted.
        # Let's just put the global map for any chapter they have in their "chapters" dictionary.
        
        updated_ct = {}
        student_chapters = doc_data.get("chapters", {})
        for ch in student_chapters.keys():
            if ch in chapter_topics:
                updated_ct[ch] = chapter_topics[ch]
                
        doc.reference.update({"chapter_topics": updated_ct})
        count += 1
        print(f"Patched profile {doc.id}")
        
    print(f"Done. Patched {count} profiles.")

if __name__ == "__main__":
    patch_chapter_topics()
