"""
Shared helper for grouping a student's chapter-level mastery data into the
3 top-level subjects (Physics/Chemistry/Mathematics for JEE, or
Physics/Chemistry/Biology for NEET).

This lives in its own module so both `mastery.py` (student's own profile)
and `teacher.py` (teacher's view of a student) build the exact same
subject -> chapter grouping, using the exact same source of truth (the
question bank's subject/chapter tags). That guarantees every student on
the same exam track ends up with the same set of subject keys in their
mastery profile, even if they haven't attempted every subject yet
(fixes the "different students show a different number of subjects" bug).
"""

from backend.services.question_bank_loader import question_bank_loader

# Canonical subject list per exam track, in the order they should be shown.
EXAM_SUBJECTS = {
    "JEE": ["Physics", "Chemistry", "Mathematics"],
    "NEET": ["Physics", "Chemistry", "Biology"],
}

_chapter_subject_cache = None


def get_chapter_subject_map():
    """
    Returns a {chapter_name: subject_name} map built once from the full
    question bank (every question already carries both fields), then
    cached in-process. Falls back gracefully if the bank changes shape.
    """
    global _chapter_subject_cache
    if _chapter_subject_cache is None:
        mapping = {}
        try:
            for q in question_bank_loader.get_all_questions():
                chap = q.get("chapter")
                subj = q.get("subject")
                if chap and subj and chap not in mapping:
                    mapping[chap] = subj
        except Exception:
            # If the question bank can't be read for any reason, don't
            # blow up the mastery/teacher endpoints over it - just fall
            # back to an empty map, which buckets every chapter under "Other".
            mapping = {}
        _chapter_subject_cache = mapping
    return _chapter_subject_cache


def resolve_target_exam(db, user_data: dict) -> str:
    """
    Best-effort resolution of which exam track (JEE/NEET) a student belongs
    to, so we know whether to show Physics/Chem/Math or Physics/Chem/Bio.
    Priority: the student's assigned batch's target_exam -> a target_exam
    field on the user doc itself -> default to JEE.
    """
    assigned_batch_id = user_data.get("assigned_batch_id")
    if assigned_batch_id:
        batch_doc = db.collection("batches").document(assigned_batch_id).get()
        if batch_doc.exists:
            target_exam = batch_doc.to_dict().get("target_exam")
            if target_exam in EXAM_SUBJECTS:
                return target_exam

    fallback = user_data.get("target_exam")
    if fallback in EXAM_SUBJECTS:
        return fallback

    return "JEE"


def group_chapters_by_subject(chapters_dict: dict, target_exam: str):
    """
    chapters_dict: {chapter_name: <mastery data, dict or pydantic model>}
    target_exam: "JEE" or "NEET" (anything else falls back to JEE's subjects)

    Returns (subjects_dict, ordered_subject_names):
      subjects_dict: {subject_name: {chapter_name: <same mastery data>}}
        - every canonical subject for the exam is always present as a key,
          even with an empty {} if the student hasn't attempted any chapter
          in that subject yet.
      ordered_subject_names: canonical subject order, with "Other" appended
        only if some chapter couldn't be matched to a known subject.
    """
    exam_subjects = EXAM_SUBJECTS.get(target_exam, EXAM_SUBJECTS["JEE"])
    chapter_subject_map = get_chapter_subject_map()

    subjects_dict = {s: {} for s in exam_subjects}
    used_other = False

    for chap, data in chapters_dict.items():
        subj = chapter_subject_map.get(chap)
        if subj not in subjects_dict:
            subjects_dict.setdefault("Other", {})
            subj = "Other"
            used_other = True
        subjects_dict[subj][chap] = data

    ordered_subject_names = exam_subjects + (["Other"] if used_other else [])
    return subjects_dict, ordered_subject_names