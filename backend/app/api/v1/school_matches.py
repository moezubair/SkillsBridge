"""School major matching (Harvard MVP)."""

from fastapi import APIRouter, Depends

from app.dependencies import get_school_match_service
from app.models.school_match import UniversityMatchRequest, UniversityMatchResponse, UniversityAssessmentResponse
from app.services.school_match_service import SchoolMatchService

router = APIRouter()


@router.post("/", response_model=UniversityMatchResponse)
async def post_university_program_match(
    body: UniversityMatchRequest,
    svc: SchoolMatchService = Depends(get_school_match_service),
):
    """
    Gather program requirements for all universities in universities.json.
    """
    return await svc.match_universities(
        school_file_id=body.school_file_id,
        ielts_id=body.ielts_id,
    )


@router.post("/assess", response_model=UniversityAssessmentResponse)
async def post_university_program_assessment(
    body: UniversityMatchRequest,
    svc: SchoolMatchService = Depends(get_school_match_service),
):
    """
    Assess program fit using OpenAI based on stored requirements.
    """
    return await svc.assess_universities(
        school_file_id=body.school_file_id,
        ielts_id=body.ielts_id,
        refresh=body.refresh,
    )
