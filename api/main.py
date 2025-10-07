
import os, json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import orjson

app = FastAPI(title="AI Pluralism Index API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _read_json(path):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Not found")
    with open(path, "rb") as f:
        return orjson.loads(f.read())

@app.get("/v1/health")
async def health():
    return {"ok": True}

@app.get("/v1/meta")
async def meta():
    return _read_json(os.path.join(os.path.dirname(__file__), "..", "build", "meta.json"))

@app.get("/v1/providers")
async def providers():
    return _read_json(os.path.join(os.path.dirname(__file__), "..", "build", "providers.json"))

@app.get("/v1/systems")
async def systems():
    return _read_json(os.path.join(os.path.dirname(__file__), "..", "build", "systems.json"))

@app.get("/v1/detail")
async def detail():
    # Return limited preview to keep payload small
    path = os.path.join(os.path.dirname(__file__), "..", "build", "scores_by_indicator.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Not found")
    # Stream as JSON lines: keep it simple for now
    import pandas as pd
    df = pd.read_csv(path)
    # truncate long strings
    df["evidence_excerpt"] = df["evidence_excerpt"].astype(str).str.slice(0, 400)
    return JSONResponse(df.to_dict(orient="records"))
