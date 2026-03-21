"""Synchronous job search (one TinyFish run → one listing) and latest fetch."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_job_discovery_repository, get_job_search_service
from app.models.job import JobSearchRequest, JobSearchResponse, LatestJobResponse
from app.repositories.job_discovery_repository import JobDiscoveryRepository
from app.services.job_search_service import JobSearchService

router = APIRouter()


@router.post("/search", response_model=JobSearchResponse)
async def post_job_search(
    body: JobSearchRequest,
    svc: JobSearchService = Depends(get_job_search_service),
):
    """Run TinyFish once, persist one job listing, return it with run metadata."""
    return await svc.run_search(body.job_file_id)


@router.get("/latest", response_model=LatestJobResponse)
async def get_latest_job(
    job_file_id: UUID = Query(..., description="Job upload id from POST /api/v1/job/files/upload"),
    repo: JobDiscoveryRepository = Depends(get_job_discovery_repository),
):
    pair = await repo.get_latest_listing_for_file(job_file_id)
    if not pair:
        return LatestJobResponse(job=None, run=None)
    job, run = pair
    return LatestJobResponse(job=job, run=run)
