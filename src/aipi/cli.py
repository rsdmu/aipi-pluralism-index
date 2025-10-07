
import argparse, json, os, sys
import pandas as pd
from .loader import load_datasets
from .scoring import build_all
from .validation import validate_schemas
from .schema import AIPIMeta
from pathlib import Path
import uuid, datetime as dt

def main():
    parser = argparse.ArgumentParser(description="AI Pluralism Index CLI")
    parser.add_argument("--root", default=".", help="Repo root (with /data)")
    parser.add_argument("cmd", choices=["build"], help="Command")
    args = parser.parse_args()
    root = args.root
    df_records, df_providers, df_codebook = load_datasets(root)
    validate_schemas(df_records, df_providers, df_codebook)
        res = build_all(df_records, df_providers, df_codebook)

    build_dir = Path(root) / "build"
    build_dir.mkdir(parents=True, exist_ok=True)

    res["systems_evidence"].to_csv(build_dir / "systems_ranking_evidence.csv", index=False)
    res["systems_known"].to_csv(build_dir / "systems_ranking_known_only.csv", index=False)
    res["providers_evidence"].to_csv(build_dir / "providers_ranking_evidence.csv", index=False)
    res["providers_known"].to_csv(build_dir / "providers_ranking_known_only.csv", index=False)
    res["detail"].to_csv(build_dir / "scores_by_indicator.csv", index=False)

    meta = {
        "generated_utc": dt.datetime.utcnow().isoformat() + "Z",
        "version": "0.1.0",
        "pillars": sorted(list(df_codebook["pillar"].unique())),
        "indicators": df_codebook.to_dict(orient="records"),
        "weighting": {
            "pillars": {p: 0.25 for p in sorted(list(df_codebook["pillar"].unique()))},
            "indicator_normalization": "Yes=1, No=0; 0|1|2 -> 0.0,0.5,1.0; counts log2(1+n)/log2(51); Unknown treated as 0 for 'evidence' score, ignored for 'known-only'.",
        },
        "dataset_hash": str(uuid.uuid4()),
    }

    with open(build_dir / "meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    res["providers_evidence"].to_json(build_dir / "providers.json", orient="records", force_ascii=False, indent=2)
    res["systems_evidence"].to_json(build_dir / "systems.json", orient="records", force_ascii=False, indent=2)
    print("Build complete -> ./build")

if __name__ == "__main__":
    main()
