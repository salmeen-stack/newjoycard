'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

type Role = 'admin' | 'organizer' | 'staff'

const NAV: Record<Role, { href: string; label: string; icon: string }[]> = {
  admin: [
    { href:'/admin',             label:'Dashboard',   icon:'fa-gauge-high' },
    { href:'/admin/events',      label:'Events',      icon:'fa-calendar-days' },
    { href:'/admin/users',       label:'Users',       icon:'fa-users' },
    { href:'/admin/assignments', label:'Assignments', icon:'fa-link' },
    { href:'/admin/guests',      label:'Guests',      icon:'fa-ticket' },
    { href:'/admin/analytics',   label:'Analytics',   icon:'fa-chart-bar' },
  ],
  organizer: [
    { href:'/organizer',           label:'My Events',    icon:'fa-calendar-days' },
    { href:'/organizer/analytics', label:'Analytics',    icon:'fa-chart-bar' },
    { href:'/organizer/reports',   label:'Reports',      icon:'fa-chart-line' },
    { href:'/organizer/templates', label:'Templates',    icon:'fa-file-lines' },
    { href:'/organizer/guests',    label:'Guests',       icon:'fa-ticket' },
    { href:'/organizer/send',      label:'Send Invites', icon:'fa-paper-plane' },
  ],
  staff: [
    { href:'/staff',      label:'My Events',  icon:'fa-calendar-days' },
    { href:'/staff/scan', label:'QR Scanner', icon:'fa-qrcode' },
    { href:'/staff/tracking', label:'Event Tracking', icon:'fa-chart-line' },
  ],
}

const BADGE: Record<Role, string> = {
  admin:'badge-gold', organizer:'badge-teal', staff:'badge-slate',
}

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname()
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [logginOut, setLoggingOut] = useState(false)

  // Set initial collapsed state based on screen size
  useEffect(() => {
    const isMobile = window.innerWidth < 768
    setCollapsed(isMobile)
  }, [])

  // Listen for mobile-open changes to sync collapsed state
  useEffect(() => {
    const sidebar = document.querySelector('aside.jc-sidebar')
    if (!sidebar) return

    const observer = new MutationObserver(() => {
      const isMobileOpen = sidebar.classList.contains('mobile-open')
      // When mobile opens, uncollapse the sidebar
      if (isMobileOpen && collapsed) {
        setCollapsed(false)
      }
    })

    observer.observe(sidebar, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })

    return () => observer.disconnect()
  }, [collapsed])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) { setName(d.user.name); setEmail(d.user.email) } })
      .catch(() => {})
  }, [])

  async function logout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Signed out')
    window.location.href = role === 'admin' ? '/admin/login' : '/login'
  }

  const items = NAV[role]

  return (
    <motion.aside initial={{x:-20,opacity:0}} animate={{x:0,opacity:1}}
      className={`jc-sidebar flex flex-col h-screen sticky top-0 bg-navy-800/60 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ${collapsed?'w-16':'w-64'}`}>

      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
        {!collapsed && <Link href="/"><span className="font-display text-lg text-gold font-semibold tracking-widest">joycard</span></Link>}
        <button onClick={()=>setCollapsed(c=>!c)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-cream/35 hover:text-cream transition-colors ml-auto text-xs">
          {collapsed?<i className="fa-solid fa-chevron-right fa-icon-sm"/>:<i className="fa-solid fa-chevron-left fa-icon-sm"/>}
        </button>
      </div>

      {/* Badge */}
      {!collapsed && (
        <div className="px-5 pt-4 pb-1">
          <span className={`badge text-xs ${BADGE[role]}`}>{role.charAt(0).toUpperCase()+role.slice(1)}</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {items.map(item => {
          const active = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} title={collapsed?item.label:undefined}
              className={`nav-link ${active?'active':''} ${collapsed?'justify-center px-0':''}`}>
              <i className={`fa-solid ${item.icon} fa-icon-nav`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-white/5 p-4">
        {!collapsed && name && (
          <div className="mb-3 px-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <i className="fa-solid fa-user text-gold" />
              </div>
              <div>
                <p className="text-cream/80 text-sm font-medium truncate">{name}</p>
                <p className="text-cream/30 text-xs truncate">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-1">
              <span className={`badge text-xs ${BADGE[role]}`}>
                {role === 'admin' ? 'Administrator' : 
                 role === 'organizer' ? 'Organizer' : 'Staff Member'}
              </span>
            </div>
          </div>
        )}
        <button onClick={logout} disabled={logginOut}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-cream/35 hover:text-rose-400 hover:bg-rose-400/8 transition-all ${collapsed?'justify-center':''}`}>
          <span><i className="fa-solid fa-right-from-bracket fa-icon-sm" /></span>
          {!collapsed && <span>{logginOut?'Signing out…':'Sign Out'}</span>}
        </button>
      </div>
    </motion.aside>
  )
}
