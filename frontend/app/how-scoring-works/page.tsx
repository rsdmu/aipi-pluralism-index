import Link from 'next/link';

export default function HowScoringWorksPage() {
  return (
    <main id="main" className="page">
      <section className="panel prose" aria-labelledby="how-scoring-h">
        <h1 id="how-scoring-h">How scoring works</h1>
        <p>We only score what can be verified with public evidence.</p>
        <ol>
          <li>Each indicator is coded as <strong>Yes</strong>, <strong>Partial</strong>, <strong>No</strong>, or <strong>Unknown</strong> from public sources.</li>
          <li>Indicators are grouped into four pillars: Participatory governance, Inclusivity & diversity, Transparency, and Accountability.</li>
          <li>Each pillar receives a score from 0 to 1.</li>
          <li><strong>AIPI</strong> is the average of the four pillar scores.</li>
          <li><strong>Coverage</strong> is the share of indicators with public evidence.</li>
        </ol>
        <p>Evidence mode treats Unknown as 0 (conservative lower bound). Known-only mode excludes Unknown values (sensitivity view).</p>
        <p>
          If you find better evidence, <Link href="/contribute">contribute an update</Link>. For full details, see the{' '}
          <a href="https://arxiv.org/abs/2510.08193v3" target="_blank" rel="noreferrer">
            paper
            <span className="external-link-icon" aria-hidden="true">↗</span>
          </a>.
        </p>
      </section>
    </main>
  );
}
