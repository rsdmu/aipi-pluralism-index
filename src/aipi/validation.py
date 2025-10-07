
from __future__ import annotations
import pandas as pd

REQUIRED_RECORDS_COLS = [
    "provider_id","provider_name","system_family",
    "indicator_id","indicator_value","evidence_url","evidence_excerpt",
    "coder_email_or_id","date_coded_utc","last_reviewed_utc"
]

REQUIRED_PROVIDERS_COLS = [
    "provider_id","provider_name","entity_type","hq_country",
    "provider_website","system_family","license_or_terms",
    "open_weights","model_family_source_url","notes","last_verified_utc"
]

REQUIRED_CODEBOOK_COLS = [
    "indicator_id","pillar","subpillar","indicator_name",
    "definition","operationalization","allowed_values","evidence_required",
    "coding_instructions","version","last_updated_utc"
]

def validate_schemas(df_records: pd.DataFrame, df_providers: pd.DataFrame, df_codebook: pd.DataFrame):
    for cols, df, name in [
        (REQUIRED_RECORDS_COLS, df_records, "ai_records.csv"),
        (REQUIRED_PROVIDERS_COLS, df_providers, "ai_providers_and_families.csv"),
        (REQUIRED_CODEBOOK_COLS, df_codebook, "ai_codebook.csv"),
    ]:
        missing = [c for c in cols if c not in df.columns]
        if missing:
            raise ValueError(f"Missing columns in {name}: {missing}")
    # Simple referential integrity: every provider in records exists in providers table
    rec_pids = set(df_records["provider_id"].unique())
    prv_pids = set(df_providers["provider_id"].unique())
    missing_providers = rec_pids - prv_pids
    if missing_providers:
        raise ValueError(f"Providers referenced in records missing in providers table: {sorted(missing_providers)}")
    return True
