type IconProps = { className?: string; size?: number };

function Svg({
  className,
  size = 16,
  children,
  fill = 'none',
}: IconProps & { children: React.ReactNode; fill?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Star = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.4l6.1-.9L12 3Z" />
  </Svg>
);

export const Note = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Svg {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H16l4 4v13.5a1.5 1.5 0 0 1-1.5 1.5h-12A2.5 2.5 0 0 1 4 19.5v-14Z" />
    <path d="M15 3v5h5" />
    {filled && <path d="M8.5 13h7M8.5 17h4.5" />}
  </Svg>
);

export const Check = (p: IconProps) => (
  <Svg {...p} size={p.size ?? 12}>
    <path className="check-path" d="M4 12.5 9 17.5 20 6.5" strokeWidth="3" />
  </Svg>
);

export const Chevron = ({ open, ...p }: IconProps & { open?: boolean }) => (
  <Svg {...p}>
    <path
      d="m9 6 6 6-6 6"
      style={{
        transformOrigin: '12px 12px',
        transform: open ? 'rotate(90deg)' : 'none',
        transition: 'transform 200ms ease',
      }}
    />
  </Svg>
);

export const Search = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

export const Dice = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </Svg>
);

export const Keyboard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="6" width="20" height="12" rx="2.5" />
    <path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8 14h8" />
  </Svg>
);

export const Expand = ({ open, ...p }: IconProps & { open?: boolean }) =>
  open ? (
    <Svg {...p}>
      <path d="M8 4 4 8m0-4 4 4M16 20l4-4m0 4-4-4" />
      <path d="M4 4h4v4M20 20h-4v-4" />
    </Svg>
  ) : (
    <Svg {...p}>
      <path d="M4 10V4h6M20 14v6h-6" />
      <path d="m4 4 6 6m10 10-6-6" />
    </Svg>
  );

export const External = (p: IconProps) => (
  <Svg {...p} size={p.size ?? 12}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Svg>
);

export const X = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const Logout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
    <path d="M10 8 6 12l4 4M6 12h9" />
  </Svg>
);
