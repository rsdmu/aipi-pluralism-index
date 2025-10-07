
from __future__ import annotations
import re
from typing import Dict, Tuple, List
import numpy as np
import pandas as pd
from .schema import SCHEMA_VERSION

def parse_allowed_values(av: str):
    av = str(av)
    if "Yes|No|Unknown" in av:
        return {"Yes": 1.0, "No": 0.0, "Unknown": np.nan}
    if re.fullmatch(r"\s*0\|1\|2\|Unknown\s*", av):
        return {"0": 0.0, "1": 0.5, "2": 1.0, "Unknown": np.nan}
    if "0..inf" in av:
        return "count"
    return None

def normalize_value(indicator_id: str, raw_value, allowed_values: str):
    raw = str(raw_value)
    mapping = parse_allowed_values(allowed_values)
    if mapping == "count":
        try:
            num = float(raw_value)
        except:
            return np.nan
        T = 50.0
        norm = np.log2(1.0 + num) / np.log2(1.0 + T)
        return max(0.0, min(1.0, norm))
    if isinstance(mapping, dict):
        return mapping.get(raw, np.nan)
    try:
        val = float(raw_value)
        if 0.0 <= val <= 1.0:
            return val
    except:
        pass
    return np.nan

def compute_scores(df_records: pd.DataFrame, df_codebook: pd.DataFrame):
    codebook = df_codebook.set_index("indicator_id").to_dict(orient="index")
    def _norm(row):
        return normalize_value(row["indicator_id"], row["indicator_value"], codebook.get(row["indicator_id"], {}).get("allowed_values", ""))
    df = df_records.copy()
    df["norm_known"] = df.apply(_norm, axis=1)
    df["norm_evidence"] = df["norm_known"].fillna(0.0)
    df = df.merge(df_codebook[["indicator_id","pillar","subpillar","indicator_name"]], on="indicator_id", how="left")
    return df

def _aggregate(df: pd.DataFrame, use: str):
    cols = ["provider_id","provider_name","system_family","pillar","indicator_id",use]
    d = df[cols].copy()
    pillar_scores = d.groupby(["provider_id","provider_name","system_family","pillar"])[use].mean().reset_index().rename(columns={use:"pillar_score"})
    pivot = pillar_scores.pivot_table(index=["provider_id","provider_name","system_family"], columns="pillar", values="pillar_score").reset_index()
    pillar_cols = [c for c in pivot.columns if c not in ["provider_id","provider_name","system_family"]]
    if use == "norm_evidence":
        pivot["AIPI"] = pivot[pillar_cols].fillna(0.0).mean(axis=1)
    else:
        pivot["AIPI"] = pivot[pillar_cols].mean(axis=1, skipna=True)
    coverage = df.assign(is_known=~df["norm_known"].isna()).groupby(["provider_id","provider_name","system_family"])["is_known"].mean().reset_index().rename(columns={"is_known":"coverage"})
    out = pivot.merge(coverage, on=["provider_id","provider_name","system_family"], how="left")
    out = out.sort_values("AIPI", ascending=False).reset_index(drop=True)
    out["rank"] = np.arange(1, len(out)+1)
    return out, pillar_cols

def build_all(df_records: pd.DataFrame, df_providers: pd.DataFrame, df_codebook: pd.DataFrame):
    df = compute_scores(df_records, df_codebook)
    systems_evidence, pillar_cols = _aggregate(df, use="norm_evidence")
    systems_known, _ = _aggregate(df, use="norm_known")

    def agg_provider(s):
        cols = ["provider_id","provider_name"] + [c for c in s.columns if c in pillar_cols] + ["AIPI","coverage"]
        agg = s[cols].groupby(["provider_id","provider_name"]).mean().reset_index()
        agg = agg.sort_values("AIPI", ascending=False).reset_index(drop=True)
        agg["rank"] = np.arange(1, len(agg)+1)
        return agg

    providers_evidence = agg_provider(systems_evidence)
    providers_known = agg_provider(systems_known)

    return {
        "systems_evidence": systems_evidence,
        "systems_known": systems_known,
        "providers_evidence": providers_evidence,
        "providers_known": providers_known,
        "detail": df,
        "pillar_cols": pillar_cols,
    }
