import { NavLink } from 'react-router-dom';

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-moss text-cream'
      : 'text-sage hover:bg-sand/60 hover:text-bark'
  }`;
}

export function CommonNav() {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-moss/20 bg-cream/85 backdrop-blur-md"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-8">
        {/* Brand */}
        <span className="text-sm font-bold tracking-tight text-bark select-none">
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
          <NavLink to="/sentences" className={navLinkClass}>
            Sentences
          </NavLink>
          <NavLink to="/kana" className={navLinkClass}>
            Chart
          </NavLink>
        </div>

        {/* Utility links */}
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `text-sm transition ${isActive ? 'text-bark' : 'text-sage hover:text-bark'}`
          }
        >
          About
        </NavLink>
      </div>
    </nav>
  );
}
