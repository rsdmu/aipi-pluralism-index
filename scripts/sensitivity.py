
import pandas as pd
from src.aipi.scoring import build_all
from src.aipi.loader import load_datasets
from scipy.stats import spearmanr

def main():
    df_records, df_providers, df_codebook = load_datasets(".")
    res = build_all(df_records, df_providers, df_codebook)
    pe = res["providers_evidence"][["provider_id","AIPI"]].rename(columns={"AIPI":"evidence"})
    pk = res["providers_known"][["provider_id","AIPI"]].rename(columns={"AIPI":"known"})
    merged = pe.merge(pk, on="provider_id", how="inner")
    rho, p = spearmanr(merged["evidence"], merged["known"])
    print(f"Spearman rho between evidence and known-only AIPI: {rho:.3f} (p={p:.3g})")
    # Ablation per pillar
    # (implement by recomputing with pillars dropped)
if __name__ == "__main__":
    main()
