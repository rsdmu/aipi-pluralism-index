'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

type ScoreMode = 'evidence' | 'known_only';
type IndicatorFilter = 'all' | 'with_evidence' | 'missing_evidence';
type SortMode = 'score_desc' | 'alpha';

type ProviderScores = {
  provider_id: string;
  provider_name: string;
  rank: number;
  AIPI: number;
  coverage: number;
  pillars: Record<string, number>;
};

type IndicatorRow = {
  provider_id: string;
  provider_name: string;
  indicator_id: string;
  indicator_name: string;
  pillar: string;
  indicator_value_raw: string;
  norm_evidence?: number;
  norm_known?: number;
  evidence_urls: string[];
};

type ModeData = {
  evidence: ProviderScores[];
  known_only: ProviderScores[];
};

type ParsedData = {
  byMode: ModeData;
  detailByProvider: Record<string, IndicatorRow[]>;
};

type MetaShape = {
  generated_utc?: string;
  indicators?: Array<{ last_updated_utc?: string }>;
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

function extractUrls(v: string | undefined): string[] {
  if (!v) return [];
  const matches = v.match(/https?:\/\/[^\s,;]+/g) || [];
  return Array.from(new Set(matches.map((m) => m.replace(/[)\].,;]+$/, ''))));
}

function parseData(csv: string): ParsedData {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return { byMode: { evidence: [], known_only: [] }, detailByProvider: {} };

  const header = parseCsvLine(lines[0]);
  const idx = (name: string) => header.indexOf(name);

  const iProviderId = idx('provider_id');
  const iProviderName = idx('provider_name');
  const iIndicatorId = idx('indicator_id');
  const iIndicatorName = idx('indicator_name');
  const iPillar = idx('pillar');
  const iIndicatorValue = idx('indicator_value');
  const iNormEvidence = idx('norm_evidence');
  const iNormKnown = idx('norm_known');
  const iEvidenceUrl = idx('evidence_url');

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

  const buckets = new Map<string, Bucket>();
  const details: Record<string, IndicatorRow[]> = {};

  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const provider_id = cols[iProviderId];
    const provider_name = cols[iProviderName];
    const pillar = normalizePillarName(cols[iPillar]);
    if (!provider_id || !provider_name || !PILLARS.includes(pillar)) continue;

    const normEvidence = toNumber(cols[iNormEvidence]) ?? 0;
    const normKnown = toNumber(cols[iNormKnown]);

    if (!buckets.has(provider_id)) {
      buckets.set(provider_id, {
        provider_id,
        provider_name,
        knownCount: 0,
        totalCount: 0,
        pillarEvidenceSum: Object.fromEntries(PILLARS.map((p) => [p, 0])),
        pillarEvidenceCount: Object.fromEntries(PILLARS.map((p) => [p, 0])),
        pillarKnownSum: Object.fromEntries(PILLARS.map((p) => [p, 0])),
        pillarKnownCount: Object.fromEntries(PILLARS.map((p) => [p, 0])),
      });
      details[provider_id] = [];
    }

    const b = buckets.get(provider_id)!;
    b.totalCount += 1;
    b.pillarEvidenceSum[pillar] += normEvidence;
    b.pillarEvidenceCount[pillar] += 1;
    if (normKnown !== undefined) {
      b.knownCount += 1;
      b.pillarKnownSum[pillar] += normKnown;
      b.pillarKnownCount[pillar] += 1;
    }

    details[provider_id].push({
      provider_id,
      provider_name,
      indicator_id: cols[iIndicatorId] || '',
      indicator_name: cols[iIndicatorName] || '',
      pillar,
      indicator_value_raw: cols[iIndicatorValue] || '',
      norm_evidence: toNumber(cols[iNormEvidence]),
      norm_known: toNumber(cols[iNormKnown]),
      evidence_urls: extractUrls(cols[iEvidenceUrl]),
    });
  }

  function buildRows(mode: ScoreMode): ProviderScores[] {
    const rows: ProviderScores[] = [];
    buckets.forEach((b) => {
      const pillarScores: Record<string, number> = {};
      let aipi = 0;
      for (const p of PILLARS) {
        const val =
          mode === 'evidence'
            ? (b.pillarEvidenceCount[p] ? b.pillarEvidenceSum[p] / b.pillarEvidenceCount[p] : 0)
            : (b.pillarKnownCount[p] ? b.pillarKnownSum[p] / b.pillarKnownCount[p] : 0);
        pillarScores[p] = val;
        aipi += val;
      }
      rows.push({
        provider_id: b.provider_id,
        provider_name: b.provider_name,
        rank: 0,
        AIPI: aipi / PILLARS.length,
        coverage: b.totalCount ? b.knownCount / b.totalCount : 0,
        pillars: pillarScores,
      });
    });
    rows.sort((a, b) => (b.AIPI - a.AIPI) || a.provider_name.localeCompare(b.provider_name));
    rows.forEach((r, i) => {
      r.rank = i + 1;
    });
    return rows;
  }

  return {
    byMode: {
      evidence: buildRows('evidence'),
      known_only: buildRows('known_only'),
    },
    detailByProvider: details,
  };
}

function releaseTagFromUtc(generatedUtc?: string): string {
  if (!generatedUtc) return 'data-unknown';
  const dt = new Date(generatedUtc);
  if (Number.isNaN(dt.getTime())) return 'data-unknown';
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `data-${y}${m}${d}`;
}

function statusLabel(ind: IndicatorRow): 'yes' | 'partial' | 'no' | 'unknown' {
  const raw = (ind.indicator_value_raw || '').trim().toLowerCase();
  if (!raw || raw === 'unknown') return 'unknown';
  if (raw === 'yes' || raw === '1' || raw === '2') return raw === '1' ? 'partial' : 'yes';
  if (raw === 'no' || raw === '0') return 'no';
  const n = ind.norm_evidence;
  if (n === undefined) return 'unknown';
  if (n >= 0.75) return 'yes';
  if (n > 0) return 'partial';
  return 'no';
}

function valueForMode(ind: IndicatorRow, mode: ScoreMode): number | undefined {
  return mode === 'evidence' ? ind.norm_evidence : ind.norm_known;
}

export default function ProviderDetail({ params }: { params: { id: string } }) {
  const id = params.id;
  const [data, setData] = useState<ParsedData>({ byMode: { evidence: [], known_only: [] }, detailByProvider: {} });
  const [meta, setMeta] = useState<MetaShape>({});
  const [mode, setMode] = useState<ScoreMode>('evidence');
  const [filter, setFilter] = useState<IndicatorFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('score_desc');
  const [showRadar, setShowRadar] = useState(false);
  const [sourceModal, setSourceModal] = useState<{ title: string; urls: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [metaJson, csv] = await Promise.all([
          fetch(process.env.NEXT_PUBLIC_AIPI_META_URL || '/data/meta.json').then((r) => r.json()),
          fetch('/data/scores_by_indicator.csv').then((r) => r.text()),
        ]);
        if (cancelled) return;
        setMeta(metaJson || {});
        setData(parseData(csv));
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

  const provider = useMemo(
    () => (data.byMode[mode] || []).find((r) => r.provider_id === id),
    [data.byMode, mode, id]
  );
  const indicators = useMemo(() => data.detailByProvider[id] || [], [data.detailByProvider, id]);

  const grouped = useMemo(() => {
    const out: Record<string, IndicatorRow[]> = Object.fromEntries(PILLARS.map((p) => [p, []]));
    for (const ind of indicators) {
      if (!out[ind.pillar]) out[ind.pillar] = [];
      out[ind.pillar].push(ind);
    }
    return out;
  }, [indicators]);

  const improvementItems = useMemo(() => {
    const unknown = indicators.filter((i) => statusLabel(i) === 'unknown');
    const unique = Array.from(new Set(unknown.map((i) => i.indicator_name))).slice(0, 5);
    return unique;
  }, [indicators]);

  const improvementSummary = useMemo(() => {
    if (!improvementItems.length) return '';
    if (improvementItems.length === 1) return improvementItems[0];
    if (improvementItems.length === 2) return `${improvementItems[0]} and ${improvementItems[1]}`;
    return `${improvementItems.slice(0, -1).join(', ')}, and ${improvementItems[improvementItems.length - 1]}`;
  }, [improvementItems]);

  const radarData = useMemo(
    () => ({
      labels: PILLARS,
      datasets: [
        {
          label: 'Pillar scores',
          data: PILLARS.map((p) => provider?.pillars[p] ?? 0),
          fill: true,
          tension: 0.2,
          borderColor: 'rgba(0, 191, 255, 0.72)',
          backgroundColor: 'rgba(0, 191, 255, 0.10)',
          pointBackgroundColor: '#00bfff',
          pointBorderColor: '#00bfff',
          pointRadius: 2,
        },
      ],
    }),
    [provider]
  );

  const radarOptions: any = {
    scales: {
      r: {
        angleLines: { color: '#162333' },
        grid: { color: '#162333' },
        pointLabels: { color: '#9eafc6' },
        ticks: { display: false, beginAtZero: true, max: 1 },
      },
    },
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    responsive: true,
    maintainAspectRatio: false,
  };

  function downloadProviderData() {
    if (!provider) return;
    const providerIndicators = indicators.map((ind) => ({
      indicator_id: ind.indicator_id,
      indicator_name: ind.indicator_name,
      pillar: ind.pillar,
      raw_value: ind.indicator_value_raw || 'Unknown',
      score_evidence: ind.norm_evidence ?? null,
      score_known_only: ind.norm_known ?? null,
      source_urls: ind.evidence_urls,
    }));
    const out = {
      provider_id: provider.provider_id,
      provider_name: provider.provider_name,
      rank: provider.rank,
      mode,
      AIPI: Number(provider.AIPI).toFixed(3),
      coverage: `${Math.round(provider.coverage * 100)}%`,
      pillars: Object.fromEntries(PILLARS.map((p) => [p, Number(provider.pillars[p]).toFixed(2)])),
      indicators: providerIndicators,
    };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${provider.provider_id}_${mode}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main id="main" className="page">
        <section className="panel">
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="skeleton" style={{ width: '65%', height: 30 }} />
            <div className="skeleton" style={{ width: '100%', height: 120 }} />
            <div className="skeleton" style={{ width: '100%', height: 260 }} />
          </div>
        </section>
      </main>
    );
  }

  if (err) return <main id="main" className="page"><section className="panel"><p className="meta">{err}</p></section></main>;
  if (!provider) return <main id="main" className="page"><section className="panel"><p className="meta">Provider not found.</p></section></main>;

  return (
    <main id="main" className="page">
      <section className="panel provider-profile" aria-labelledby="prov-h">
        <div className="provider-profile-head">
          <div>
            <div className="provider-profile-topline">
              <Link href="/aipi/providers" className="badge" aria-label="Back to providers">← Back</Link>
              <span className="badge metric-num">Rank {provider.rank}</span>
            </div>
            <h1 id="prov-h" className="detail-header">{provider.provider_name}</h1>
            <div className="provider-profile-stats">
              <div>
                <p className="meta">AIPI <abbr className="term-help" title="Overall pluralism score across four pillars.">?</abbr></p>
                <p className="provider-big-aipi metric-num">{provider.AIPI.toFixed(3)}</p>
              </div>
              <div>
                <p className="meta">Coverage <abbr className="term-help" title="Share of indicators with verifiable public evidence.">?</abbr></p>
                <span className="badge metric-num">{Math.round(provider.coverage * 100)}%</span>
                <div className="progress" aria-label={`Coverage ${Math.round(provider.coverage * 100)}%`}>
                  <span style={{ width: `${Math.max(0, Math.min(100, Math.round(provider.coverage * 100)))}%` }} />
                </div>
                <p className="meta">Share with public verifiable evidence.</p>
              </div>
            </div>
          </div>

          <div className="provider-profile-side">
            <div className="score-mode" role="group" aria-label="Score mode">
              <button type="button" className={mode === 'evidence' ? '' : 'ghost'} onClick={() => setMode('evidence')}>
                Evidence
              </button>
              <button type="button" className={mode === 'known_only' ? '' : 'ghost'} onClick={() => setMode('known_only')}>
                Known-only
              </button>
            </div>
            <p className="meta">
              Release <span className="metric-num">{releaseTagFromUtc(meta.generated_utc)}</span>
            </p>
            <div className="provider-actions">
              <button type="button" className="pill-btn" onClick={downloadProviderData}>Download provider data</button>
              <Link className="pill-btn" href={`/contribute?provider=${encodeURIComponent(provider.provider_id)}`}>
                Report evidence / suggest update
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="panel" aria-labelledby="pillar-chart-h">
        <div className="provider-chart-head">
          <h2 id="pillar-chart-h" className="section-title">Pillar scores</h2>
          <button type="button" className="pill-btn" onClick={() => setShowRadar((v) => !v)}>
            {showRadar ? 'Bar view' : 'Radar view'}
          </button>
        </div>

        {showRadar ? (
          <div className="panel" style={{ padding: 0 }}>
            <div style={{ height: 340, padding: 16 }}>
              <Radar data={radarData as any} options={radarOptions} />
            </div>
          </div>
        ) : (
          <div className="pillar-bars">
            {PILLARS.map((pillar, idx) => {
              const val = provider.pillars[pillar] ?? 0;
              const width = Math.max(0, Math.min(100, Math.round(val * 100)));
              return (
                <div key={pillar} className="pillar-bar-row">
                  <span>{pillar}</span>
                  <div className={`pillar-bar-track pillar-bar-track-${idx + 1}`}>
                    <span
                      className={`pillar-bar-fill pillar-bar-fill-${idx + 1}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="metric-num">{val.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
        <table className="sr-only">
          <caption>Pillar score table fallback</caption>
          <thead>
            <tr>
              <th scope="col">Pillar</th>
              <th scope="col">Score</th>
            </tr>
          </thead>
          <tbody>
            {PILLARS.map((pillar) => (
              <tr key={`sr-${pillar}`}>
                <th scope="row">{pillar}</th>
                <td>{(provider.pillars[pillar] ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="meta">
          AIPI is the mean of the four pillar scores. Coverage indicates how much evidence is available.
        </p>
      </section>

      <section className="panel" aria-labelledby="improve-h">
        <h2 id="improve-h" className="section-title">What would improve this provider&apos;s score</h2>
        {!improvementItems.length ? (
          <p className="meta">No major missing-evidence indicators detected for this provider.</p>
        ) : (
          <p className="improvement-summary">
            Missing evidence areas include {improvementSummary}.{' '}
            <Link href={`/contribute?provider=${encodeURIComponent(provider.provider_id)}`}>Contribute evidence</Link>.
          </p>
        )}
      </section>

      <section className="panel" aria-labelledby="ind-h">
        <h2 id="ind-h" className="section-title">Indicators</h2>
        <div className="indicator-legend">
          <span className="indicator-pill indicator-pill-yes">Yes</span>
          <span className="indicator-pill indicator-pill-partial">Partial</span>
          <span className="indicator-pill indicator-pill-no">No</span>
          <span className="indicator-pill indicator-pill-unknown">Unknown</span>
        </div>

        <div className="indicator-controls">
          <div className="score-mode" role="group" aria-label="Indicator filter">
            <button type="button" className={filter === 'all' ? '' : 'ghost'} onClick={() => setFilter('all')}>All</button>
            <button type="button" className={filter === 'with_evidence' ? '' : 'ghost'} onClick={() => setFilter('with_evidence')}>Only with evidence</button>
            <button type="button" className={filter === 'missing_evidence' ? '' : 'ghost'} onClick={() => setFilter('missing_evidence')}>Missing evidence</button>
          </div>
          <label className="meta">
            Sort
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
              <option value="score_desc">Evidence score descending</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </label>
        </div>

        <div className="indicator-groups">
          {PILLARS.map((pillar, idx) => {
            const all = grouped[pillar] || [];
            const knownCount = all.filter((i) => i.norm_known !== undefined).length;
            const pillarCoverage = all.length ? knownCount / all.length : 0;
            const pillarScore = provider.pillars[pillar] ?? 0;

            let rows = [...all];
            if (filter === 'with_evidence') rows = rows.filter((r) => (r.evidence_urls.length > 0) && statusLabel(r) !== 'unknown');
            if (filter === 'missing_evidence') rows = rows.filter((r) => statusLabel(r) === 'unknown');
            rows.sort((a, b) => {
              if (sortMode === 'alpha') return a.indicator_name.localeCompare(b.indicator_name);
              const va = valueForMode(a, mode) ?? -1;
              const vb = valueForMode(b, mode) ?? -1;
              return vb - va;
            });

            return (
              <details key={pillar} className="indicator-group" open={idx === 0}>
                <summary>
                  <strong>{pillar}</strong>
                  <span className="meta metric-num">Score {pillarScore.toFixed(2)}</span>
                  <span className="meta metric-num">Coverage {Math.round(pillarCoverage * 100)}%</span>
                  <span className="meta metric-num">Known {knownCount}/{all.length}</span>
                </summary>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Indicator</th>
                        <th scope="col">Status</th>
                        <th scope="col" className="num">{mode === 'evidence' ? 'Evidence strength' : 'Known-only score'}</th>
                        <th scope="col">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((ind) => {
                        const st = statusLabel(ind);
                        const val = valueForMode(ind, mode);
                        const scoreText = val === undefined ? 'Unknown' : val.toFixed(2);
                        const noEvidence = ind.evidence_urls.length === 0;
                        const multi = ind.evidence_urls.length > 1;
                        return (
                          <tr key={`${ind.indicator_id}-${ind.indicator_name}`}>
                            <th scope="row">{ind.indicator_name}</th>
                            <td>
                              <span className={`indicator-pill indicator-pill-${st}`}>{st === 'unknown' ? 'Unknown' : st === 'yes' ? 'Yes' : st === 'partial' ? 'Partial' : '0'}</span>
                            </td>
                            <td className="num metric-num">{scoreText}</td>
                            <td>
                              {noEvidence ? (
                                <span className="meta">No public evidence</span>
                              ) : multi ? (
                                <button
                                  type="button"
                                  className="link-btn"
                                  onClick={() => setSourceModal({ title: ind.indicator_name, urls: ind.evidence_urls })}
                                >
                                  {ind.evidence_urls.length} sources <span className="external-link-icon" aria-hidden="true">↗</span>
                                </button>
                              ) : (
                                <a href={ind.evidence_urls[0]} target="_blank" rel="noreferrer">
                                  Source <span className="external-link-icon" aria-hidden="true">↗</span>
                                </a>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {!rows.length ? (
                        <tr><td colSpan={4} className="meta">No indicators match this filter.</td></tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {sourceModal ? (
        <div className="sort-sheet-backdrop" role="presentation" onClick={() => setSourceModal(null)}>
          <div className="sort-sheet" role="dialog" aria-modal="true" aria-label="Sources" onClick={(e) => e.stopPropagation()}>
            <h3>{sourceModal.title}</h3>
            <div className="sort-sheet-options">
              {sourceModal.urls.map((u) => (
                <a key={u} href={u} target="_blank" rel="noreferrer">
                  {u} <span className="external-link-icon" aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
            <button type="button" className="pill-btn" onClick={() => setSourceModal(null)}>Close</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
