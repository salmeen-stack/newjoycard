'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface Guest { id:number; name:string; contact:string; channel:string; event_title:string; card_type?:string; scanned_at?:string; sent_via_email?:boolean; sent_via_whatsapp?:boolean; sms_token?:string; sms_used?:boolean }
interface EventItem { id:number; title:string }

export default function AdminGuests() {
  const [guests,  setGuests]  = useState<Guest[]>([])
  const [events,  setEvents]  = useState<EventItem[]>([])
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [g,e] = await Promise.all([
        fetch(filter!=='all'?`/api/guests?event_id=${filter}`:'/api/guests').then(r=>r.json()),
        fetch('/api/events').then(r=>r.json()),
      ])
      setGuests(g.guests||[]); setEvents(e.events||[])
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[filter])

  async function del(id:number) {
    if (!confirm('Delete guest?')) return
    const r = await fetch(`/api/guests/${id}`,{method:'DELETE'})
    r.ok ? (toast.success('Deleted'), load()) : toast.error('Failed')
  }

  const shown = guests.filter(g=>g.name.toLowerCase().includes(search.toLowerCase())||g.contact.includes(search))

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-6 sm:mb-10">
        <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Admin</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cream">All Guests</h1>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or contact…" className="input sm:max-w-xs" />
        <select className="input sm:max-w-xs" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">All Events</option>
          {events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
      </div>

      <div className="glass-gold overflow-x-auto">
        {loading ? <div className="p-8 text-center text-cream/30 text-sm">Loading…</div>
        : shown.length===0 ? (
          <div className="p-10 sm:p-16 text-center"><div className="empty-icon mx-auto"><i className="fa-solid fa-ticket text-gold/60"></i></div><p className="font-display text-lg text-cream">No guests found</p></div>
        ) : (
          <table className="table">
            <thead><tr><th>Guest</th><th>Event</th><th>Contact</th><th>Channel</th><th>Card</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {shown.map(g=>(
                <tr key={g.id}>
                  <td className="font-medium text-cream">{g.name}</td>
                  <td className="text-cream/45 text-xs">{g.event_title}</td>
                  <td className="text-cream/45 text-xs">{g.contact}</td>
                  <td><span className={`badge ${
                    g.channel==='email'?'badge-gold':
                    g.channel==='whatsapp'?'badge-teal':
                    'badge-amber-400'
                  }`}>{g.channel}</span></td>
                  <td><span className="badge badge-slate">{g.card_type||'—'}</span></td>
                  <td>
                    {g.scanned_at?<span className="badge badge-teal"><i className="fa-solid fa-check mr-1"></i>In</span>
                    :g.channel==='sms' && g.sms_token ? (
                      g.sms_used ? 
                        <span className="badge badge-teal"><i className="fa-solid fa-check mr-1"></i>Used</span>:
                        <span className="badge badge-amber-400"><i className="fa-solid fa-mobile-alt mr-1"></i>{g.sms_token}</span>
                    )
                    :g.sent_via_email||g.sent_via_whatsapp?<span className="badge badge-gold">Sent</span>
                    :<span className="badge badge-slate">Pending</span>}
                  </td>
                  <td><button onClick={()=>del(g.id)} className="text-cream/30 hover:text-rose-400 transition-colors text-sm">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
