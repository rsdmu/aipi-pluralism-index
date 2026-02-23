'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function isOverview(pathname: string): boolean {
  return pathname === '/';
}

function isProviders(pathname: string): boolean {
  return pathname === '/aipi/providers' || pathname.startsWith('/aipi/provider/');
}

function isAbout(pathname: string): boolean {
  return pathname === '/about';
}

function isContribute(pathname: string): boolean {
  return pathname === '/contribute';
}

export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <div className="header-actions">
      <nav className="nav" aria-label="Main">
        <Link href="/" className={isOverview(pathname) ? 'active' : ''} aria-current={isOverview(pathname) ? 'page' : undefined}>
          Overview
        </Link>
        <Link
          href="/aipi/providers"
          className={isProviders(pathname) ? 'active' : ''}
          aria-current={isProviders(pathname) ? 'page' : undefined}
        >
          Providers
        </Link>
        <Link href="/about" className={isAbout(pathname) ? 'active' : ''} aria-current={isAbout(pathname) ? 'page' : undefined}>
          About
        </Link>
        <Link
          href="/contribute"
          className={isContribute(pathname) ? 'active' : ''}
          aria-current={isContribute(pathname) ? 'page' : undefined}
        >
          Contribute
        </Link>
      </nav>
    </div>
  );
}
