import { useState } from "react"

const navigationItems = [
  { label: "Home", href: "#home" },
  { label: "My tasks", href: "#tasks" },
  { label: "Projects", href: "#projects" },
]

const Navbar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false)
  const closeMenu = () => setIsOpen(false)

  return (
    <header className="relative z-20 bg-slate-50 px-6 sm:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between border-b border-slate-200 py-5">
        <a href="#home" className="flex items-center gap-3" aria-label="TaskiFy home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 6h11M9 12h11M9 18h11" />
              <path d="m3.5 6 .8.8L6 5M3.5 12l.8.8L6 11M3.5 18l.8.8L6 17" />
            </svg>
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight text-slate-900">
              TaskiFy
            </span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              YOUR TASK WORKSPACE
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Main navigation">
          {navigationItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              {item.label}
            </a>
          ))}
          <span className="max-w-32 truncate text-sm font-medium text-slate-600">
            {user?.name || user?.email}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Sign out
          </button>
        </nav>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-700 md:hidden"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {isOpen ? (
              <path d="m18 6-12 12M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isOpen && (
        <nav
          id="mobile-navigation"
          className="absolute inset-x-0 top-full border-b border-slate-200 bg-white px-6 pb-6 pt-3 shadow-lg md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navigationItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {item.label}
              </a>
            ))}
            <span className="px-3 py-3 text-sm font-medium text-slate-600">
              {user?.name || user?.email}
            </span>
            <button
              type="button"
              onClick={() => {
                closeMenu()
                onLogout()
              }}
              className="mt-2 rounded-full bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white"
            >
              Sign out
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}

export default Navbar
