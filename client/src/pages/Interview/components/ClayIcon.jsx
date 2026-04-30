import { cn } from '~/lib/utils';

// Lightweight “premium clay” look without adding image assets.
// If you later add real 3D clay icons (PNG/WebP), swap this to render <img>.
const ClayIcon = ({
  className,
  size = 44,
  tint = 'blue',
  children,
  ...props
}) => {
  const tints = {
    blue: 'from-sky-400/90 via-blue-500/80 to-indigo-600/80',
    violet: 'from-violet-400/90 via-fuchsia-500/70 to-indigo-600/80',
    emerald: 'from-emerald-400/90 via-teal-500/70 to-cyan-600/70',
    amber: 'from-amber-300/95 via-orange-500/70 to-rose-500/70',
    neutral: 'from-neutral-200/40 via-neutral-400/20 to-neutral-700/20',
  };

  return (
    <div
      className={cn(
        'relative grid place-items-center rounded-[18px]',
        'ring-1 ring-white/10',
        'shadow-[0_18px_40px_rgba(0,0,0,0.55)]',
        'bg-gradient-to-br',
        tints[tint] || tints.blue,
        className
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-[radial-gradient(120%_120%_at_25%_15%,rgba(255,255,255,0.55),transparent_55%),radial-gradient(120%_120%_at_65%_90%,rgba(0,0,0,0.35),transparent_60%)]" />
      <div className="pointer-events-none absolute -top-3 -right-3 h-10 w-10 rounded-full bg-white/10 blur-2xl" />
      <div className="relative text-white/95 drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)]">
        {children}
      </div>
    </div>
  );
};

export default ClayIcon;
