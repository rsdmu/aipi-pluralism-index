
import pandas as pd
from src.aipi.scoring import compute_scores, build_all

def test_normalization_and_build():
    # minimal fake
    records = pd.DataFrame([
        {"provider_id":"p","provider_name":"P","system_family":"S","indicator_id":"GOV1","indicator_value":"Yes"},
        {"provider_id":"p","provider_name":"P","system_family":"S","indicator_id":"TRA2","indicator_value":"No"},
        {"provider_id":"p","provider_name":"P","system_family":"S","indicator_id":"ACC1","indicator_value":"Unknown"},
    ])
    codebook = pd.DataFrame([
        {"indicator_id":"GOV1","pillar":"Participatory governance","subpillar":"","indicator_name":"Stakeholder advisory mechanism","allowed_values":"Yes|No|Unknown"},
        {"indicator_id":"TRA2","pillar":"Transparency","subpillar":"","indicator_name":"Training data summary","allowed_values":"Yes|No|Unknown"},
        {"indicator_id":"ACC1","pillar":"Accountability","subpillar":"","indicator_name":"Bug bounty / VDP","allowed_values":"Yes|No|Unknown"},
    ])
    providers = pd.DataFrame([{"provider_id":"p","provider_name":"P","system_family":"S"}])
    df = compute_scores(records, codebook)
    assert df["norm_known"].notna().sum() == 2
    res = build_all(records, providers, codebook)
    pe = res["providers_evidence"].iloc[0]
    # Evidence score: GOV1=1, TRA2=0, ACC1=0 (unknown), 3 pillars => AIPI approx 1/3
    assert round(pe["AIPI"], 3) == round((1+0+0+0)/4, 3) or round(pe["AIPI"],3)==0.25
