"""School major matching (Harvard MVP)."""

from fastapi import APIRouter, Depends

from app.dependencies import get_school_match_service
from app.models.school_match import HarvardMatchRequest, HarvardMatchResponse
from app.services.school_match_service import SchoolMatchService

router = APIRouter()


@router.post("/harvard", response_model=HarvardMatchResponse)
async def post_harvard_major_match(
    body: HarvardMatchRequest,
    svc: SchoolMatchService = Depends(get_school_match_service),
):
    """
    Rank Harvard majors using latest transcript extraction, saved student_extras,
    and optional body overrides for IELTS/skills. Refreshes catalog via TinyFish when cache expires.
    """
    return await svc.match_harvard(
        body.file_id,
        ielts_override=body.ielts,
        skills_override=body.skills,
    )
