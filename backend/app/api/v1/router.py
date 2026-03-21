from fastapi import APIRouter

from app.api.v1 import files, health, job_preferences, jobs, school_matches, student_extras

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(job_preferences.router, prefix="/job-preferences", tags=["job-preferences"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(student_extras.router, prefix="/student-extras", tags=["student-extras"])
api_router.include_router(school_matches.router, prefix="/school-matches", tags=["school-matches"])
