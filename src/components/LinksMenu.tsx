'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { External, Link } from './icons';

export type MenuLink = { label: string; url: string };

/**
 * A small "extra reading" popover, shared by both sheets.
 *
 * Rendered through a portal with fixed positioning: the cards clip their overflow for
 * the rounded corners, so an in-flow menu under the last row of a group was cut off.
 * It flips above the button when there is no room below.
 */
export function LinksMenu({
  links,
  heading,
  ariaLabel,
}: {
  links: MenuLink[];
  heading: string;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const MENU_WIDTH = 288; // w-72
  const ROW_HEIGHT = 36;
  const GAP = 4;

  useLayoutEffect(() => {
    if (!open || !button.current) return;

    const place = () => {
      const rect = button.current!.getBoundingClientRect();
      const estimated = links.length * ROW_HEIGHT + 32;
      const spaceBelow = window.innerHeight - rect.bottom;
      const right = Math.max(8, window.innerWidth - rect.right);
      const clampedRight = Math.max(8, Math.min(right, window.innerWidth - MENU_WIDTH - 8));

      if (spaceBelow < estimated + GAP && rect.top > spaceBelow) {
        setPos({ bottom: window.innerHeight - rect.top + GAP, right: clampedRight });
      } else {
        setPos({ top: rect.bottom + GAP, right: clampedRight });
      }
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, links.length]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!button.current?.contains(target) && !menu.current?.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  if (links.length === 0) return null;

  return (
    <div className="relative shrink-0">
      <button
        ref={button}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`${links.length} ${links.length === 1 ? 'link' : 'links'}`}
        aria-label={ariaLabel}
        className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] transition hover:bg-white/[0.06] ${
          open ? 'text-[--color-accent-2]' : 'text-[--color-dim] hover:text-[--color-hi]'
        }`}
      >
        <Link size={13} />
        <span className="tnum">{links.length}</span>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            className="glass animate-rise fixed z-50 w-72 overflow-hidden rounded-xl p-1"
            style={pos}
          >
            <p className="px-2.5 pb-1 pt-1.5 text-[10px] uppercase tracking-wider text-[--color-dim]">
              {heading}
            </p>
            {links.map((link) => (
              <a
                key={link.url}
                role="menuitem"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-[--color-body] transition hover:bg-white/[0.05] hover:text-[--color-hi]"
              >
                <span className="truncate">{link.label}</span>
                <External size={11} className="shrink-0 text-[--color-dim]" />
              </a>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
