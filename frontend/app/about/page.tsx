export default function AboutPage() {
  return (
    <main id="main" className="page">
      <section className="panel prose" aria-labelledby="about-h">
        <h1 id="about-h">About</h1>
        <p>AIPI measures whether stakeholders can shape how AI systems are governed and deployed.</p>
      </section>

      <section className="panel prose" aria-labelledby="pillars-h">
        <h2 id="pillars-h">Four pillars</h2>
        <ul>
          <li><strong>Participatory governance:</strong> Stakeholders can influence important decisions.</li>
          <li><strong>Inclusivity & diversity:</strong> Different communities and contexts are represented.</li>
          <li><strong>Transparency:</strong> Public documentation and evidence are available.</li>
          <li><strong>Accountability:</strong> Providers can be challenged and corrected.</li>
        </ul>
      </section>

      <section className="panel prose" aria-labelledby="read-h">
        <h2 id="read-h">How to read scores</h2>
        <ol>
          <li><strong>AIPI:</strong> Overall score from 0 to 1.</li>
          <li><strong>Pillar score:</strong> Score for one pillar.</li>
          <li><strong>Coverage:</strong> Share of indicators with public evidence.</li>
          <li><strong>Evidence vs known-only:</strong> Conservative view vs sensitivity view.</li>
        </ol>
        <p>AIPI is not a capability benchmark.</p>
        <p>
          <a href="https://arxiv.org/abs/2510.08193v3" target="_blank" rel="noreferrer">
            Paper
            <span className="external-link-icon" aria-hidden="true">↗</span>
          </a>
        </p>
      </section>

      <section className="panel prose" aria-labelledby="trust-h">
        <h2 id="trust-h">Governance and licenses</h2>
        <p>Evidence updates are reviewed in public and decisions are documented.</p>
        <p>Code MIT; Data CC BY 4.0.</p>
        <p>
          <a href="https://github.com/rsdmu/aipi-pluralism-index/blob/main/GOVERNANCE.md" target="_blank" rel="noreferrer">
            Governance
            <span className="external-link-icon" aria-hidden="true">↗</span>
          </a>{' '}
          ·{' '}
          <a href="https://github.com/rsdmu/aipi-pluralism-index" target="_blank" rel="noreferrer">
            Repo
            <span className="external-link-icon" aria-hidden="true">↗</span>
          </a>
        </p>
      </section>

      <section className="panel prose" aria-labelledby="r2ai-h">
        <h2 id="r2ai-h">Relationship to The Right to AI</h2>
        <p>AIPI aligns with The Right to AI on participation, transparency, and accountable deployment.</p>
        <p>
          <a href="https://www.therighttoai.com/" target="_blank" rel="noreferrer" className="overview-link-primary">
            Visit The Right to AI
            <span className="external-link-icon" aria-hidden="true">↗</span>
          </a>
        </p>
      </section>

      <section id="glossary" className="panel prose" aria-labelledby="glossary-h">
        <h2 id="glossary-h">Glossary</h2>
        <p><strong>AIPI:</strong> Overall pluralism score for a provider.</p>
        <p><strong>Pillar score:</strong> Score for one pillar.</p>
        <p><strong>Coverage:</strong> Share of indicators backed by public evidence.</p>
        <p><strong>Evidence vs known-only:</strong> Two treatments of unknown values.</p>
      </section>
    </main>
  );
}
