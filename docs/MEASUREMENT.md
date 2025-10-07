
# Measurement Model (AIPI v0.1.0)

**Pillars**: Participatory governance, Inclusivity & diversity, Transparency, Accountability.

**Indicators**: See `data/ai_codebook.csv`. Each row includes operationalization, allowed values, and evidence requirements.

## Normalization

- `Yes|No|Unknown` → {1, 0, NaN}
- `0|1|2|Unknown` → {0.0, 0.5, 1.0}
- `0..inf|Unknown` → `log2(1+n) / log2(51)`

## Aggregation

- **System pillar**: mean of normalized indicators in that pillar for the system.
- **System AIPI**: mean of pillar scores (equal weights).
- **Provider AIPI**: mean of its systems' AIPI (equal weights).

### Evidence vs Known-only

- **Evidence (default)**: Unknown counts as 0 to reflect missing public evidence.
- **Known-only**: Drop Unknown (for sensitivity). Both are computed.

## Coverage

We report `coverage` = share of indicators with known values per system to contextualize scores.

## Reproducibility

- Deterministic pipeline (`python -m aipi.cli build`)
- Versioned datasets and methodological changes
