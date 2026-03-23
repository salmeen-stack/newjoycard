'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * MobileToggle — renders only on mobile (<768px).
 * Shows a sticky header with the joycard logo and a hamburger
 * button that slides the sidebar in/out (pure CSS class toggle,
 * no business logic changes).
 */
export default function MobileToggle({ role }: { role: 'admin' | 'organizer' | 'staff' }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const sidebar = document.querySelector('aside.jc-sidebar')
    if (!sidebar) return
    if (open) {
      sidebar.classList.add('mobile-open')
    } else {
      sidebar.classList.remove('mobile-open')
    }
  }, [open])

  // Close sidebar when clicking the backdrop (the box-shadow overlay area)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const sidebar = document.querySelector('aside.jc-sidebar')
      if (!sidebar) return
      if (open && !sidebar.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on route change (link click inside sidebar)
  useEffect(() => {
    const sidebar = document.querySelector('aside.jc-sidebar')
    if (!sidebar) return
    function handleAnchor() { setOpen(false) }
    const links = sidebar.querySelectorAll('a')
    links.forEach(a => a.addEventListener('click', handleAnchor))
    return () => links.forEach(a => a.removeEventListener('click', handleAnchor))
  }, [])

  const roleLabel =
    role === 'admin'     ? <><i className="fa-solid fa-crown text-gold mr-1.5"/>Admin</>
    : role === 'organizer' ? <><i className="fa-solid fa-envelope text-teal mr-1.5"/>Organizer</>
    :                        <><i className="fa-solid fa-id-badge text-cream/50 mr-1.5"/>Staff</>

  return (
    <header className="jc-mobile-header">
      <button
        className={`jc-hamburger${open ? ' open' : ''}`}
        onClick={() => {
          console.log('Hamburger clicked, current state:', open)
          setOpen(o => !o)
        }}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        style={{ zIndex: 9999, position: 'relative' }}
      >
        <span />
        <span />
        <span />
      </button>

      <Link href="/">
        <span className="font-display text-lg text-gold font-semibold tracking-widest">joycard</span>
      </Link>

      <span className="text-xs text-cream/40 tracking-widest flex items-center">{roleLabel}</span>
    </header>
  )
}
