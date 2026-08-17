from fastapi import APIRouter, Depends, HTTPException
from backend.routers.auth import get_current_user
from backend.firebase_admin_init import db
from backend.services.subject_utils import (
    get_chapter_subject_map,
    resolve_target_exam,
    group_chapters_by_subject,
    EXAM_SUBJECTS,
)
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/api/teacher", tags=["teacher"])


def _build_class_recommendations(roster, weakest_topics, flagged_students, batch_id, batch_name, batch_target_exam):
    """
    Builds the class-wide "AI Teaching Recommendations" list.

    - When batch_id is None ("All Classes" filter): produces a broader,
      more detailed set of recommendations that looks across every batch
      the teacher owns (weakest chapters, weakest vs strongest batch,
      flagged students, and overall engagement).
    - When batch_id is set (a specific batch filter): every recommendation
      is scoped and worded specifically for that batch - it names the
      batch, and adds a subject-level (Physics/Chemistry/Math or Bio)
      breakdown unique to that batch's exam track.
    """
    recommendations = []
    chapter_subject_map = get_chapter_subject_map()

    if not batch_id:
        # ---------------- ALL CLASSES: detailed, multi-angle ----------------
        worst = [w for w in weakest_topics[:2] if w["avg_accuracy"] < 50.0]
        for w in worst:
            recommendations.append({
                "title": f"Reinforce {w['topic']}",
                "detail": (
                    f"Across every batch you teach, the average accuracy on '{w['topic']}' "
                    f"is {w['avg_accuracy']}%. This is dragging down overall class performance - "
                    f"consider a shared remedial session or an extra practice set covering this "
                    f"chapter before moving further ahead in the syllabus."
                ),
                "priority": "high" if w["avg_accuracy"] < 35 else "medium",
            })
        if not worst and weakest_topics:
            strongest = weakest_topics[-1]
            recommendations.append({
                "title": "Overall syllabus pace is healthy",
                "detail": (
                    f"No chapter is currently averaging below 50% across your batches. "
                    f"'{strongest['topic']}' is the strongest ({strongest['avg_accuracy']}%) - "
                    f"maintain the current homework cadence and keep monitoring for regressions."
                ),
                "priority": "low",
            })

        # Per-batch breakdown: which batch needs the most attention
        batch_groups: Dict[str, List[float]] = {}
        for r in roster:
            key = r.get("batch_name") or "Unassigned"
            batch_groups.setdefault(key, []).append(r["avg_accuracy"])
        if len(batch_groups) > 1:
            batch_avgs = {name: (sum(v) / len(v) if v else 0.0) for name, v in batch_groups.items()}
            weakest_batch = min(batch_avgs, key=batch_avgs.get)
            strongest_batch = max(batch_avgs, key=batch_avgs.get)
            if weakest_batch != strongest_batch:
                recommendations.append({
                    "title": f"'{weakest_batch}' needs the most attention",
                    "detail": (
                        f"Comparing all your batches, '{weakest_batch}' has the lowest average "
                        f"accuracy ({round(batch_avgs[weakest_batch], 1)}%), while '{strongest_batch}' "
                        f"leads at {round(batch_avgs[strongest_batch], 1)}%. Consider carrying over "
                        f"whatever pacing or practice material is working in '{strongest_batch}' to "
                        f"'{weakest_batch}'."
                    ),
                    "priority": "medium",
                })

        if flagged_students:
            names = [f["name"] for f in flagged_students[:3]]
            extra = f" and {len(flagged_students) - 3} more" if len(flagged_students) > 3 else ""
            recommendations.append({
                "title": f"{len(flagged_students)} student(s) showing a declining trend",
                "detail": (
                    f"Across all batches, {len(flagged_students)} student(s) are trending downward "
                    f"in at least one chapter - starting with {', '.join(names)}{extra}. A short "
                    f"1:1 check-in with each can catch the issue before it compounds."
                ),
                "priority": "high",
            })
        else:
            recommendations.append({
                "title": "No declining-performance flags right now",
                "detail": (
                    "None of your students are currently trending downward in any chapter. "
                    "Keep the current pace and revisit this after the next round of tests."
                ),
                "priority": "low",
            })

        low_active = [r["name"] for r in roster if r["tests_completed"] < 2]
        if low_active:
            pct = round(len(low_active) / len(roster) * 100) if roster else 0
            recommendations.append({
                "title": f"{len(low_active)} student(s) ({pct}%) have low practice activity",
                "detail": (
                    f"Students including {', '.join(low_active[:3])} have completed fewer than 2 "
                    f"practice sessions across all your batches. Consider assigning a lightweight "
                    f"adaptive paper this week - both to re-engage them and to get enough data for "
                    f"their mastery profile to be meaningful."
                ),
                "priority": "medium",
            })
        else:
            recommendations.append({
                "title": "Participation is strong across every batch",
                "detail": (
                    "Nearly all students across your batches have completed multiple practice "
                    "sessions. No engagement intervention needed right now."
                ),
                "priority": "low",
            })

    else:
        # ---------------- SPECIFIC BATCH: tightly scoped & customized ----------------
        exam_label = f" ({batch_target_exam})" if batch_target_exam else ""

        worst = [w for w in weakest_topics[:2] if w["avg_accuracy"] < 50.0]
        for w in worst:
            subject = chapter_subject_map.get(w["topic"], "General")
            recommendations.append({
                "title": f"'{batch_name}'{exam_label}: reinforce {w['topic']}",
                "detail": (
                    f"Within '{batch_name}', the class average on '{w['topic']}' ({subject}) is "
                    f"{w['avg_accuracy']}%. Assign a targeted practice set for this chapter before "
                    f"the batch's next test, and consider a short recap at the start of the next "
                    f"{subject} class."
                ),
                "priority": "high" if w["avg_accuracy"] < 35 else "medium",
            })
        if not worst and weakest_topics:
            strongest = weakest_topics[-1]
            recommendations.append({
                "title": f"'{batch_name}' is on track",
                "detail": (
                    f"No chapter in '{batch_name}' is currently averaging below 50%. "
                    f"'{strongest['topic']}' is the batch's strongest chapter "
                    f"({strongest['avg_accuracy']}%) - maintain the current schedule for this group."
                ),
                "priority": "low",
            })

        if flagged_students:
            names = [f["name"] for f in flagged_students[:3]]
            extra = " and others" if len(flagged_students) > 3 else ""
            recommendations.append({
                "title": f"{len(flagged_students)} student(s) in '{batch_name}' trending down",
                "detail": (
                    f"{', '.join(names)}{extra} in this batch show a declining mastery trend in at "
                    f"least one chapter. Since this is a single batch, a quick group discussion on "
                    f"the affected chapter(s) alongside individual check-ins should help."
                ),
                "priority": "high",
            })
        else:
            recommendations.append({
                "title": f"No flags in '{batch_name}' this week",
                "detail": f"Every student in '{batch_name}' is holding steady or improving. No intervention needed for this batch right now.",
                "priority": "low",
            })

        low_active = [r["name"] for r in roster if r["tests_completed"] < 2]
        if low_active:
            extra = " and others" if len(low_active) > 3 else ""
            recommendations.append({
                "title": f"Low engagement in '{batch_name}'",
                "detail": (
                    f"{', '.join(low_active[:3])}{extra} in this batch have completed fewer than 2 "
                    f"practice sessions. A batch-wide adaptive paper assigned this week would give "
                    f"you fresher mastery data for the whole group."
                ),
                "priority": "medium",
            })
        else:
            recommendations.append({
                "title": f"'{batch_name}' is actively practicing",
                "detail": "Most students in this batch are completing practice papers regularly. Keep the current cadence.",
                "priority": "low",
            })

        # Subject-wise breakdown - unique to a specific batch's exam track
        if batch_target_exam:
            exam_subjects = EXAM_SUBJECTS.get(batch_target_exam, EXAM_SUBJECTS["JEE"])
            subject_scores: Dict[str, List[float]] = {s: [] for s in exam_subjects}
            for w in weakest_topics:
                subj = chapter_subject_map.get(w["topic"])
                if subj in subject_scores:
                    subject_scores[subj].append(w["avg_accuracy"])
            scored = {s: (sum(v) / len(v)) for s, v in subject_scores.items() if v}
            if len(scored) > 1:
                weakest_subject = min(scored, key=scored.get)
                others = ", ".join(f"{s} ({round(v, 1)}%)" for s, v in scored.items() if s != weakest_subject)
                recommendations.append({
                    "title": f"'{batch_name}': {weakest_subject} needs the most focus",
                    "detail": (
                        f"Averaging across all attempted chapters, {weakest_subject} is this batch's "
                        f"weakest subject at {round(scored[weakest_subject], 1)}%, compared to "
                        f"{others}. Worth allocating extra {weakest_subject} practice for this batch "
                        f"specifically."
                    ),
                    "priority": "medium",
                })

    return recommendations


@router.get("/analytics")
async def get_class_analytics(batch_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    """
    Returns class-wide aggregated analytics and the student roster list.
    Verifies that the requesting user is a teacher.
    """
    # 1. Verify user is a teacher
    uid = user["uid"]
    teacher_doc = db.collection("users").document(uid).get()
    if not teacher_doc.exists or teacher_doc.to_dict().get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Access denied. Only teachers can access this panel.")

    # 1b. If a specific batch is requested, confirm it exists and belongs to this teacher.
    batch_name = None
    batch_target_exam = None
    if batch_id:
        batch_doc = db.collection("batches").document(batch_id).get()
        if not batch_doc.exists:
            raise HTTPException(status_code=404, detail="Batch not found.")
        batch_data = batch_doc.to_dict()
        if batch_data.get("teacher_id") != uid:
            raise HTTPException(status_code=403, detail="You do not own this batch.")
        batch_name = batch_data.get("name", "")
        batch_target_exam = batch_data.get("target_exam")

    try:
        # 2. Fetch student profiles and users - scoped to the selected batch if provided.
        # FIX (issue 5): students here are always counted live from the `users`
        # collection via assigned_batch_id, the same source of truth used by
        # Batch Management (see batches.py list_batches, which now also counts
        # live instead of trusting the batch doc's `current_count` field). This
        # keeps the numbers shown in Class Pulse and Batch Management in sync.
        if batch_id:
            students_ref = (
                db.collection("users")
                .where("role", "==", "student")
                .where("assigned_batch_id", "==", batch_id)
                .stream()
            )
        else:
            students_ref = db.collection("users").where("role", "==", "student").stream()

        student_metadata = {}
        for s in students_ref:
            sdata = s.to_dict()
            student_metadata[s.id] = {
                "name": sdata.get("name", "Unknown Student"),
                "email": sdata.get("email", ""),
                "joined_date": sdata.get("joined_date", "July 2026"),
                "assigned_batch_id": sdata.get("assigned_batch_id"),
                "assigned_batch_name": sdata.get("assigned_batch_name")
            }

        # Only pull in mastery profiles for students within the current scope
        # (all students, or just the selected batch), so every metric below -
        # roster, chapter averages, strong/weak split, flagged students, and
        # recommendations - is naturally computed for that scope only.
        profiles_ref = db.collection("mastery_profiles").stream()
        student_profiles = {}
        for p in profiles_ref:
            if p.id in student_metadata:
                student_profiles[p.id] = p.to_dict()

        # 3. Build Roster
        roster = []

        for s_id, meta in student_metadata.items():
            profile = student_profiles.get(s_id, {})
            mastery = profile.get("mastery", {})
            
            # Compute average accuracy across all attempted topics
            accuracies = [m.get("accuracy", 0.0) for m in mastery.values() if m.get("attempts", 0) > 0]
            avg_acc = sum(accuracies) / len(accuracies) if accuracies else 0.0
            
            roster.append({
                "student_id": s_id,
                "name": meta["name"],
                "email": meta["email"],
                "batch_id": meta.get("assigned_batch_id"),
                "batch_name": meta.get("assigned_batch_name"),
                "tests_completed": profile.get("tests_completed", 0),
                "avg_accuracy": round(avg_acc * 100, 1)  # Scale to percentage
            })

        # Sort roster alphabetically by name
        roster.sort(key=lambda x: x["name"])

        # 4. Calculate Chapter-wise Average Mastery (Class Pulse)
        all_chapters = set()
        for profile in student_profiles.values():
            chapters_data = profile.get("chapters", {})
            all_chapters.update(chapters_data.keys())

        chapter_sums = {chapter: [] for chapter in all_chapters}
        for profile in student_profiles.values():
            chapters_data = profile.get("chapters", {})
            for chapter in all_chapters:
                cdata = chapters_data.get(chapter, {})
                if cdata.get("attempts", 0) > 0:
                    chapter_sums[chapter].append(cdata.get("accuracy", 0.0))

        weakest_topics = [] # Renaming to weakest_topics in payload so frontend doesn't break instantly, but it contains chapters
        for chapter in all_chapters:
            acc_list = chapter_sums[chapter]
            avg_val = sum(acc_list) / len(acc_list) if acc_list else 0.50  # Default to 50%
            weakest_topics.append({
                "topic": chapter,
                "avg_accuracy": round(avg_val * 100, 1)
            })

        # Sort chapters so weaker ones appear first
        weakest_topics.sort(key=lambda x: x["avg_accuracy"])

        # 5. Weak / Strong distribution
        # Strong: avg accuracy >= 60%. Weak: < 60%
        strong_count = 0
        weak_count = 0
        for item in roster:
            if item["avg_accuracy"] >= 60.0:
                strong_count += 1
            else:
                weak_count += 1
                
        # 6. Flagged students (students with declining trend in 1 or more chapters)
        flagged_students = []
        for s_id, profile in student_profiles.items():
            chapters_data = profile.get("chapters", {})
            declining_topics = []
            for chapter, cdata in chapters_data.items():
                if cdata.get("trend") == "declining":
                    declining_topics.append(chapter)
            if declining_topics:
                meta = student_metadata.get(s_id, {"name": "Unknown"})
                flagged_students.append({
                    "student_id": s_id,
                    "name": meta["name"],
                    "declining_topics": declining_topics
                })

        # 7. AI-Driven Class-wide Teaching Recommendations
        # (issue 1: detailed for "All Classes", customized per selected batch)
        recommendations = _build_class_recommendations(
            roster, weakest_topics, flagged_students, batch_id, batch_name, batch_target_exam
        )

        return {
            "roster": roster,
            "weakest_topics": weakest_topics,
            "strong_weak_ratio": {"strong": strong_count, "weak": weak_count},
            "flagged_students": flagged_students,
            "teaching_recommendations": recommendations,
            "scope": {
                "batch_id": batch_id,
                "batch_name": batch_name
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compile teacher analytics: {e}")

@router.get("/student/{student_id}")
async def get_student_details(student_id: str, user: dict = Depends(get_current_user)):
    """
    Returns full details for a selected student, including:
    - Profile metadata
    - Topic-wise mastery bars, grouped by subject
    - Response speed analysis
    - Recurring mistake patterns summarized from their incorrect submissions
    """
    # 1. Verify user is a teacher
    uid = user["uid"]
    teacher_doc = db.collection("users").document(uid).get()
    if not teacher_doc.exists or teacher_doc.to_dict().get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Access denied.")

    try:
        # 2. Fetch student user meta
        student_doc = db.collection("users").document(student_id).get()
        if not student_doc.exists:
            raise HTTPException(status_code=404, detail="Student not found.")
        sdata = student_doc.to_dict()

        # 3. Fetch student profile
        profile_doc = db.collection("mastery_profiles").document(student_id).get()
        
        mastery = {}
        chapters = {}
        tests_completed = 0
        
        if profile_doc.exists:
            pdata = profile_doc.to_dict()
            mastery = pdata.get("mastery", {})
            chapters = pdata.get("chapters", {})
            tests_completed = pdata.get("tests_completed", 0)

        # Construct dynamic topic-wise output
        mastery_response = {}
        total_attempts = 0
        total_time = 0.0
        
        # If student hasn't done anything yet, fallback to default_topics
        active_topics = list(mastery.keys()) if mastery else [
            "Kinematics", "Laws of Motion", "Thermodynamics", "Chemical Bonding",
            "Chemical Kinetics", "Algebra", "Calculus", "Cell Biology", "Genetics"
        ]

        for topic in active_topics:
            tdata = mastery.get(topic, {})
            accuracy = tdata.get("accuracy", 0.0)
            attempts = tdata.get("attempts", 0)
            avg_time = tdata.get("avg_time_sec", 0.0)
            trend = tdata.get("trend", "stable")
            
            total_attempts += attempts
            total_time += (avg_time * attempts)
            
            mastery_response[topic] = {
                "accuracy": round(accuracy * 100, 1) if accuracy <= 1.0 and accuracy > 0.0 else round(accuracy, 1),
                "attempts": attempts,
                "avg_time_sec": avg_time,
                "trend": trend
            }

        # Construct dynamic chapter-level output
        chapters_response = {}
        for chap, cdata in chapters.items():
            c_acc = cdata.get("accuracy", 0.0)
            chapters_response[chap] = {
                "accuracy": round(c_acc * 100, 1) if c_acc <= 1.0 and c_acc > 0.0 else round(c_acc, 1),
                "attempts": cdata.get("attempts", 0),
                "avg_time_sec": cdata.get("avg_time_sec", 0.0)
            }

        # FIX: this referenced an undefined variable `profile_data` before
        # (only `pdata` and `profile_doc` exist in this scope), which would
        # raise a NameError / 500 error any time this endpoint was hit.
        chapter_topics = pdata.get("chapter_topics", {}) if profile_doc.exists else {}

        # Group chapters into subjects (issue 2 & 4): every student on the
        # same exam track gets the same subject keys, even if a subject has
        # no attempted chapters yet.
        target_exam = resolve_target_exam(db, sdata)
        subjects_response, exam_subjects = group_chapters_by_subject(chapters_response, target_exam)

        # Speed analysis
        avg_speed_sec = round(total_time / total_attempts, 1) if total_attempts > 0 else 0.0
        speed_status = "STABLE"
        if avg_speed_sec > 75.0:
            speed_status = "SLOW"
        elif 0 < avg_speed_sec < 45.0:
            speed_status = "FAST"

        # 4. Generate recurring mistake patterns from submission history
        # (issue 3: more detailed - percentage breakdown + top 2 error chapters
        # instead of just 1)
        submissions_ref = db.collection("submissions").where("student_id", "==", student_id).stream()
        mistake_counts = {"conceptual": 0, "computational": 0}
        mistake_topics = {}

        for sub in submissions_ref:
            sub_data = sub.to_dict()
            results = sub_data.get("results", [])
            for res in results:
                if not res.get("is_correct", True):
                    t = res.get("topic", "General")
                    m_type = res.get("ai_score_details", {}).get("mistake_type", "conceptual")
                    
                    mistake_counts[m_type] = mistake_counts.get(m_type, 0) + 1
                    mistake_topics[t] = mistake_topics.get(t, 0) + 1

        mistake_patterns = []
        if total_attempts == 0:
            mistake_patterns.append({
                "title": "No test data yet",
                "detail": "This student hasn't completed any tests yet, so no mistake pattern can be detected. Encourage them to take the Diagnostic Practice Test to get started.",
                "priority": "low",
            })
        else:
            total_errors = sum(mistake_counts.values())
            if total_errors == 0:
                mistake_patterns.append({
                    "title": "No repeating mistake patterns",
                    "detail": "Every attempted question so far has been answered correctly, or the errors are too scattered to form a pattern. Keep up the current level of practice.",
                    "priority": "low",
                })
            else:
                conceptual = mistake_counts.get("conceptual", 0)
                computational = mistake_counts.get("computational", 0)
                conceptual_pct = round(conceptual / total_errors * 100) if total_errors else 0
                computational_pct = round(computational / total_errors * 100) if total_errors else 0

                if conceptual > computational:
                    mistake_patterns.append({
                        "title": f"Primary error style: Conceptual gaps ({conceptual_pct}% of errors)",
                        "detail": (
                            f"{conceptual} of this student's {total_errors} recorded mistakes stem "
                            f"from conceptual misunderstanding rather than calculation slips, versus "
                            f"{computational} computational errors ({computational_pct}%). This usually "
                            f"means the underlying formula or derivation isn't fully internalized yet - "
                            f"focus remediation on 'why', not just 'how'."
                        ),
                        "priority": "high" if conceptual_pct >= 65 else "medium",
                    })
                else:
                    mistake_patterns.append({
                        "title": f"Primary error style: Computational slips ({computational_pct}% of errors)",
                        "detail": (
                            f"{computational} of this student's {total_errors} recorded mistakes are "
                            f"arithmetic or calculation errors rather than conceptual gaps, versus "
                            f"{conceptual} conceptual errors ({conceptual_pct}%). The underlying concept "
                            f"is likely understood - the issue is execution speed/accuracy under test "
                            f"conditions."
                        ),
                        "priority": "high" if computational_pct >= 65 else "medium",
                    })

                # Top 2 weakest-by-error topics instead of just 1
                if mistake_topics:
                    sorted_topics = sorted(mistake_topics.items(), key=lambda kv: kv[1], reverse=True)[:2]
                    for t_name, t_count in sorted_topics:
                        mistake_patterns.append({
                            "title": f"Recurring errors in {t_name}",
                            "detail": (
                                f"{t_count} of this student's wrong answers came from {t_name}. "
                                f"Consider assigning a focused worksheet on this topic and reviewing "
                                f"1-2 of their incorrect attempts together to pin down the exact "
                                f"misconception."
                            ),
                            "priority": "medium",
                        })

        # 5. AI Student-specific Teaching Recommendations (issue 3: more detail)
        rec_list = []
        if tests_completed == 0:
            rec_list.append({
                "title": "Get the student started",
                "detail": (
                    "Prompt the student to take the Diagnostic Practice Test. This establishes their "
                    "baseline mastery profile, without which personalized recommendations, chapter "
                    "mastery, and mistake-pattern detection can't run."
                ),
                "priority": "high",
            })
        else:
            # Pacing
            if speed_status == "SLOW":
                rec_list.append({
                    "title": f"Pacing is slow ({avg_speed_sec}s/question avg)",
                    "detail": (
                        f"This student is averaging {avg_speed_sec} seconds per question, above the "
                        f"75s threshold flagged as slow. Suggest shorter, strictly timed mock drills "
                        f"(e.g. 20 questions in 20 minutes) to build speed without sacrificing the "
                        f"accuracy they already have."
                    ),
                    "priority": "medium",
                })
            elif speed_status == "FAST":
                rec_list.append({
                    "title": f"Pacing is fast ({avg_speed_sec}s/question avg)",
                    "detail": (
                        f"At {avg_speed_sec}s per question (under the 45s fast threshold), this "
                        f"student may be rushing. Remind them to double-check algebra/units before "
                        f"submitting, especially on multi-step numerical problems, to reduce "
                        f"avoidable slips."
                    ),
                    "priority": "medium",
                })
            else:
                rec_list.append({
                    "title": "Pacing is on track",
                    "detail": f"At {avg_speed_sec}s per question on average, this student's pace is within the healthy range. No pacing intervention needed right now.",
                    "priority": "low",
                })
            
            # Weak topic
            weak_list = [chap for chap, data in chapters_response.items() if data["accuracy"] < 40.0]
            if weak_list:
                rec_list.append({
                    "title": f"{len(weak_list)} weak chapter(s) detected",
                    "detail": (
                        f"Accuracy is below 40% in: {', '.join(weak_list)}. Assign custom practice "
                        f"targets for these specific chapters rather than general revision, so the "
                        f"student's limited study time goes where it matters most."
                    ),
                    "priority": "high",
                })
            else:
                rec_list.append({
                    "title": "Strong baseline across active chapters",
                    "detail": "No chapter is currently below the 40% weak-threshold. Continue with the standard syllabus pace for this student.",
                    "priority": "low",
                })

            # Socratic Mistake Reflection Recommendations
            if mistake_counts.get("conceptual", 0) > mistake_counts.get("computational", 0):
                rec_list.append({
                    "title": "Address conceptual gaps directly",
                    "detail": (
                        "Given this student's conceptual-mistake rate, share worked derivations or "
                        "short tutorial links for the chapters they're struggling with, rather than "
                        "just assigning more practice questions - repetition alone won't fix a "
                        "misunderstood concept."
                    ),
                    "priority": "medium",
                })
            elif mistake_counts.get("computational", 0) > 0:
                rec_list.append({
                    "title": "Reduce computational errors",
                    "detail": (
                        "Recommend step-by-step arithmetic writeups or a formula cheat-sheet the "
                        "student can reference while practicing, to cut down on calculation slips "
                        "that are otherwise costing them marks on concepts they already understand."
                    ),
                    "priority": "medium",
                })

        return {
            "student_id": student_id,
            "name": sdata.get("name"),
            "email": sdata.get("email"),
            "enrolled": sdata.get("enrolled", "Not Enrolled"),
            "joined_date": sdata.get("joined_date", "July 2026"),
            "tests_completed": tests_completed,
            "mastery": mastery_response,
            "chapters": chapters_response,
            "subjects": subjects_response,
            "exam_subjects": exam_subjects,
            "chapter_topics": chapter_topics,
            "speed": {
                "avg_time_sec": avg_speed_sec,
                "status": speed_status
            },
            "mistake_patterns": mistake_patterns,
            "recommendations": rec_list
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch student details: {e}")