
# Contributing

We welcome pull requests that (a) add verifiable evidence links, (b) correct indicator codings (with sources),
(c) propose new indicators or weight updates, or (d) improve docs and tooling.

## How to contribute data corrections

1. Open an issue using the **Evidence Update** or **Coding Correction** template.
2. Provide links and short excerpts in your PR that modify **only the `ai_records.csv` file**. Do not change any other raw files.
3. Run `python -m aipi.cli build` locally to regenerate `build/` and ensure tests pass.
4. Submit the PR. Our CI validates schema and reruns the pipeline; if scores change, a diff summary will be posted.

## Propose methodology changes

- Open a **Methodology Proposal** issue. Discuss effects on fairness, incentives, and reproducibility.
- If agreed, submit a PR that updates code under `src/aipi/` and docs under `docs/`. The raw data remains immutable.

## Code style

- Python: Black + Ruff, type hints, PyTest
- Frontend: TypeScript, Next.js, ESLint

## Community norms

See `CODE_OF_CONDUCT.md` and `GOVERNANCE.md`.
