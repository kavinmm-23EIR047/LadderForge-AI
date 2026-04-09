from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import generate, project, update
from app.auth.auth_routes import router as auth_router
from app.routes.admin import router as admin_router

# ✅ ADD THIS IMPORT (IMPORTANT)
from app.routes.ai import router as ai_explainer_router  # ✅ FIXED

app = FastAPI(
    title="LadderAI Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ladder-forge-ai.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ ROUTES
app.include_router(generate.router, tags=["Generate"])
app.include_router(project.router, tags=["Projects"])
app.include_router(update.router, tags=["Update"])
app.include_router(auth_router, tags=["Auth"])
app.include_router(admin_router, tags=["Admin"])

# ✅ ADD THIS LINE (THIS FIXES YOUR ERROR)


app.include_router(ai_explainer_router, tags=["AI Explainer"])


@app.get("/", tags=["Home"])
def home():
    return {"message": "Backend Running 🚀"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}