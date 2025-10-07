
'use client';
import { useEffect, useMemo, useState } from 'react';

type Provider = {
  provider_id: string;
  provider_name: string;
  AIPI: number;
  rank: number;
  coverage: number;
  [key: string]: any;
};

type SortKey = 'rank'|'provider_name'|'AIPI'|'coverage'|string;
type SortDir = 'asc'|'desc';

export default function ProvidersPage() {
  const [rows, setRows] = useState<Provider[]>([]);
  const [pillars, setPillars] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|undefined>();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const meta = await fetch(process.env.NEXT_PUBLIC_AIPI_META_URL || '/data/meta.json').then(r=>r.json());
        const data = await fetch(process.env.NEXT_PUBLIC_AIPI_DATA_URL || '/data/providers.json').then(r=>r.json());
        if (!cancelled) {
          setPillars(meta.pillars || []);
          setRows(Array.isArray(data) ? data : []);
        }
      } catch (e:any) {
        console.error(e);
        if (!cancelled) setErr('Failed to load data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const r = rows.filter(r =>
      !needle ||
      r.provider_name.toLowerCase().includes(needle) ||
      r.provider_id.toLowerCase().includes(needle)
    );
    const sorted = [...r].sort((a,b)=>{
      const va = (a as any)[sortKey] ?? 0;
      const vb = (b as any)[sortKey] ?? 0;
      if (typeof va === 'string' || typeof vb === 'string') {
        return (''+va).localeCompare(''+vb) * (sortDir==='asc'?1:-1);
      }
      return (va - vb) * (sortDir==='asc'?1:-1);
    });
    return sorted;
  }, [rows, q, sortKey, sortDir]);

  function onHeaderClick(k: SortKey){
    if (sortKey === k) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortKey(k); setSortDir(k==='provider_name'?'asc':'asc'); }
  }

  return (
    <main id="main">
      <section className="panel" aria-labelledby="providers-h">
        <div className="controls">
          <h2 id="providers-h" style={{margin:'0 8px 0 0'}}>Providers</h2>
          <input type="search" placeholder="Search providers…" value={q} onChange={e=>setQ(e.target.value)} aria-label="Search providers"/>
          <div style={{flex:1}} />
          <label className="meta">Sort&nbsp;
            <select value={sortKey+':'+sortDir} onChange={e=>{
              const [k,d] = e.target.value.split(':');
              setSortKey(k as SortKey); setSortDir(d as SortDir);
            }} aria-label="Sort order">
              <option value={'rank:asc'}>Rank ↑</option>
              <option value={'rank:desc'}>Rank ↓</option>
              <option value={'provider_name:asc'}>Name A→Z</option>
              <option value={'provider_name:desc'}>Name Z→A</option>
              <option value={'AIPI:desc'}>AIPI ↓</option>
              <option value={'AIPI:asc'}>AIPI ↑</option>
              <option value={'coverage:desc'}>Coverage ↓</option>
              <option value={'coverage:asc'}>Coverage ↑</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="table-wrap" role="region" aria-live="polite">
            <table><thead><tr>
              <th>#</th><th>Provider</th><th className="num">AIPI</th><th className="num">Coverage</th>
            </tr></thead><tbody>
              {Array.from({length:8}).map((_,i)=>(
                <tr key={i}><td><span className="skeleton" style={{width:24,display:'block'}}/></td><td><span className="skeleton" style={{width:180,display:'block'}}/></td><td className="num"><span className="skeleton" style={{width:60,display:'inline-block'}}/></td><td className="num"><span className="skeleton" style={{width:60,display:'inline-block'}}/></td></tr>
              ))}
            </tbody></table>
          </div>
        ) : err ? (
          <p className="meta">{err}</p>
        ) : (
          <div className="table-wrap" role="region" aria-labelledby="providers-h">
            <table>
              <thead>
                <tr>
                  <th onClick={()=>onHeaderClick('rank')} role="button" aria-sort={sortKey==='rank'?sortDir:'none'}>#</th>
                  <th onClick={()=>onHeaderClick('provider_name')} role="button" aria-sort={sortKey==='provider_name'?sortDir:'none'}>Provider</th>
                  {pillars.map(p => <th key={p} className="num">{p}</th>)}
                  <th onClick={()=>onHeaderClick('AIPI')} role="button" className="num" aria-sort={sortKey==='AIPI'?sortDir:'none'}>AIPI</th>
                  <th onClick={()=>onHeaderClick('coverage')} role="button" className="num" aria-sort={sortKey==='coverage'?sortDir:'none'}>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.provider_id}>
                    <td>{r.rank}</td>
                    <td><a href={`/aipi/provider/${encodeURIComponent(r.provider_id)}`}>{r.provider_name}</a></td>
                    {pillars.map(p => <td key={p} className="num">{((r as any)[p] ?? 0).toFixed(2)}</td>)}
                    <td className="num" style={{fontWeight:700}}>{(r.AIPI).toFixed(3)}</td>
                    <td className="num">
                      <div className="progress" aria-label={`Coverage ${(r.coverage*100).toFixed(0)}%`}>
                        <span style={{width: Math.max(0, Math.min(100, Math.round((r.coverage||0)*100))) + '%'}}/>
                      </div>
                      <span className="meta">{(r.coverage*100).toFixed(0)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
