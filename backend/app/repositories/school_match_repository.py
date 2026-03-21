"""Repository for university matches and program assessments."""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
import json

from app.config.settings import Settings
from app.core.postgres_client import PostgresClient
from app.models.school_match import UniversityMatchRecord, ProgramAssessmentRecord
from app.repositories.base_repository import BaseRepository


class SchoolMatchRepository(BaseRepository):
    def __init__(self, settings: Settings, postgres: PostgresClient) -> None:
        super().__init__(settings, postgres)

    async def save_university_match(
        self,
        school_file_id: UUID,
        university: str,
        catalog_source: str,
        programs: list[dict],
    ) -> UniversityMatchRecord:
        """Save a university match record."""
        record = UniversityMatchRecord(
            id=uuid4(),
            school_file_id=school_file_id,
            university=university,
            catalog_source=catalog_source,
            programs=programs,
            created_at=datetime.utcnow(),
        )
        query = """
        INSERT INTO university_matches (id, school_file_id, university, catalog_source, programs, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        """
        await self.pool.execute(
            query,
            record.id,
            record.school_file_id,
            record.university,
            record.catalog_source,
            json.dumps(record.programs),
            record.created_at,
        )
        return record

    async def get_university_matches_for_file(self, school_file_id: UUID) -> list[UniversityMatchRecord]:
        """Get all university matches for a school file."""
        query = """
        SELECT id, school_file_id, university, catalog_source, programs, created_at
        FROM university_matches
        WHERE school_file_id = $1
        ORDER BY created_at DESC
        """
        rows = await self.pool.fetch(query, school_file_id)
        return [
            UniversityMatchRecord(
                id=row["id"],
                school_file_id=row["school_file_id"],
                university=row["university"],
                catalog_source=row["catalog_source"],
                programs=json.loads(row["programs"]),
                created_at=row["created_at"],
            )
            for row in rows
        ]

    async def save_program_assessment(
        self,
        school_file_id: UUID,
        program_id: str,
        overall_assessment: str,
        gaps: list[dict],
        actions: list[dict],
        alternate_paths: list[str],
    ) -> ProgramAssessmentRecord:
        """Save a program assessment record."""
        record = ProgramAssessmentRecord(
            id=uuid4(),
            school_file_id=school_file_id,
            program_id=program_id,
            overall_assessment=overall_assessment,
            gaps=gaps,
            actions=actions,
            alternate_paths=alternate_paths,
            created_at=datetime.utcnow(),
        )
        query = """
        INSERT INTO program_assessments (id, school_file_id, program_id, overall_assessment, gaps, actions, alternate_paths, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """
        await self.pool.execute(
            query,
            record.id,
            record.school_file_id,
            record.program_id,
            record.overall_assessment,
            json.dumps(record.gaps),
            json.dumps(record.actions),
            json.dumps(record.alternate_paths),
            record.created_at,
        )
        return record

    async def get_program_assessments_for_file(self, school_file_id: UUID) -> list[ProgramAssessmentRecord]:
        """Get all program assessments for a school file."""
        query = """
        SELECT id, school_file_id, program_id, overall_assessment, gaps, actions, alternate_paths, created_at
        FROM program_assessments
        WHERE school_file_id = $1
        ORDER BY created_at DESC
        """
        rows = await self.pool.fetch(query, school_file_id)
        return [
            ProgramAssessmentRecord(
                id=row["id"],
                school_file_id=row["school_file_id"],
                program_id=row["program_id"],
                overall_assessment=row["overall_assessment"],
                gaps=json.loads(row["gaps"]),
                actions=json.loads(row["actions"]),
                alternate_paths=json.loads(row["alternate_paths"]),
                created_at=row["created_at"],
            )
            for row in rows
        ]

    async def get_program_assessment_by_program_id(
        self, school_file_id: UUID, program_id: str
    ) -> Optional[ProgramAssessmentRecord]:
        """Get a specific program assessment."""
        query = """
        SELECT id, school_file_id, program_id, overall_assessment, gaps, actions, alternate_paths, created_at
        FROM program_assessments
        WHERE school_file_id = $1 AND program_id = $2
        ORDER BY created_at DESC
        LIMIT 1
        """
        row = await self.pool.fetchrow(query, school_file_id, program_id)
        if row:
            return ProgramAssessmentRecord(
                id=row["id"],
                school_file_id=row["school_file_id"],
                program_id=row["program_id"],
                overall_assessment=row["overall_assessment"],
                gaps=json.loads(row["gaps"]),
                actions=json.loads(row["actions"]),
                alternate_paths=json.loads(row["alternate_paths"]),
                created_at=row["created_at"],
            )
        return None