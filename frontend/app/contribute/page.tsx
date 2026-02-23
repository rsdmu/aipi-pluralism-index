export default function ContributePage() {
  return (
    <main id="main" className="page">
      <section className="panel prose" aria-labelledby="contribute-h">
        <h1 id="contribute-h">Contribute</h1>
        <p>Help keep this index accurate with public, verifiable evidence.</p>
        <div className="overview-actions">
          <a href="#paths" className="overview-link-primary">Add evidence</a>
          <a href="https://github.com/rsdmu/aipi-pluralism-index" target="_blank" rel="noreferrer" className="overview-link-secondary">
            Open GitHub
            <span className="external-link-icon" aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section className="panel prose" aria-labelledby="fast-h">
        <h2 id="fast-h">How to contribute</h2>
        <ol>
          <li>Find a public source (policy, system card, audit, report, or release note).</li>
          <li>Open an issue with the matching template.</li>
          <li>Add the link and one line on what it proves.</li>
          <li>Optional: open a pull request.</li>
        </ol>
      </section>

      <section id="paths" className="overview-grid" aria-label="Contribution paths">
        <article className="panel">
          <h2>Evidence update</h2>
          <p className="meta">Add links to public artifacts for a provider.</p>
          <a
            className="overview-link-primary"
            href="https://github.com/rsdmu/aipi-pluralism-index/issues/new?template=01_evidence_update.yml"
            target="_blank"
            rel="noreferrer"
          >
            Submit evidence
            <span className="external-link-icon" aria-hidden="true">↗</span>
          </a>
        </article>
        <article className="panel">
          <h2>Coding correction</h2>
          <p className="meta">Report a wrong score and attach supporting sources.</p>
          <a
            className="overview-link-primary"
            href="https://github.com/rsdmu/aipi-pluralism-index/issues/new?template=02_coding_correction.yml"
            target="_blank"
            rel="noreferrer"
          >
            Propose correction
            <span className="external-link-icon" aria-hidden="true">↗</span>
          </a>
        </article>
        <article className="panel">
          <h2>Methodology proposal</h2>
          <p className="meta">Suggest improvements to indicators or scoring rules.</p>
          <a
            className="overview-link-primary"
            href="https://github.com/rsdmu/aipi-pluralism-index/issues/new?template=03_methodology_proposal.yml"
            target="_blank"
            rel="noreferrer"
          >
            Propose methodology change
            <span className="external-link-icon" aria-hidden="true">↗</span>
          </a>
        </article>
      </section>

      <section className="panel prose" aria-labelledby="quality-h">
        <h2 id="quality-h">Evidence checklist</h2>
        <ul>
          <li>Public and accessible (no paywall/login).</li>
          <li>Stable URL.</li>
          <li>Clear date or version.</li>
          <li>Clear scope (what provider/system it applies to).</li>
        </ul>
      </section>

      <section className="panel prose" aria-labelledby="norms-h">
        <h2 id="norms-h">Community and review</h2>
        <p>Be respectful and specific. Maintainers review updates in public.</p>
        <ul>
          <li>
            <a href="https://github.com/rsdmu/aipi-pluralism-index/blob/main/CODE_OF_CONDUCT.md" target="_blank" rel="noreferrer">
              Code of Conduct
              <span className="external-link-icon" aria-hidden="true">↗</span>
            </a>
          </li>
          <li>
            <a href="https://github.com/rsdmu/aipi-pluralism-index/blob/main/GOVERNANCE.md" target="_blank" rel="noreferrer">
              Governance process
              <span className="external-link-icon" aria-hidden="true">↗</span>
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
