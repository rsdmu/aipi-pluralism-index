
import pandas as pd
from pathlib import Path

def load_datasets(root: str):
    rootp = Path(root)
    df_records = pd.read_csv(rootp / "data" / "ai_records.csv")
    df_providers = pd.read_csv(rootp / "data" / "ai_providers_and_families.csv")
    df_codebook = pd.read_csv(rootp / "data" / "ai_codebook.csv")
    return df_records, df_providers, df_codebook
