'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type ScoreMode = 'evidence' | 'known_only';
type SortKey = 'rank' | 'provider_name' | 'AIPI' | 'coverage';
type SortDir = 'asc' | 'desc';

type ProviderRow = {
  provider_id: string;
  provider_name: string;
  rank: number;
  AIPI: number;
  coverage: number;
  [k: string]: string | number;
};

type ModeData = {
  evidence: ProviderRow[];
  known_only: ProviderRow[];
};

const PILLARS = [
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

function deriveModeDataFromScores(csv: string): ModeData {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return { evidence: [], known_only: [] };

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
    pillarKnownSum: Record<string, number>;
    pillarKnownCount: Record<string, number>;
  };

  const map = new Map<string, Bucket>();

  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const provider_id = cols[providerIdIdx];
    const provider_name = cols[providerNameIdx];
    const pillarRaw = cols[pillarIdx];
    const pillar = normalizePillarName(pillarRaw);
    if (!provider_id || !provider_name || !PILLARS.includes(pillar)) continue;

    const normKnown = toNumber(cols[normKnownIdx]);
    const normEvidence = toNumber(cols[normEvidenceIdx]) ?? 0;

    if (!map.has(provider_id)) {
      map.set(provider_id, {
        provider_id,
        provider_name,
        knownCount: 0,
        totalCount: 0,
        pillarEvidenceSum: Object.fromEntries(PILLARS.map((p) => [p, 0])),
        pillarEvidenceCount: Object.fromEntries(PILLARS.map((p) => [p, 0])),
        pillarKnownSum: Object.fromEntries(PILLARS.map((p) => [p, 0])),
        pillarKnownCount: Object.fromEntries(PILLARS.map((p) => [p, 0])),
      });
    }

    const b = map.get(provider_id)!;
    b.totalCount += 1;
    b.pillarEvidenceSum[pillar] += normEvidence;
    b.pillarEvidenceCount[pillar] += 1;

    if (normKnown !== undefined) {
      b.knownCount += 1;
      b.pillarKnownSum[pillar] += normKnown;
      b.pillarKnownCount[pillar] += 1;
    }
  }

  const rowsEvidence: ProviderRow[] = [];
  const rowsKnown: ProviderRow[] = [];

  map.forEach((b) => {
    const evidenceRow: ProviderRow = {
      provider_id: b.provider_id,
      provider_name: b.provider_name,
      rank: 0,
      AIPI: 0,
      coverage: b.totalCount ? b.knownCount / b.totalCount : 0,
    };
    const knownRow: ProviderRow = {
      provider_id: b.provider_id,
      provider_name: b.provider_name,
      rank: 0,
      AIPI: 0,
      coverage: b.totalCount ? b.knownCount / b.totalCount : 0,
    };

    let evidenceAipi = 0;
    let knownAipi = 0;
    for (const pillar of PILLARS) {
      const e = b.pillarEvidenceCount[pillar] ? b.pillarEvidenceSum[pillar] / b.pillarEvidenceCount[pillar] : 0;
      const k = b.pillarKnownCount[pillar] ? b.pillarKnownSum[pillar] / b.pillarKnownCount[pillar] : 0;
      evidenceRow[pillar] = e;
      knownRow[pillar] = k;
      evidenceAipi += e;
      knownAipi += k;
    }
    evidenceRow.AIPI = evidenceAipi / PILLARS.length;
    knownRow.AIPI = knownAipi / PILLARS.length;

    rowsEvidence.push(evidenceRow);
    rowsKnown.push(knownRow);
  });

  const rankRows = (rows: ProviderRow[]) => {
    const sorted = [...rows].sort((a, b) => (b.AIPI - a.AIPI) || a.provider_name.localeCompare(b.provider_name));
    sorted.forEach((row, i) => {
      row.rank = i + 1;
    });
    return sorted;
  };

  return {
    evidence: rankRows(rowsEvidence),
    known_only: rankRows(rowsKnown),
  };
}

function sortIcon(k: SortKey, sortKey: SortKey, sortDir: SortDir): string {
  if (k !== sortKey) return '↕';
  return sortDir === 'asc' ? '↑' : '↓';
}

export default function ProvidersPage() {
  const router = useRouter();
  const [dataByMode, setDataByMode] = useState<ModeData>({ evidence: [], known_only: [] });
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [mode, setMode] = useState<ScoreMode>('evidence');
  const [showPillarColumns, setShowPillarColumns] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | undefined>();
  const [showSortSheet, setShowSortSheet] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const csv = await fetch('/data/scores_by_indicator.csv').then((r) => r.text());
        if (cancelled) return;
        setDataByMode(deriveModeDataFromScores(csv));
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setErr('Failed to load data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = dataByMode[mode] ?? [];
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (!needle) return true;
      return (
        r.provider_name.toLowerCase().includes(needle) ||
        r.provider_id.toLowerCase().includes(needle)
      );
    });

    const sorted = [...list].sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      if (typeof va === 'string' || typeof vb === 'string') {
        return `${va}`.localeCompare(`${vb}`) * (sortDir === 'asc' ? 1 : -1);
      }
      return (Number(va) - Number(vb)) * (sortDir === 'asc' ? 1 : -1);
    });
    return sorted;
  }, [rows, q, sortKey, sortDir]);

  function onHeaderClick(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(k);
      setSortDir(k === 'provider_name' ? 'asc' : 'desc');
    }
  }

  function downloadCsv() {
    const header = ['rank', 'provider_id', 'provider_name', 'AIPI', 'coverage', ...PILLARS];
    const lines = filtered.map((r) => [
      r.rank,
      r.provider_id,
      `"${r.provider_name.replace(/"/g, '""')}"`,
      Number(r.AIPI).toFixed(3),
      `${Math.round(Number(r.coverage) * 100)}%`,
      ...PILLARS.map((p) => Number(r[p] ?? 0).toFixed(2)),
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `providers_${mode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadJson() {
    const out = filtered.map((r) => ({
      rank: r.rank,
      provider_id: r.provider_id,
      provider_name: r.provider_name,
      AIPI: Number(r.AIPI).toFixed(3),
      coverage: `${Math.round(Number(r.coverage) * 100)}%`,
      pillars: Object.fromEntries(PILLARS.map((p) => [p, Number(r[p] ?? 0).toFixed(2)])),
      score_mode: mode,
    }));
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `providers_${mode}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main id="main" className="page">
      <section className="panel" aria-labelledby="providers-h">
        <div className="providers-controls providers-controls-sticky">
          <div className="providers-top-row">
            <div className="providers-title-wrap">
              <h2 id="providers-h" className="controls-title">Providers</h2>
              <p className="providers-meta-row meta">
                <span className="metric-num">{filtered.length} results</span>
                <span aria-hidden="true">·</span>
                <span>Coverage = share with public evidence.</span>
              </p>
            </div>

            <div className="providers-search-wrap">
              <input
                type="search"
                placeholder="Search provider or ID…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search providers"
              />
              {q ? (
                <button type="button" className="pill-btn" onClick={() => setQ('')} aria-label="Clear search">
                  Clear
                </button>
              ) : null}
            </div>

            <div className="providers-mode-wrap">
              <div className="score-mode" role="group" aria-label="Score mode">
                <button type="button" className={mode === 'evidence' ? '' : 'ghost'} onClick={() => setMode('evidence')}>
                  Evidence (lower bound)
                </button>
                <button type="button" className={mode === 'known_only' ? '' : 'ghost'} onClick={() => setMode('known_only')}>
                  Known-only (sensitivity)
                </button>
              </div>

              <details className="info-tip providers-help">
                <summary>What is this?</summary>
                <p className="meta">
                  Evidence treats unknowns as 0; Known-only excludes unknowns from the denominator.{' '}
                  <a href="/about#glossary">Learn more</a>
                </p>
              </details>
            </div>
          </div>

          <div className="providers-bottom-row">
            <details className="columns-menu">
              <summary>Columns</summary>
              <label>
                <input
                  type="checkbox"
                  checked={showPillarColumns}
                  onChange={(e) => setShowPillarColumns(e.target.checked)}
                />
                Show individual pillar columns
              </label>
            </details>

            <label className="meta sort-desktop">
              Sort
              <select
                value={`${sortKey}:${sortDir}`}
                onChange={(e) => {
                  const [k, d] = e.target.value.split(':');
                  setSortKey(k as SortKey);
                  setSortDir(d as SortDir);
                }}
                aria-label="Sort order"
              >
                <option value="rank:asc">Rank ↑</option>
                <option value="rank:desc">Rank ↓</option>
                <option value="provider_name:asc">Name A→Z</option>
                <option value="provider_name:desc">Name Z→A</option>
                <option value="AIPI:desc">AIPI ↓</option>
                <option value="AIPI:asc">AIPI ↑</option>
                <option value="coverage:desc">Coverage ↓</option>
                <option value="coverage:asc">Coverage ↑</option>
              </select>
            </label>
            <button type="button" className="pill-btn sort-mobile" onClick={() => setShowSortSheet(true)}>
              Sort
            </button>

            <div className="download-actions">
              <button type="button" className="pill-btn" onClick={downloadCsv}>Download CSV</button>
              <button type="button" className="pill-btn" onClick={downloadJson}>Download JSON</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="table-wrap" role="region" aria-live="polite">
            <table>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Provider</th>
                  <th scope="col" className="num">AIPI</th>
                  <th scope="col" className="num">Coverage</th>
                  <th scope="col">Pillars</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td><span className="skeleton" style={{ width: 24, display: 'block' }} /></td>
                    <td><span className="skeleton" style={{ width: 180, display: 'block' }} /></td>
                    <td className="num"><span className="skeleton" style={{ width: 60, display: 'inline-block' }} /></td>
                    <td className="num"><span className="skeleton" style={{ width: 60, display: 'inline-block' }} /></td>
                    <td><span className="skeleton" style={{ width: 140, display: 'inline-block' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : err ? (
          <p className="meta">{err}</p>
        ) : (
          <>
            <div className="table-wrap providers-table-desktop" role="region" aria-labelledby="providers-h">
              <table>
                <thead>
                  <tr>
                    <th scope="col">
                      <button type="button" className="th-btn" onClick={() => onHeaderClick('rank')}>
                        Rank <span>{sortIcon('rank', sortKey, sortDir)}</span>
                      </button>
                    </th>
                    <th scope="col">
                      <button type="button" className="th-btn" onClick={() => onHeaderClick('provider_name')}>
                        Provider <span>{sortIcon('provider_name', sortKey, sortDir)}</span>
                      </button>
                    </th>
                    <th scope="col" className="num">
                      <button type="button" className="th-btn th-btn-num" onClick={() => onHeaderClick('AIPI')}>
                        AIPI <abbr className="term-help" title="Overall pluralism score.">?</abbr> <span>{sortIcon('AIPI', sortKey, sortDir)}</span>
                      </button>
                    </th>
                    <th scope="col" className="num">
                      <button type="button" className="th-btn th-btn-num" onClick={() => onHeaderClick('coverage')}>
                        Coverage <abbr className="term-help" title="Share of indicators with verifiable evidence.">?</abbr> <span>{sortIcon('coverage', sortKey, sortDir)}</span>
                      </button>
                    </th>
                    <th scope="col">Pillars</th>
                    {showPillarColumns ? PILLARS.map((pillar) => <th scope="col" key={pillar} className="num">{pillar}</th>) : null}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.provider_id}
                      className="providers-row-click"
                      onClick={() => router.push(`/aipi/provider/${encodeURIComponent(r.provider_id)}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/aipi/provider/${encodeURIComponent(r.provider_id)}`);
                        }
                      }}
                      tabIndex={0}
                    >
                      <td className="metric-num">{r.rank}</td>
                      <th scope="row">
                        <Link href={`/aipi/provider/${encodeURIComponent(r.provider_id)}`} onClick={(e) => e.stopPropagation()}>
                          {r.provider_name}
                        </Link>
                      </th>
                      <td className="num metric-num" style={{ fontWeight: 700 }}>{Number(r.AIPI).toFixed(3)}</td>
                      <td className="num">
                        <div className="progress" aria-label={`Coverage ${(Number(r.coverage) * 100).toFixed(0)}%`}>
                          <span style={{ width: `${Math.max(0, Math.min(100, Math.round(Number(r.coverage) * 100)))}%` }} />
                        </div>
                        <span className="meta metric-num">{Math.round(Number(r.coverage) * 100)}%</span>
                      </td>
                      <td>
                        <div className="pillars-mini" aria-label="Pillar scores">
                          {PILLARS.map((pillar, i) => {
                            const val = Number(r[pillar] ?? 0);
                            return (
                              <span
                                key={pillar}
                                className={`pillars-mini-seg pillars-mini-seg-${i + 1}`}
                                style={{ width: `${Math.max(0, Math.min(100, val * 100))}%` }}
                                title={`${pillar}: ${val.toFixed(2)}`}
                              />
                            );
                          })}
                        </div>
                      </td>
                      {showPillarColumns
                        ? PILLARS.map((pillar) => <td key={pillar} className="num metric-num">{Number(r[pillar] ?? 0).toFixed(2)}</td>)
                        : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="providers-mobile-cards" aria-label="Provider cards">
              {filtered.map((r) => (
                <article
                  className="provider-card panel"
                  key={`card-${r.provider_id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/aipi/provider/${encodeURIComponent(r.provider_id)}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/aipi/provider/${encodeURIComponent(r.provider_id)}`);
                    }
                  }}
                >
                  <header className="provider-card-head">
                    <Link href={`/aipi/provider/${encodeURIComponent(r.provider_id)}`} onClick={(e) => e.stopPropagation()}>
                      {r.provider_name}
                    </Link>
                    <span className="badge metric-num">Rank {r.rank}</span>
                  </header>
                  <div className="provider-card-topline">
                    <div>
                      <p className="meta">AIPI</p>
                      <p className="provider-card-aipi metric-num">{Number(r.AIPI).toFixed(3)}</p>
                    </div>
                    <span className="badge metric-num">{Math.round(Number(r.coverage) * 100)}% coverage</span>
                  </div>
                  <div className="provider-card-pillars">
                    {PILLARS.map((pillar, i) => {
                      const val = Number(r[pillar] ?? 0);
                      return (
                        <div key={`${r.provider_id}-${pillar}`} className="provider-card-pillar-row">
                          <span className="meta">{pillar}</span>
                          <div className="provider-card-pillar-track">
                            <span className={`provider-card-pillar-fill provider-card-pillar-fill-${i + 1}`} style={{ width: `${Math.max(0, Math.min(100, val * 100))}%` }} />
                          </div>
                          <span className="meta metric-num">{val.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {showSortSheet ? (
        <div className="sort-sheet-backdrop" role="presentation" onClick={() => setShowSortSheet(false)}>
          <div className="sort-sheet" role="dialog" aria-modal="true" aria-label="Sort options" onClick={(e) => e.stopPropagation()}>
            <h3>Sort providers</h3>
            <div className="sort-sheet-options">
              <button type="button" onClick={() => { setSortKey('rank'); setSortDir('asc'); setShowSortSheet(false); }}>Rank ↑</button>
              <button type="button" onClick={() => { setSortKey('rank'); setSortDir('desc'); setShowSortSheet(false); }}>Rank ↓</button>
              <button type="button" onClick={() => { setSortKey('provider_name'); setSortDir('asc'); setShowSortSheet(false); }}>Name A→Z</button>
              <button type="button" onClick={() => { setSortKey('provider_name'); setSortDir('desc'); setShowSortSheet(false); }}>Name Z→A</button>
              <button type="button" onClick={() => { setSortKey('AIPI'); setSortDir('desc'); setShowSortSheet(false); }}>AIPI ↓</button>
              <button type="button" onClick={() => { setSortKey('coverage'); setSortDir('desc'); setShowSortSheet(false); }}>Coverage ↓</button>
            </div>
            <button type="button" className="pill-btn" onClick={() => setShowSortSheet(false)}>Close</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
