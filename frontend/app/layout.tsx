import './globals.css';

export const metadata = {
  title: 'AI Pluralism Index (AIPI)',
  description: 'Evidence-based index of AI pluralism across providers and system families.',
  viewport: { width: 'device-width', initialScale: 1 },
  themeColor: '#10161f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" style={{position:'absolute',left:-9999}} className="skip">Skip to content</a>
        <div className="container">
          <header className="header">
            <div style={{display:'flex', alignItems:'baseline', gap:12}}>
              <span className="brand">AI Pluralism Index</span>
              <span className="meta">AIPI</span>
            </div>
            <nav className="nav" aria-label="Main">
              <a href="/" aria-current="page">Overview</a>
              <a href="/aipi/providers">Providers</a>
            </nav>
          </header>
          {children}
          <footer>
            <p>© {new Date().getFullYear()} AIPI. Code MIT; Data CC BY 4.0.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
