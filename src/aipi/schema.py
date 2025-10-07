
from typing import Optional, List, Dict
from pydantic import BaseModel, Field

SCHEMA_VERSION = "0.1.0"

class IndicatorDetail(BaseModel):
    provider_id: str
    provider_name: str
    system_family: str
    indicator_id: str
    indicator_name: str
    pillar: str
    subpillar: Optional[str] = None
    indicator_value: str
    norm_known: Optional[float] = None
    norm_evidence: Optional[float] = None
    evidence_url: Optional[str] = None
    evidence_excerpt: Optional[str] = None

class SystemScore(BaseModel):
    provider_id: str
    provider_name: str
    system_family: str
    AIPI: float = Field(..., ge=0.0, le=1.0)
    pillars: Dict[str, float]
    coverage: float = Field(..., ge=0.0, le=1.0)
    rank: Optional[int] = None

class Provider(BaseModel):
    provider_id: str
    provider_name: str
    AIPI: float = Field(..., ge=0.0, le=1.0)
    pillars: Dict[str, float]
    coverage: float = Field(..., ge=0.0, le=1.0)
    rank: Optional[int] = None

class AIPIMeta(BaseModel):
    generated_utc: str
    version: str
    pillars: List[str]
    indicators: List[Dict]
    weighting: Dict
    dataset_hash: str
