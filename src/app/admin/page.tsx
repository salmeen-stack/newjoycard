'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import Link from 'next/link'

interface Stats {
  total_events: number; total_organizers: number; total_staff: number
  total_guests: number; invitations_sent: number; total_checked_in: number
}
interface EventStat {
  event_id: number; event_title: string; event_date: string
  total_guests: number; invitations_sent: number; checked_in: number
}

function Counter({ val }: { val: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let cur = 0; const step = Math.ceil(val / 40)
    const t = setInterval(() => {
      cur += step
      if (cur >= val) { setN(val); clearInterval(t) } else setN(cur)
    }, 25)
    return () => clearInterval(t)
  }, [val])
  return <>{n.toLocaleString()}</>
}

export default function AdminDashboard() {
  const [stats,      setStats]      = useState<Stats | null>(null)
  const [eventStats, setEventStats] = useState<EventStat[]>([])
  const [loading,    setLoading]    = useState(true)
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, role: string} | null>(null)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setStats(d.stats); setEventStats(d.eventStats) } })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) { setCurrentUser(d.user) } })
      .catch(() => {})
  }, [])

  const cards = stats ? [
    { label: 'Total Events',      value: stats.total_events,      icon: 'fa-calendar-days',  color: 'gold' },
    { label: 'Total Guests',      value: stats.total_guests,      icon: 'fa-ticket',          color: 'teal' },
    { label: 'Invitations Sent',  value: stats.invitations_sent,  icon: 'fa-paper-plane',     color: 'gold' },
    { label: 'Checked In',        value: stats.total_checked_in,  icon: 'fa-circle-check',    color: 'teal' },
    { label: 'Organizers',        value: stats.total_organizers,  icon: 'fa-user-tie',        color: 'gold' },
    { label: 'Staff Members',     value: stats.total_staff,       icon: 'fa-id-badge',        color: 'teal' },
  ] : []

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-6 sm:mb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Admin</p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cream">Dashboard</h1>
            <p className="text-cream/35 text-sm mt-1">{format(new Date(),'EEEE, MMMM d, yyyy')}</p>
          </div>
          {currentUser && (
            <div className="hidden md:block glass-gold px-4 py-2 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                  <i className="fa-solid fa-crown text-gold text-lg" />
                </div>
                <div>
                  <p className="text-cream font-medium">{currentUser.name}</p>
                  <p className="text-cream/60 text-sm">{currentUser.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {Array(6).fill(0).map((_,i)=><div key={i} className="stat-card h-28 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {cards.map((c,i)=>(
            <motion.div key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*.07}} className="stat-card">
              <div className={`stat-icon ${c.color==='teal'?'stat-icon-teal':'stat-icon-gold'}`}>
                <i className={`fa-solid ${c.icon}`} />
              </div>
              <div className={`font-display text-3xl font-bold mb-1 ${c.color==='teal'?'text-teal':'text-gold'}`}>
                <Counter val={c.value} />
              </div>
              <p className="text-cream/40 text-xs tracking-widest uppercase">{c.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="divider" />

      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 mt-8">
        <h2 className="font-display text-xl font-semibold text-cream">Recent Events</h2>
        <div className="flex gap-3">
          <Link href="/admin/events" className="text-gold/60 hover:text-gold text-sm transition-colors">View all <i className="fa-solid fa-arrow-right fa-icon-sm"/></Link>
          <Link href="/admin/verify-users" className="text-teal/60 hover:text-teal text-sm transition-colors">Verify Users <i className="fa-solid fa-arrow-right fa-icon-sm"/></Link>
        </div>
      </div>

      <div className="glass-gold overflow-x-auto">
        {loading ? <div className="p-8 text-center text-cream/30 text-sm">Loading…</div>
        : eventStats.length === 0 ? (
          <div className="p-10 sm:p-16 text-center">
            <div className="empty-icon mx-auto"><i className="fa-solid fa-calendar-days text-gold/60" /></div>
            <p className="font-display text-lg text-cream mb-1">No Events Yet</p>
            <p className="text-cream/35 text-sm mb-5">Create your first event to get started.</p>
            <Link href="/admin/events" className="btn-gold py-2 px-6 text-xs">Create Event</Link>
          </div>
        ) : (
          <table className="table">
            <thead><tr><th>Event</th><th>Date</th><th>Guests</th><th>Sent</th><th>Checked In</th><th>Progress</th></tr></thead>
            <tbody>
              {eventStats.map(ev => {
                const pct = ev.total_guests > 0 ? Math.round((ev.checked_in/ev.total_guests)*100) : 0
                return (
                  <tr key={ev.event_id}>
                    <td className="font-medium text-cream">{ev.event_title}</td>
                    <td className="text-cream/50">{format(new Date(ev.event_date),'MMM d, yyyy')}</td>
                    <td><span className="badge badge-slate">{ev.total_guests}</span></td>
                    <td><span className="badge badge-gold">{ev.invitations_sent}</span></td>
                    <td><span className="badge badge-teal">{ev.checked_in}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-teal rounded-full" style={{width:`${pct}%`}} />
                        </div>
                        <span className="text-cream/35 text-xs">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
