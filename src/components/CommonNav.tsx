import { NavLink } from 'react-router-dom';

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-white/10 text-white'
      : 'text-ink-500 hover:bg-white/5 hover:text-ink-100'
  }`;
}

export function CommonNav() {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/10 bg-ink-950/85 backdrop-blur-md"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-8">
        {/* Brand */}
        <span className="text-sm font-bold tracking-tight text-ink-100 select-none">
          Wakana Type
        </span>

        {/* Mode tabs */}
        <div className="flex items-center gap-1">
          <NavLink to="/practice" className={navLinkClass}>
            Practice
          </NavLink>
          <NavLink to="/arcade" className={navLinkClass}>
            Arcade
          </NavLink>
        </div>

        {/* Utility links */}
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `text-sm transition ${isActive ? 'text-ink-100' : 'text-ink-500 hover:text-ink-100'}`
          }
        >
          About
        </NavLink>
      </div>
    </nav>
  );
}
