# My Personal HMPG Project

This project has been revised to be more manageable and secure.

## Structure

- **backend/**: FastAPI application (Python).
- **frontend/**: Vanilla JS application with Vite for development.
- **_archive/**: Legacy code (`mega_project01`).

## Setup

### Backend

1.  Navigate to `backend/`:
    ```bash
    cd backend
    ```
2.  Create a virtual environment (optional but recommended):
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the server:
    ```bash
    uvicorn app:app --reload
    ```
    The API will be available at `http://127.0.0.1:8000`.

### Frontend

1.  Navigate to `frontend/`:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
    (Note: This requires Node.js installed)

3.  Run the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or similar).
    API requests to `/api` are automatically proxied to the backend.

### Host on your local network

Use this when you want to open the site from other devices while this PC is on.
The other devices must be on the same Wi-Fi or local network.

1.  Start the backend in one terminal:
    ```bash
    cd backend
    uvicorn app:app --reload
    ```
2.  Start the frontend for LAN access in another terminal:
    ```bash
    cd frontend
    npm run host
    ```
3.  Find this PC's local IP address:
    ```bash
    ipconfig getifaddr en0
    ```
    If that prints nothing, check your Wi-Fi/network settings for an address like
    `192.168.x.x` or `10.x.x.x`.
4.  On another device, open:
    ```text
    http://YOUR_LOCAL_IP:5173
    ```

For example, if this PC's local IP is `192.168.1.25`, open
`http://192.168.1.25:5173`.

### Assistant (Jarvis)

1.  Navigate to `backend/assistant/`:
    ```bash
    cd backend/assistant
    ```
2.  Run the assistant:
    ```bash
    python main.py
    ```
    *Note: requires a working microphone and speakers.*

## Deployment

- **Backend**: Can be deployed to Render, Railway, etc. using `requirements.txt`.
- **Frontend**: Run `npm run build` to generate static files in `dist/`.
- **Assistant**: Intended for local use only (desktop).
