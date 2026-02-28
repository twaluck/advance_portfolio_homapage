"""
Pydantic schemas for request/response validation.
"""

from typing import List, Optional

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Email address or phone number")
    password: str = Field(..., description="Admin password")


class RegisterRequest(BaseModel):
    name: str = Field(..., description="Full name")
    contact: str = Field(..., description="Email address or phone number")
    password: str = Field(..., description="Account password")


class LogCreate(BaseModel):
    title: str = Field(..., description="Log title")
    summary: str = Field(..., description="Short summary for list views")
    content: Optional[str] = Field(None, description="Full log content")
    tags: Optional[List[str]] = Field(None, description="Tags for filtering")
    log_date: Optional[str] = Field(None, description="YYYY-MM-DD date string")


class LogUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Log title")
    summary: Optional[str] = Field(None, description="Short summary for list views")
    content: Optional[str] = Field(None, description="Full log content")
    tags: Optional[List[str]] = Field(None, description="Tags for filtering")
    log_date: Optional[str] = Field(None, description="YYYY-MM-DD date string")


class CourseCreate(BaseModel):
    year_level: int = Field(..., description="Year level (1-4)")
    term: str = Field(..., description="Term label (e.g. 前期/後期)")
    course_name: str = Field(..., description="Course name")
    learned_notes: Optional[str] = Field(None, description="Notes on what was learned")
    outcome_notes: Optional[str] = Field(None, description="Outcomes or deliverables")
    next_notes: Optional[str] = Field(None, description="Next steps or applications")


class CourseUpdate(BaseModel):
    year_level: Optional[int] = Field(None, description="Year level (1-4)")
    term: Optional[str] = Field(None, description="Term label (e.g. 前期/後期)")
    course_name: Optional[str] = Field(None, description="Course name")
    learned_notes: Optional[str] = Field(None, description="Notes on what was learned")
    outcome_notes: Optional[str] = Field(None, description="Outcomes or deliverables")
    next_notes: Optional[str] = Field(None, description="Next steps or applications")
    visibility: Optional[str] = Field(None, description="Visibility: public/private")
    status: Optional[str] = Field(None, description="Status: draft/published")


class ProjectCreate(BaseModel):
    title: str = Field(..., description="Project title")
    summary: Optional[str] = Field(None, description="Short summary")
    details: Optional[str] = Field(None, description="Detailed description")
    repo_url: Optional[str] = Field(None, description="GitHub repository URL")
    demo_url: Optional[str] = Field(None, description="Live demo URL")
    image_url: Optional[str] = Field(None, description="Project image URL")
    status: Optional[str] = Field("draft", description="Status: draft/completed/ongoing")


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Project title")
    summary: Optional[str] = Field(None, description="Short summary")
    details: Optional[str] = Field(None, description="Detailed description")
    repo_url: Optional[str] = Field(None, description="GitHub repository URL")
    demo_url: Optional[str] = Field(None, description="Live demo URL")
    image_url: Optional[str] = Field(None, description="Project image URL")
    status: Optional[str] = Field(None, description="Status: draft/completed/ongoing")


class ProfileUpdate(BaseModel):
    headline: Optional[str] = Field(None, description="Short headline")
    summary: Optional[str] = Field(None, description="Profile summary")
    nationality: Optional[str] = Field(None, description="Nationality")
    prefecture: Optional[str] = Field(None, description="Prefecture")
    city: Optional[str] = Field(None, description="City")
    school_type: Optional[str] = Field(None, description="School type")
    school_name: Optional[str] = Field(None, description="School name")
