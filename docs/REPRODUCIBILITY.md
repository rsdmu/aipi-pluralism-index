
# Reproducibility

- Lock Python and Node versions in CI
- Pin dependencies (see `pyproject.toml` and `package.json`)
- CI rebuilds `build/` from `data/` and uploads artifacts
- Hash of dataset is included in `build/meta.json`
