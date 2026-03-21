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
    Rank Harvard majors: one TinyFish run on HARVARD_CATALOG_URL with a goal built from the
    latest transcript extraction; optional ielts_id loads IELTS/skills from student_extras and
    can imply school_file_id when omitted. Falls back to a local heuristic if TinyFish fails.
    """
    return await svc.match_harvard(
        body.school_file_id,
        ielts_id=body.ielts_id,
    )
