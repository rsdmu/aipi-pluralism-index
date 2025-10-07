'use client';
import { useEffect, useMemo, useState } from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

type Provider = { provider_id: string; provider_name: string; AIPI: number; rank: number; coverage: number; [k:string]: any; };
type Detail = { provider_id: string; indicator_id: string; indicator_name: string; pillar: string; indicator_value: number; norm_evidence?: number; evidence_url?: string; system_family: string; provider_name: string; };

export default function ProviderDetail({ params }: any) {
  const { id } = params;
  const [rows, setRows] = useState<Provider[]>([]);
  const [detail, setDetail] = useState<Detail[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|undefined>();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [meta, rows, csv] = await Promise.all([
          fetch(process.env.NEXT_PUBLIC_AIPI_META_URL || '/data/meta.json').then(r=>r.json()),
          fetch(process.env.NEXT_PUBLIC_AIPI_DATA_URL || '/data/providers.json').then(r=>r.json()),
          fetch('/data/scores_by_indicator.csv').then(r=>r.text()).catch(()=>''), // local fallback
        ]);
        if (cancelled) return;
        setMeta(meta);
        setRows(rows);

        const lines = csv.split(/\r?\n/).filter(Boolean);
        const splitCSV = (line: string): string[] => {
          const out: string[] = [];
          let cur = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
              if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
              else { inQuotes = !inQuotes; }
            } else if (ch === ',' && !inQuotes) {
              out.push(cur); cur = '';
            } else {
              cur += ch;
            }
          }
          out.push(cur);
          return out.map(s => s.trim());
        };

        if (lines.length > 1) {
          const head = splitCSV(lines[0]);
          const details: Detail[] = lines.slice(1).map((ln) => {
            const cols = splitCSV(ln);
            const obj: any = {};
            head.forEach((h, i) => (obj[h] = cols[i]));
            return {
              provider_id: obj.provider_id,
              provider_name: obj.provider_name,
              system_family: obj.system_family,
              indicator_id: obj.indicator_id,
              indicator_name: obj.indicator_name,
              pillar: obj.pillar,
              indicator_value: parseFloat(obj.indicator_value),
              norm_evidence: obj.norm_evidence ? parseFloat(obj.norm_evidence) : undefined,
              evidence_url: obj.evidence_url || undefined,
            };
          });
          setDetail(details);
        }
      } catch (e:any) {
        console.error(e);
        if (!cancelled) setErr('Failed to load data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return ()=>{ cancelled = true };
  }, [id]);

  const provider = rows.find(r => r.provider_id === id);
  const indicators = useMemo(()=> detail.filter(d => d.provider_id === id), [detail, id]);
  const pillars: string[] = meta?.pillars || [];

  const data = {
    labels: pillars,
    datasets: [{
      label: 'Pillar scores',
      data: pillars.map(p => (provider ? (provider as any)[p] ?? 0 : 0)),
      fill: true,
      tension: 0.2
    }]
  };
  const options:any = {
    scales: { r: { angleLines: { color:'#1f2a37' }, grid: { color:'#1f2a37' }, pointLabels: { color:'#a7b1c2' }, ticks: { display:false, beginAtZero:true, max:1 } } },
    plugins: { legend: { display:false }, tooltip: { enabled:true } },
    responsive: true,
    maintainAspectRatio: false
  };

  if (loading) {
    return (
      <main id="main">
        <section className="panel" aria-labelledby="prov-h">
          <div style={{display:'grid', gap:16}}>
            <div className="skeleton" style={{width:'60%', height:28}} />
            <div className="skeleton" style={{width:'100%', height:280}} />
            <div className="skeleton" style={{width:'100%', height:200}} />
          </div>
        </section>
      </main>
    );
  }

  if (err) return <main><section className="panel"><p className="meta">{err}</p></section></main>;
  if (!provider) return <main><section className="panel"><p className="meta">Provider not found.</p></section></main>;

  return (
    <main id="main">
      <section className="panel" aria-labelledby="prov-h">
        <div className="controls" style={{marginBottom:0}}>
          <a href="/aipi/providers" className="badge" aria-label="Back to providers">← Back</a>
          <div style={{flex:1}} />
          <span className="badge">Rank {provider.rank}</span>
        </div>

        <h1 style={{margin:'8px 0 8px'}}>{provider.provider_name}</h1>
        <p className="meta">AIPI {(provider.AIPI).toFixed(3)} • Coverage {(provider.coverage*100).toFixed(0)}%</p>

        <div className="panel" style={{padding:0, marginTop:12}}>
          <div style={{height:340, padding:16}}>
            <Radar data={data as any} options={options} />
          </div>
        </div>

        <h2 style={{marginTop:24}}>Indicators</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pillar</th>
                <th>Indicator</th>
                <th className="num">Value</th>
                <th className="num">Evidence (norm.)</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((d, i) => (
                <tr key={i}>
                  <td>{d.pillar}</td>
                  <td>{d.indicator_name}</td>
                  <td className="num">{(d.indicator_value ?? 0).toFixed(2)}</td>
                  <td className="num">{(d.norm_evidence ?? 0).toFixed(2)}</td>
                  <td>{d.evidence_url ? <a href={d.evidence_url} target="_blank" rel="noreferrer">source</a> : '—'}</td>
                </tr>
              ))}
              {!indicators.length ? <tr><td colSpan={5} className="meta">No indicator-level rows for this provider.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
