import './globals.css';
import Link from 'next/link';
import { Space_Grotesk } from 'next/font/google';
import HeaderNav from './components/HeaderNav';

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
      <body className={spaceGrotesk.variable}>
        <a href="#main" className="skip">Skip to content</a>
        <div className="container">
          <header className="header">
            <div className="brand-lockup">
              <span className="brand">AI Pluralism Index</span>
              <span className="meta">AIPI</span>
            </div>
            <HeaderNav />
          </header>
          {children}
          <footer className="site-footer">
            <nav className="footer-links" aria-label="Footer">
              <a href="https://arxiv.org/abs/2510.08193v3" target="_blank" rel="noreferrer">
                Paper<span className="external-link-icon" aria-hidden="true">↗</span>
              </a>
              <a href="https://github.com/rsdmu/aipi-pluralism-index" target="_blank" rel="noreferrer">
                Repo<span className="external-link-icon" aria-hidden="true">↗</span>
              </a>
              <Link href="/contribute">Contribute</Link>
              <Link href="/about">About</Link>
              <a href="https://www.therighttoai.com/" target="_blank" rel="noreferrer">
                The Right to AI<span className="external-link-icon" aria-hidden="true">↗</span>
              </a>
            </nav>
            <p className="footer-meta footer-legal">
              © {new Date().getFullYear()} AIPI. Code MIT; Data CC BY 4.0.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
