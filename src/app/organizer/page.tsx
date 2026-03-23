'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import Link from 'next/link'

interface Asgn { id:number; event_id:number; event_title:string; event_date:string; event_location:string; guest_limit:number; guests_added:number }

interface Event { id:number; title:string; date:string; location:string; description:string|null }

export default function OrganizerDashboard() {
  const [asgns,   setAsgns]   = useState<Asgn[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [showEditEvent, setShowEditEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, role: string} | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  
  // Event templates for quick setup
  const eventTemplates = [
    {
      name: 'Corporate Event',
      defaults: { guest_limit: 100, location: 'Conference Center', description: 'Professional corporate gathering' }
    },
    {
      name: 'Wedding',
      defaults: { guest_limit: 150, location: 'Wedding Venue', description: 'Beautiful wedding celebration' }
    },
    {
      name: 'Birthday Party',
      defaults: { guest_limit: 50, location: 'Party Venue', description: 'Fun birthday celebration' }
    },
    {
      name: 'Casual Gathering',
      defaults: { guest_limit: 30, location: 'Community Center', description: 'Relaxed get-together' }
    }
  ]

  useEffect(()=>{
    fetch('/api/admin/assignments')
      .then(r=>r.ok?r.json():null)
      .then(d=>setAsgns(d?.assignments||[]))
      .catch(console.error)
      .finally(()=>setLoading(false))
  },[])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) { setCurrentUser(d.user) } })
      .catch(() => {})
  }, [])

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-6 sm:mb-10">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Organizer</p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cream">My Events</h1>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden md:block glass-gold px-4 py-2 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                    <i className="fa-solid fa-user text-gold text-lg"></i>
                  </div>
                  <div>
                    <p className="text-cream font-medium">{currentUser.name}</p>
                    <p className="text-cream/60 text-sm">{currentUser.email}</p>
                  </div>
                </div>
              </div>
            )}
            <button 
              onClick={() => setShowTemplates(true)}
              className="btn-ghost text-sm px-4 py-2"
            >
              <i className="fa-solid fa-layer-group mr-2"></i>Templates
            </button>
            <button 
              onClick={() => setShowCreateEvent(true)}
              className="btn-gold text-sm px-4 py-2"
            >
              + Create Event
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Dashboard */}
      {!loading && asgns.length > 0 && (
        <motion.div 
          initial={{opacity:0, y:20}} 
          animate={{opacity:1, y:0}} 
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass-gold p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-2">
              <i className="fa-solid fa-calendar text-gold"></i>
            </div>
            <p className="text-cream font-display text-2xl font-bold">{asgns.length}</p>
            <p className="text-cream/25 text-xs">Total Events</p>
          </div>
          
          <div className="glass-gold p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-teal/20 flex items-center justify-center mx-auto mb-2">
              <i className="fa-solid fa-users text-teal"></i>
            </div>
            <p className="text-cream font-display text-2xl font-bold">
              {asgns.reduce((sum, a) => sum + a.guests_added, 0)}
            </p>
            <p className="text-cream/25 text-xs">Total Guests</p>
          </div>
          
          <div className="glass-gold p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-2">
              <i className="fa-solid fa-user-check text-gold"></i>
            </div>
            <p className="text-cream font-display text-2xl font-bold">
              {asgns.reduce((sum, a) => sum + a.guest_limit, 0)}
            </p>
            <p className="text-cream/25 text-xs">Total Capacity</p>
          </div>
          
          <div className="glass-gold p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-teal/20 flex items-center justify-center mx-auto mb-2">
              <i className="fa-solid fa-chart-pie text-teal"></i>
            </div>
            <p className="text-cream font-display text-2xl font-bold">
              {Math.round((asgns.reduce((sum, a) => sum + a.guests_added, 0) / asgns.reduce((sum, a) => sum + a.guest_limit, 0)) * 100)}%
            </p>
            <p className="text-cream/25 text-xs">Avg Fill Rate</p>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{Array(2).fill(0).map((_,i)=><div key={i} className="glass-gold p-6 h-48 animate-pulse" />)}</div>
      ) : asgns.length===0 ? (
        <div className="glass-gold p-10 sm:p-16 text-center">
          <div className="empty-icon mx-auto"><i className="fa-solid fa-calendar-star text-gold/60"></i></div>
          <h3 className="font-display text-xl text-cream mb-2">Create Your First Event</h3>
          <p className="text-cream/35 text-sm mb-6">Start by creating an event and you'll be automatically assigned to manage it.</p>
          <button 
            onClick={() => setShowCreateEvent(true)}
            className="btn-gold"
          >
            Create Event
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {asgns.map((a,i)=>{
            const pct       = a.guest_limit>0 ? Math.round((a.guests_added/a.guest_limit)*100) : 0
            const remaining = a.guest_limit - a.guests_added
            return (
              <motion.div key={a.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*.1}} className="glass-gold p-5 sm:p-6">
                <h3 className="font-display text-xl font-semibold text-cream mb-1">{a.event_title}</h3>
                <p className="text-gold/65 text-sm">{format(new Date(a.event_date),'MMM d, yyyy · h:mm a')}</p>
                <p className="text-cream/30 text-xs mt-0.5 mb-4">{a.event_location}</p>
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-cream/45">Guest slots used</span>
                    <span className="text-gold">{a.guests_added} / {a.guest_limit}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full transition-all" style={{width:`${pct}%`}} />
                  </div>
                  <p className="text-cream/25 text-xs mt-1">{remaining} slot{remaining!==1?'s':''} remaining</p>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <Link href={`/organizer/guests?event=${a.event_id}`} className="btn-gold text-center py-2.5 text-xs">Guests</Link>
                  <Link href={`/organizer/send?event=${a.event_id}`} className="btn-ghost text-center py-2.5 text-xs">Send</Link>
                  <button 
                    onClick={() => {
                      setEditingEvent({
                        id: a.event_id,
                        title: a.event_title,
                        date: a.event_date,
                        location: a.event_location,
                        description: null
                      })
                      setShowEditEvent(true)
                    }}
                    className="btn-ghost text-center py-2.5 text-xs"
                  >
                    Edit
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
      
      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-navy-900/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div 
            initial={{opacity:0}} 
            animate={{opacity:1}} 
            className="glass-gold p-6 sm:p-8 max-w-md w-full max-h-[90dvh] overflow-y-auto"
          >
            <h2 className="font-display text-2xl text-cream mb-6">Create New Event</h2>
            
            <form 
              id="create-event-form"
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const title = formData.get('title') as string
                const date = formData.get('date') as string
                const location = formData.get('location') as string
                const description = formData.get('description') as string
                const guest_limit = parseInt(formData.get('guest_limit') as string) || 50
                
                try {
                  const res = await fetch('/api/events', {
                    method: 'POST',
                    body: JSON.stringify({ title, date, location, description, guest_limit }),
                    headers: { 'Content-Type': 'application/json' }
                  })
                  
                  if (res.ok) {
                    const data = await res.json()
                    console.log('Event created:', data)
                    alert(`Event "${title}" created successfully! You've been automatically assigned to manage this event with a guest limit of ${guest_limit}.`)
                    setShowCreateEvent(false)
                    // Refresh assignments
                    const assignRes = await fetch('/api/admin/assignments')
                    const assignData = await assignRes.json()
                    setAsgns(assignData.assignments || [])
                  } else {
                    const error = await res.json()
                    alert('Failed to create event: ' + error.error)
                  }
                } catch (error) {
                  console.error('Error creating event:', error)
                  alert('Failed to create event')
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="label">Event Title</label>
                <input 
                  name="title" 
                  type="text" 
                  required 
                  className="input"
                  placeholder="Wedding Reception"
                />
              </div>
              
              <div>
                <label className="label">Event Date</label>
                <input 
                  name="date" 
                  type="datetime-local" 
                  required 
                  className="input"
                />
              </div>
              
              <div>
                <label className="label">Location</label>
                <input 
                  name="location" 
                  type="text" 
                  required 
                  className="input"
                  placeholder="Grand Ballroom"
                />
              </div>
              
              <div>
                <label className="label">Guest Limit</label>
                <input 
                  name="guest_limit" 
                  type="number" 
                  min="1"
                  max="500"
                  defaultValue="50"
                  className="input"
                  placeholder="50"
                />
              </div>
              
              <div>
                <label className="label">Description</label>
                <textarea 
                  name="description" 
                  rows={3}
                  className="input resize-none"
                  placeholder="Event details..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  className="btn-gold flex-1"
                >
                  Create Event
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateEvent(false)}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      
      {/* Edit Event Modal */}
      {showEditEvent && editingEvent && (
        <div className="fixed inset-0 bg-navy-900/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div 
            initial={{opacity:0}} 
            animate={{opacity:1}} 
            className="glass-gold p-6 sm:p-8 max-w-md w-full max-h-[90dvh] overflow-y-auto"
          >
            <h2 className="font-display text-2xl text-cream mb-6">Edit Event</h2>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const title = formData.get('title') as string
                const date = formData.get('date') as string
                const location = formData.get('location') as string
                const description = formData.get('description') as string
                
                try {
                  const res = await fetch('/api/events', {
                    method: 'PUT',
                    body: JSON.stringify({ id: editingEvent.id, title, date, location, description }),
                    headers: { 'Content-Type': 'application/json' }
                  })
                  
                  if (res.ok) {
                    const data = await res.json()
                    console.log('Event updated:', data)
                    alert(`Event "${title}" updated successfully!`)
                    setShowEditEvent(false)
                    setEditingEvent(null)
                    // Refresh assignments
                    const assignRes = await fetch('/api/admin/assignments')
                    const assignData = await assignRes.json()
                    setAsgns(assignData.assignments || [])
                  } else {
                    const error = await res.json()
                    alert('Failed to update event: ' + error.error)
                  }
                } catch (error) {
                  console.error('Error updating event:', error)
                  alert('Failed to update event')
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="label">Event Title</label>
                <input 
                  name="title" 
                  type="text" 
                  required 
                  className="input"
                  defaultValue={editingEvent.title}
                />
              </div>
              
              <div>
                <label className="label">Event Date</label>
                <input 
                  name="date" 
                  type="datetime-local" 
                  required 
                  className="input"
                  defaultValue={editingEvent.date.replace('Z', '')}
                />
              </div>
              
              <div>
                <label className="label">Location</label>
                <input 
                  name="location" 
                  type="text" 
                  required 
                  className="input"
                  defaultValue={editingEvent.location}
                />
              </div>
              
              <div>
                <label className="label">Description</label>
                <textarea 
                  name="description" 
                  rows={3}
                  className="input resize-none"
                  placeholder="Event details..."
                  defaultValue={editingEvent.description || ''}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  className="btn-gold flex-1"
                >
                  Update Event
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditEvent(false)
                    setEditingEvent(null)
                  }}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-navy-900/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div 
            initial={{opacity:0}} 
            animate={{opacity:1}} 
            className="glass-gold p-6 sm:p-8 max-w-2xl w-full max-h-[90dvh] overflow-y-auto"
          >
            <h2 className="font-display text-2xl text-cream mb-6">Event Templates</h2>
            <p className="text-cream/40 text-sm mb-6">Choose a template to quickly create your event with pre-filled details.</p>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {eventTemplates.map((template, index) => (
                <motion.div
                  key={template.name}
                  initial={{opacity:0, y:20}}
                  animate={{opacity:1, y:0}}
                  transition={{delay: index * 0.1}}
                  className="glass-gold p-4 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => {
                    setShowTemplates(false)
                    setShowCreateEvent(true)
                    // Pre-fill form with template defaults
                    setTimeout(() => {
                      const form = document.querySelector('#create-event-form') as HTMLFormElement
                      if (form) {
                        form.guest_limit.value = template.defaults.guest_limit
                        form.location.value = template.defaults.location
                        form.description.value = template.defaults.description
                      }
                    }, 100)
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                      <i className={`fa-solid ${
                        template.name === 'Corporate Event' ? 'fa-building' :
                        template.name === 'Wedding' ? 'fa-heart' :
                        template.name === 'Birthday Party' ? 'fa-gift' :
                        'fa-users'
                      } text-gold`}></i>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-cream">{template.name}</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-cream/60">Guest Limit:</span>
                      <span className="text-cream">{template.defaults.guest_limit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cream/60">Location:</span>
                      <span className="text-cream">{template.defaults.location}</span>
                    </div>
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-cream/40 text-xs">{template.defaults.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowTemplates(false)}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowTemplates(false)
                  setShowCreateEvent(true)
                }}
                className="btn-gold flex-1"
              >
                Create Custom Event
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
