'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Provider = {
  provider_id: string;
  provider_name: string;
  AIPI: number;
  coverage: number;
  [k: string]: string | number;
};

type SortKey = 'aipi' | 'coverage' | 'name';

const PILLAR_ORDER = [
  'Participatory governance',
  'Inclusivity & diversity',
  'Transparency',
  'Accountability',
];

function normalizePillarName(pillar: string): string {
  const p = pillar.trim().toLowerCase();
  if (p === 'inclusivity and diversity' || p === 'inclusivity & diversity') return 'Inclusivity & diversity';
  if (p === 'participatory governance') return 'Participatory governance';
  if (p === 'accountability') return 'Accountability';
  if (p === 'transparency') return 'Transparency';
  return pillar;
}

function getPillarValue(row: Provider, pillar: string): number {
  const normalized = normalizePillarName(pillar);
  const keys = Object.keys(row);
  for (const key of keys) {
    if (normalizePillarName(key) === normalized) return Number(row[key] ?? 0);
  }
  return 0;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function toNumber(v: string | undefined): number | undefined {
  if (v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function deriveRowsFromScores(csv: string): Provider[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  const header = parseCsvLine(lines[0]);
  const idx = (name: string) => header.indexOf(name);
  const providerIdIdx = idx('provider_id');
  const providerNameIdx = idx('provider_name');
  const pillarIdx = idx('pillar');
  const normKnownIdx = idx('norm_known');
  const normEvidenceIdx = idx('norm_evidence');

  type Bucket = {
    provider_id: string;
    provider_name: string;
    knownCount: number;
    totalCount: number;
    pillarEvidenceSum: Record<string, number>;
    pillarEvidenceCount: Record<string, number>;
  };

  const map = new Map<string, Bucket>();

  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const provider_id = cols[providerIdIdx];
    const provider_name = cols[providerNameIdx];
    const pillar = normalizePillarName(cols[pillarIdx] || '');
    if (!provider_id || !provider_name || !PILLAR_ORDER.includes(pillar)) continue;

    const normKnown = toNumber(cols[normKnownIdx]);
    const normEvidence = toNumber(cols[normEvidenceIdx]) ?? 0;

    if (!map.has(provider_id)) {
      map.set(provider_id, {
        provider_id,
        provider_name,
        knownCount: 0,
        totalCount: 0,
        pillarEvidenceSum: Object.fromEntries(PILLAR_ORDER.map((p) => [p, 0])),
        pillarEvidenceCount: Object.fromEntries(PILLAR_ORDER.map((p) => [p, 0])),
      });
    }

    const bucket = map.get(provider_id)!;
    bucket.totalCount += 1;
    bucket.pillarEvidenceSum[pillar] += normEvidence;
    bucket.pillarEvidenceCount[pillar] += 1;
    if (normKnown !== undefined) bucket.knownCount += 1;
  }

  const rows: Provider[] = [];

  map.forEach((bucket) => {
    const row: Provider = {
      provider_id: bucket.provider_id,
      provider_name: bucket.provider_name,
      AIPI: 0,
      coverage: bucket.totalCount ? bucket.knownCount / bucket.totalCount : 0,
    };
    let aipi = 0;
    for (const pillar of PILLAR_ORDER) {
      const val = bucket.pillarEvidenceCount[pillar]
        ? bucket.pillarEvidenceSum[pillar] / bucket.pillarEvidenceCount[pillar]
        : 0;
      row[pillar] = val;
      aipi += val;
    }
    row.AIPI = aipi / PILLAR_ORDER.length;
    rows.push(row);
  });

  return rows;
}

export default function HomePage() {
  const [rows, setRows] = useState<Provider[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('aipi');
  const [topOnly, setTopOnly] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const csv = await fetch('/data/scores_by_indicator.csv').then((r) => r.text());
        if (!cancelled) {
          setRows(deriveRowsFromScores(csv));
        }
      } catch {
        if (!cancelled) {
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedRows = useMemo(() => {
    const out = [...rows];
    if (sortKey === 'aipi') out.sort((a, b) => (b.AIPI ?? 0) - (a.AIPI ?? 0));
    if (sortKey === 'coverage') out.sort((a, b) => (b.coverage ?? 0) - (a.coverage ?? 0));
    if (sortKey === 'name') out.sort((a, b) => a.provider_name.localeCompare(b.provider_name));
    return out;
  }, [rows, sortKey]);

  const shownRows = topOnly ? sortedRows.slice(0, 10) : sortedRows;

  return (
    <main id="main" className="page">
      <section className="overview-section" aria-labelledby="overview-h">
        <h1 id="overview-h" className="sr-only">AI Pluralism Index overview</h1>
        <p className="overview-one-line">
          Measures whether stakeholders can shape AI objectives, data practices, safeguards, and deployment.
        </p>
        <div className="overview-link-row">
          <Link href="/how-scoring-works" className="minimal-link">How scoring works</Link>
        </div>
      </section>

      <section id="provider-results" className="overview-section" aria-labelledby="results-h">
        <div className="ov-results-head">
          <h2 id="results-h" className="section-title">Provider results</h2>
          <div className="ov-results-controls">
            <label className="meta">
              Sort
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} aria-label="Sort providers">
                <option value="aipi">AIPI</option>
                <option value="coverage">Coverage</option>
                <option value="name">Name</option>
              </select>
            </label>
            <div className="ov-toggle" role="group" aria-label="Result range">
              <button type="button" onClick={() => setTopOnly(true)} className={!topOnly ? 'ghost' : ''}>Top 10</button>
              <button type="button" onClick={() => setTopOnly(false)} className={topOnly ? 'ghost' : ''}>All</button>
            </div>
          </div>
        </div>

        <div className="ov-legend" aria-label="Pillar colors">
          {PILLAR_ORDER.map((pillar, idx) => (
            <span key={pillar} className="ov-legend-item">
              <span className={`ov-dot ov-dot-${idx + 1}`} aria-hidden="true" />
              {pillar}
            </span>
          ))}
          <span className="ov-legend-item">
            <span className="ov-coverage-key" aria-hidden="true" />
            Coverage <abbr className="term-help" title="Coverage = share of indicators with evidence.">?</abbr>
          </span>
        </div>

        <div className="ov-results-scroll">
          <div className="ov-results-chart" role="img" aria-label="Stacked bars show pillar contributions to AIPI with a separate coverage bar for each provider.">
            {loading ? (
              <p className="meta">Loading provider results…</p>
            ) : (
              shownRows.map((row) => (
                <article className="ov-result-row" key={row.provider_id}>
                  <div className="ov-row-head">
                    <span>{row.provider_name}</span>
                    <span className="metric-num">{row.AIPI.toFixed(3)}</span>
                  </div>
                  <div className="ov-aipi-track" aria-label={`${row.provider_name} AIPI ${row.AIPI.toFixed(3)}`}>
                    {PILLAR_ORDER.map((pillar, idx) => {
                      const pillarValue = Math.max(0, Math.min(1, getPillarValue(row, pillar)));
                      const contributionPct = (pillarValue / 4) * 100;
                      return (
                        <span
                          key={`${row.provider_id}-${pillar}`}
                          className={`ov-segment ov-segment-${idx + 1}`}
                          style={{ width: `${contributionPct}%` }}
                          title={`${pillar}: ${pillarValue.toFixed(2)}`}
                        />
                      );
                    })}
                  </div>
                  <div className="ov-coverage-track" aria-label={`${row.provider_name} coverage ${Math.round(row.coverage * 100)}%`}>
                    <span style={{ width: `${Math.max(0, Math.min(100, Math.round((row.coverage ?? 0) * 100)))}%` }} />
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
