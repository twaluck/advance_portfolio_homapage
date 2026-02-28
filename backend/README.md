# Backend

## Project overview
This backend provides a FastAPI service for a personal portfolio and learning log platform. It is designed to start with a single admin user and scale to multiple users later, with a clean structure that supports long-term research and startup evolution.

## Tech stack
- Python
- FastAPI
- SQLite

## Database tables
- users: account identity and roles (admin to start)
- learning_logs: daily/weekly research notes and reflections
- goals: short-term and long-term objectives
- projects: portfolio and research project entries
- messages: contact form submissions and outreach

## Current status
- DB schema and seed script (admin + sample logs)
- Admin user only, token-based login in place
- Learning logs CRUD endpoints wired for the frontend

## TODO (next steps)
- Implement CRUD endpoints for goals, projects, messages, and users
- Expand Pydantic schemas and responses for the full API
- Add authentication hardening (token expiry, logout, password reset)
- Add multi-user support and permissions
- Improve validation, filtering, and pagination
