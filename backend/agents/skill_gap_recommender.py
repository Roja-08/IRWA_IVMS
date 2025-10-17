from typing import Dict, Any, List


class SkillGapRecommenderAgent:
    """
    An agent that analyzes a volunteer profile against available jobs and
    recommends skill gaps to improve match potential.

    Heuristic approach:
    - Collect all required skills across jobs
    - Compute which of those the volunteer does NOT have
    - Rank by frequency across jobs (descending)
    - Return top-N gaps with a lightweight suggestion stub
    """

    def __init__(self, top_n: int = 10) -> None:
        self.top_n = top_n

    def _normalize(self, name: str) -> str:
        return (name or "").strip().lower()

    def recommend(self, profile: Dict[str, Any], jobs: List[Dict[str, Any]]) -> Dict[str, Any]:
        try:
            user_skills = {self._normalize(s.get("name") if isinstance(s, dict) else str(s)) for s in (profile.get("skills") or [])}
            # Pydantic Skill objects may already be dict-like; ensure strings are extracted robustly
            user_skills = {self._normalize(s.get("name")) for s in profile.get("skills", []) if isinstance(s, dict) and s.get("name")}

            required_skill_counts: Dict[str, int] = {}
            for job in jobs or []:
                for skill in job.get("skills_required") or []:
                    skill_norm = self._normalize(skill)
                    if not skill_norm:
                        continue
                    required_skill_counts[skill_norm] = required_skill_counts.get(skill_norm, 0) + 1

            # Compute gaps
            gaps: List[Dict[str, Any]] = []
            for skill, count in required_skill_counts.items():
                if skill not in user_skills:
                    gaps.append({
                        "skill": skill,
                        "demand": count,
                        "suggestion": f"Improve '{skill}' via a short course or practice project"
                    })

            # Sort by demand desc then alphabetically
            gaps.sort(key=lambda g: (-g["demand"], g["skill"]))

            return {
                "success": True,
                "profile_id": str(profile.get("_id", "")),
                "total_jobs_analyzed": len(jobs or []),
                "total_unique_required_skills": len(required_skill_counts),
                "top_gaps": gaps[: self.top_n],
            }
        except Exception as exc:
            return {"success": False, "message": str(exc)}


