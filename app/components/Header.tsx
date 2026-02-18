'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/agent', label: 'Agent' },
  { href: '/', label: 'Home' },
  { href: '/artifacts', label: 'Artifacts' },
  { href: '/approvals', label: 'Approvals' },
  { href: '/queue', label: 'Queue' },
  { href: '/dispatch', label: 'Dispatch' },
  { href: '/runs', label: 'Runs' },
  { href: '/memory', label: 'Memory' },
  { href: '/policies', label: 'Policies' },
  { href: '/settings', label: 'Settings' },
  { href: '/about', label: 'About' },
]

export default function Header() {
  const pathname = usePathname()
  if (pathname?.startsWith('/agent')) {
    return null
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/agent" className="text-xl font-bold text-gray-900">Diviora Console</Link>
          </div>
          <nav className="flex space-x-8 items-center">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-b-2 border-blue-500 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('diviora:toggle-copilot'))}
              className="ml-4 p-2 text-gray-400 hover:text-blue-600 transition-colors relative group"
              title="Toggle Copilot"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
