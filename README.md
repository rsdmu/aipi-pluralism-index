
# AI Pluralism Index (AIPI)

Evidence-based index of **AI pluralism** across AI providers and system families, covering four pillars:
**Participatory governance**, **Inclusivity & diversity**, **Transparency**, and **Accountability**.

> [!WARNING]
> **Coverage matters.** Current data shows the strongest signal for **Transparency** (e.g., model/system cards, release notes, open weights) and **GOV3** (“Issue tracker for user feedback”). Many **Inclusivity & Diversity** indicators are presently **Unknown**; under the **evidence** rule, `Unknown` counts as 0, lowering pillar scores when public evidence is missing. For sensitivity analysis, AIPI publishes both **evidence** and **known‑only** score variants. See [Ranking methodology](#ranking-methodology-v010) for details.

This repository contains:
- Raw datasets (immutable in `data/`)
- Reproducible scoring pipeline (`src/aipi/` + CLI)
- A small **FastAPI** backend exposing JSON endpoints (`api/`)
- A **Next.js** frontend (`frontend/`) with sortable tables and provider profiles
- CI configuration and contribution workflow (see `CONTRIBUTING.md`)

## Quickstart

```bash
# 1) Create a virtualenv and install deps
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2) Build index from the raw datasets
python -m aipi.cli build

# 3) Run the API locally
uvicorn api.main:app --reload --port 8000

# 4) Run the frontend
cd frontend
npm install
npm run dev
```

The frontend expects JSON under `/data/`. During development, we copy current `build/` outputs into `frontend/public/data`.
In production, point `NEXT_PUBLIC_AIPI_DATA_URL` and `NEXT_PUBLIC_AIPI_META_URL` to the API or a CDN with the JSON files.

## Ranking methodology (v0.1.0)

- Each indicator is normalized to [0,1]. For categorical items: **Yes=1, No=0**; for 0|1|2 scales: **0→0.0, 1→0.5, 2→1.0**; for counts (e.g., number of UI languages), we use a bounded log scale: `log2(1+n) / log2(51)` (saturates at 50).
- **Evidence score (default)**: `Unknown` counts as 0 (lack of verifiable evidence reduces the score).
- **Known-only score (sensitivity)**: `Unknown` is ignored in means. Both are produced in `build/`.
- Pillar scores are equal-weighted averages of their indicators. Overall **AIPI** is an equal-weighted mean of the four pillars.
- Provider AIPI averages systems within the same provider (equal weights). In this dataset there is one or multiple systems per provider.

See `docs/MEASUREMENT.md` and `docs/REPRODUCIBILITY.md` for details.

## Licenses

- **Code**: MIT (see `LICENSE-MIT`)
- **Data**: CC BY 4.0 (see `LICENSE-CC-BY-4.0`)

## Citation

```bash
@misc{mushkani2025aipi,
      title={Measuring What Matters: The AI Pluralism Index}, 
      author={Rashid Mushkani},
      year={2025},
      url={https://arxiv.org/abs/2509.14574}, 
}
```
See `paper/aipi.tex` for the paper front matter.


