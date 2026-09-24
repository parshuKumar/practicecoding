'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/sheet', label: 'DSA' },
  { href: '/system-design', label: 'System Design' },
];

/** The two sheets. Plain links, so a tab switch is a normal server-rendered page load. */
export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Sheets" className="flex rounded-lg border border-[--color-line] bg-[--color-surface] p-0.5">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-3 py-1 text-[13px] font-medium transition ${
              active
                ? 'bg-[--color-raised] text-[--color-hi] shadow-sm'
                : 'text-[--color-dim] hover:text-[--color-body]'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
