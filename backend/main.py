from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .seed import init_db
from .routes.public import router as public_router
from .routes.admin import router as admin_router
from .routes.auth_routes import router as auth_router

app = FastAPI(
    title="Daily Drop Commercial Kitchen Rental API",
    description="Dedicated hourly commercial kitchen rental platform for restaurants, cloud kitchens, caterers, and food creators.",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(public_router)
app.include_router(admin_router)
app.include_router(auth_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Daily Drop Commercial Kitchen Rental API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
