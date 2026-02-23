import './globals.css';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300','400','500','600','700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata = {
  title: 'AI Pluralism Index (AIPI)',
  description: 'Evidence-based index of AI pluralism across providers and system families.',
  viewport: { width: 'device-width', initialScale: 1 },
  themeColor: '#10161f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* added */}
      <body className={spaceGrotesk.variable}>
        <a href="#main" style={{position:'absolute',left:-9999}} className="skip">Skip to content</a>
        <div className="container">
          <header className="header">
            <div style={{display:'flex', alignItems:'baseline', gap:12}}>
              <span className="brand">AI Pluralism Index</span>
              <span className="meta">AIPI</span>
            </div>
            <div className="header-actions">
              <nav className="nav" aria-label="Main">
                <a href="/" aria-current="page">Overview</a>
                <a href="/aipi/providers">Providers</a>
              </nav>
              <a
                className="contribute-cta"
                href="https://github.com/rsdmu/aipi-pluralism-index"
                target="_blank"
                rel="noreferrer"
              >
                Contribute
              </a>
            </div>
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
