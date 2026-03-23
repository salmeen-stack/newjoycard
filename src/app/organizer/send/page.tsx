'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

interface Guest { id:number; name:string; contact:string; channel:string; card_type?:string; inv_id?:number; qr_token?:string; card_url?:string; sent_via_email?:boolean; sent_via_whatsapp?:boolean; scanned_at?:string }
interface Asgn  { event_id:number; event_title:string }

function Content() {
  const sp = useSearchParams()
  const [selEvent, setSelEvent] = useState(sp.get('event')||'')
  const [guests,   setGuests]   = useState<Guest[]>([])
  const [asgns,    setAsgns]    = useState<Asgn[]>([])
  const [loading,  setLoading]  = useState(true)
  const [active,   setActive]   = useState<Guest|null>(null)
  const [cardUrl,  setCardUrl]  = useState('')
  const [preview,  setPreview]  = useState('')
  const [sending,  setSending]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'not-sent'>('all')
  const [selectedGuests, setSelectedGuests] = useState<number[]>([])
  const [bulkAction, setBulkAction] = useState<'send' | 'resend' | null>(null)
  const [bulkSending, setBulkSending] = useState(false)
  const [showBulkCardUpload, setShowBulkCardUpload] = useState(false)
  const [bulkCardUrl, setBulkCardUrl] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [g,a] = await Promise.all([
        fetch(selEvent?`/api/guests?event_id=${selEvent}`:'/api/guests').then(r=>r.json()),
        fetch('/api/admin/assignments').then(r=>r.json()),
      ])
      setGuests(g.guests||[]); setAsgns(a.assignments||[])
    } catch { toast.error('Failed') } finally { setLoading(false) }
  },[selEvent])

  // Filter guests based on search and status
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = searchTerm === '' || 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.contact.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'sent' && (guest.sent_via_email || guest.sent_via_whatsapp)) ||
      (filterStatus === 'not-sent' && !guest.sent_via_email && !guest.sent_via_whatsapp)
    
    return matchesSearch && matchesStatus
  })

  const handleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([])
    } else {
      setSelectedGuests(filteredGuests.map(g => g.id))
    }
  }

  const handleSelectGuest = (guestId: number) => {
    setSelectedGuests(prev => 
      prev.includes(guestId) 
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    )
  }

  const handleBulkSend = async (action: 'send' | 'resend') => {
    if (selectedGuests.length === 0) {
      toast.error('Please select guests to send invitations')
      return
    }
    
    // Check if any guests need cards and no bulk card uploaded
    const guestsNeedingCards = selectedGuests.map(guestId => {
      const guest = guests.find(g => g.id === guestId)
      return guest
    }).filter(guest => guest && !guest.card_url)
    
    if (guestsNeedingCards.length > 0 && !bulkCardUrl) {
      toast.error(`${guestsNeedingCards.length} guest${guestsNeedingCards.length !== 1 ? 's' : ''} need${guestsNeedingCards.length !== 1 ? '' : 's'} a card. Please upload a card first.`)
      setShowBulkCardUpload(true)
      return
    }
    
    setBulkSending(true)
    try {
      const promises = selectedGuests.map(async (guestId) => {
        const guest = guests.find(g => g.id === guestId)
        if (!guest || !guest.inv_id) return
        
        // Use bulk card if uploaded, otherwise use guest's existing card
        const cardToSend = bulkCardUrl || guest.card_url
        
        const response = await fetch('/api/invitations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invitation_id: guest.inv_id,
            card_url: cardToSend,
            send_email: guest.channel === 'email',
            send_whatsapp: guest.channel === 'whatsapp'
          })
        })
        
        return response.ok
      })
      
      const results = await Promise.all(promises)
      const successCount = results.filter(r => r).length
      
      toast.success(`${action === 'send' ? 'Invitations sent' : 'Invitations resent'} to ${successCount}/${selectedGuests.length} guests`)
      setSelectedGuests([])
      setBulkCardUrl('') // Clear bulk card after successful send
      load()
    } catch (error) {
      toast.error(`Failed to ${action === 'send' ? 'send' : 'resend'} bulk invitations`)
    } finally {
      setBulkSending(false)
    }
  }

  // Quick action: Send to all unsent guests
  const handleSendToAllUnsent = async () => {
    const unsentGuests = guests.filter(g => !g.sent_via_email && !g.sent_via_whatsapp)
    if (unsentGuests.length === 0) {
      toast.error('No unsent guests found')
      return
    }
    
    setBulkSending(true)
    try {
      const promises = unsentGuests.map(async (guest) => {
        if (!guest.inv_id) return
        
        const response = await fetch('/api/invitations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invitation_id: guest.inv_id,
            card_url: cardUrl || guest.card_url,
            send_email: guest.channel === 'email',
            send_whatsapp: guest.channel === 'whatsapp'
          })
        })
        
        return response.ok
      })
      
      const results = await Promise.all(promises)
      const successCount = results.filter(r => r).length
      
      toast.success(`Invitations sent to ${successCount}/${unsentGuests.length} unsent guests`)
      load()
    } catch (error) {
      toast.error('Failed to send invitations')
    } finally {
      setBulkSending(false)
    }
  }
  useEffect(()=>{ load() },[load])

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    
    if (!file || !active) {
      return
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    
    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be less than 20MB')
      return
    }
    
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/invitations/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Upload failed')
        return
      }
      
      const result = await response.json()
      setCardUrl(result.url)
      setPreview(result.url)
      toast.success('Card uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [active])

  async function send(email:boolean, wa:boolean) {
    if (!active?.inv_id) { toast.error('No invitation found'); return }
    setSending(true)
    try {
      const r = await fetch('/api/invitations',{
        method:'PUT', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ invitation_id:active.inv_id, card_url:cardUrl||active.card_url, send_email:email, send_whatsapp:wa }),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d.error); return }
      if (wa && d.whatsappLink) { window.open(d.whatsappLink,'_blank'); toast.success('WhatsApp opened!') }
      if (email && d.emailSent)  toast.success('Email sent!')
      if (email && !d.emailSent) toast.error('Email failed — check Gmail config')
      setActive(null); setCardUrl(''); setPreview(''); load()
    } finally { setSending(false) }
  }

  // Force production URL for debugging
  const base = 'https://newjoycard-six.vercel.app'
  
  // Debug logging (remove in production)
  if (typeof window !== 'undefined') {
    console.log('Environment vars:', {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      finalBase: base
    })
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-6 sm:mb-10">
        <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Organizer</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cream">Send Invitations</h1>
      </motion.div>

      <div className="mb-6 w-full sm:max-w-xs">
        <label className="label">Select Event</label>
        <select className="input" value={selEvent} onChange={e=>setSelEvent(e.target.value)}>
          <option value="">All Events</option>
          {asgns.map(a=><option key={a.event_id} value={a.event_id}>{a.event_title}</option>)}
        </select>
      </div>

      {/* Smart Workflow Controls */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="label">Search Guests</label>
          <input 
            type="text" 
            className="input min-w-[200px]" 
            placeholder="Search by name or contact..."
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <label className="label">Status Filter</label>
          <select 
            className="input min-w-[150px]" 
            value={filterStatus}
            onChange={e=>setFilterStatus(e.target.value as any)}
          >
            <option value="all">All Guests</option>
            <option value="sent">Sent</option>
            <option value="not-sent">Not Sent</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          {selectedGuests.length > 0 && (
            <button 
              onClick={() => setShowBulkCardUpload(true)}
              className="btn-ghost text-sm py-2 px-4"
            >
              📷 Upload Card ({selectedGuests.length})
            </button>
          )}
          <button 
            onClick={handleSendToAllUnsent}
            disabled={bulkSending}
            className="btn-gold text-sm py-2 px-4 disabled:opacity-40"
          >
            {bulkSending ? 'Sending...' : '🚀 Send to All Unsent'}
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedGuests.length > 0 && (
        <motion.div 
          initial={{opacity:0, y:-10}} 
          animate={{opacity:1, y:0}} 
          className="glass-gold p-4 mb-6 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-cream font-medium">
              {selectedGuests.length} guest{selectedGuests.length !== 1 ? 's' : ''} selected
            </span>
            {bulkCardUrl && (
              <span className="text-xs text-gold bg-gold/10 px-2 py-1 rounded-full">
                <i className="fa-solid fa-image mr-1"></i>Card Ready
              </span>
            )}
            <button 
              onClick={handleSelectAll}
              className="btn-ghost text-sm py-1.5 px-3"
            >
              {selectedGuests.length === filteredGuests.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowBulkCardUpload(true)}
              className="btn-ghost text-sm py-1.5 px-3"
            >
              📷 Upload Card
            </button>
            <button 
              onClick={() => handleBulkSend('send')}
              disabled={bulkSending}
              className="btn-gold text-sm py-1.5 px-3 disabled:opacity-40"
            >
              {bulkSending ? 'Sending...' : '📧 Send Invitations'}
            </button>
            <button 
              onClick={() => handleBulkSend('resend')}
              disabled={bulkSending}
              className="btn-ghost text-sm py-1.5 px-3 disabled:opacity-40"
            >
              🔄 Resend
            </button>
            <button 
              onClick={() => setSelectedGuests([])}
              className="btn-ghost text-sm py-1.5 px-3"
            >
              ✕ Clear
            </button>
          </div>
        </motion.div>
      )}

      {/* Standalone Bulk Card Upload */}
      {selectedGuests.length === 0 && (
        <div className="glass-gold p-4 mb-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-cream font-medium">Bulk Card Upload</p>
              <p className="text-cream/60 text-sm">Upload a card to use for multiple guests</p>
            </div>
            <div className="flex items-center gap-2">
              {bulkCardUrl && (
                <span className="text-xs text-gold bg-gold/10 px-2 py-1 rounded-full">
                  <i className="fa-solid fa-image mr-1"></i>Card Ready
                </span>
              )}
              <button 
                onClick={() => setShowBulkCardUpload(true)}
                className="btn-ghost text-sm py-1.5 px-3"
              >
                📷 Upload Card
              </button>
            </div>
          </div>
        </div>
      )}

      {searchTerm && (
        <div className="mb-4">
          <p className="text-cream/35 text-sm">
            Found {filteredGuests.length} guest{filteredGuests.length !== 1 ? 's' : ''} matching "{searchTerm}"
          </p>
        </div>
      )}

      <AnimatePresence>
        {active && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-navy-900/80 backdrop-blur-sm">
            <motion.div initial={{scale:.95,y:20}} animate={{scale:1,y:0}} exit={{scale:.95}}
              className="glass-gold p-5 sm:p-8 w-full max-w-lg overflow-y-auto max-h-[90dvh]">
              <h2 className="font-display text-2xl font-semibold text-cream mb-1">Send Invitation</h2>
              <p className="text-cream/40 text-sm mb-6">To: <span className="text-gold">{active.name}</span> via <span className="text-teal">{active.channel}</span></p>

              <div className="mb-5">
                <label className="label">Invitation Card (optional)</label>
                {(preview||active.card_url) ? (
                  <div className="relative rounded-xl overflow-hidden border border-gold/20 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview||active.card_url} alt="Card" className="w-full max-h-48 object-cover" />
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setCardUrl('')
                        setPreview('')
                      }}
                      className="absolute top-2 right-2 bg-navy-900/80 text-cream/50 hover:text-rose-400 rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                      type="button"
                    ><i className="fa-solid fa-xmark"></i></button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-xl p-6 text-center">
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <label 
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex flex-col items-center gap-2 text-cream/60 hover:text-gold transition-colors"
                    >
                      <i className="fa-solid fa-camera fa-icon-xl text-cream/60"></i>
                      <span className="text-sm">
                        {uploading ? 'Uploading...' : 'Choose Image'}
                      </span>
                      <span className="text-xs opacity-50">
                        JPEG, PNG, WebP, GIF (max 20MB)
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {active.qr_token && (
                <div className="mb-5 p-3 bg-white/5 rounded-xl">
                  <p className="text-cream/25 text-xs uppercase tracking-widest mb-1">Invite Link</p>
                  <p className="text-teal text-xs break-all">{base}/invite/{active.qr_token}</p>
                </div>
              )}

              <div className="space-y-3">
                {active.channel==='email' && (
                  <button onClick={()=>send(true,false)} disabled={sending} className="btn-gold w-full">
                    {sending?'Sending…':<><i className="fa-solid fa-envelope mr-2"/>Send via Email</>}
                  </button>
                )}
                {active.channel==='whatsapp' && (
                  <button onClick={()=>send(false,true)} disabled={sending} className="btn-teal w-full">
                    {sending?'Opening…':<><i className="fa-brands fa-whatsapp mr-2"/>Open WhatsApp</>}
                  </button>
                )}
                <button onClick={()=>{setActive(null);setCardUrl('');setPreview('')}} className="btn-ghost w-full">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Card Upload Modal */}
      <AnimatePresence>
        {showBulkCardUpload && (
          <motion.div 
            initial={{opacity:0}} 
            animate={{opacity:1}} 
            exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-navy-900/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{scale:.95,y:20}} 
              animate={{scale:1,y:0}} 
              exit={{scale:.95}}
              className="glass-gold p-6 sm:p-8 w-full max-w-lg max-h-[90dvh] overflow-y-auto"
            >
              <h2 className="font-display text-2xl text-cream mb-6">Upload Card for Selected Guests</h2>
              <p className="text-cream/40 text-sm mb-6">
                {selectedGuests.length > 0 
                  ? `This card will be used for all ${selectedGuests.length} selected guest${selectedGuests.length !== 1 ? 's' : ''}.`
                  : 'Upload a card to use for multiple guests. Select guests after uploading to apply this card.'
                }
              </p>

              <div className="mb-6">
                {bulkCardUrl ? (
                  <div className="relative">
                    <img 
                      src={bulkCardUrl} 
                      alt="Card preview" 
                      className="w-full h-auto rounded-xl border-2 border-gold/30"
                    />
                    <button
                      onClick={() => setBulkCardUrl('')}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-rose-500/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                    >
                      <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-xl p-6 text-center">
                    <input
                      type="file"
                      id="bulk-file-upload"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={async (event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        
                        setUploading(true)
                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                          
                          const response = await fetch('/api/invitations/upload', {
                            method: 'POST',
                            body: formData
                          })
                          
                          if (!response.ok) {
                            const error = await response.json()
                            toast.error(error.error || 'Upload failed')
                            return
                          }
                          
                          const result = await response.json()
                          setBulkCardUrl(result.url)
                          toast.success('Card uploaded successfully!')
                        } catch (error) {
                          console.error('Upload error:', error)
                          toast.error('Upload failed. Please try again.')
                        } finally {
                          setUploading(false)
                        }
                      }}
                      disabled={uploading}
                      className="hidden"
                    />
                    <label 
                      htmlFor="bulk-file-upload"
                      className="cursor-pointer inline-flex flex-col items-center gap-2 text-cream/60 hover:text-gold transition-colors"
                    >
                      <i className="fa-solid fa-camera fa-icon-xl text-cream/60"></i>
                      <span className="text-sm">
                        {uploading ? 'Uploading...' : 'Choose Card Image'}
                      </span>
                      <span className="text-xs opacity-50">
                        JPEG, PNG, WebP, GIF (max 20MB)
                      </span>
                    </label>
                  </div>
                )}
              </div>
                
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowBulkCardUpload(false)
                    setBulkCardUrl('')
                  }} 
                  disabled={uploading}
                  className="btn-ghost flex-1 disabled:opacity-50"
                >
                  Cancel
                </button>
                {bulkCardUrl && (
                  <button 
                    type="button" 
                    onClick={() => setShowBulkCardUpload(false)}
                    className="btn-gold flex-1"
                  >
                    Use This Card
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-gold overflow-x-auto">
        {loading ? <div className="p-8 text-center text-cream/30 text-sm">Loading…</div>
        : filteredGuests.length===0 && searchTerm ? (
          <div className="p-16 text-center"><div className="empty-icon mx-auto"><i className="fa-solid fa-magnifying-glass text-gold/60"></i></div><p className="font-display text-lg text-cream mb-2">No Matching Guests</p><p className="text-cream/35 text-sm">Try adjusting your search or filters.</p></div>
        ) : guests.length===0 ? (
          <div className="p-10 sm:p-16 text-center"><div className="empty-icon mx-auto"><i className="fa-solid fa-paper-plane text-gold/60"></i></div><p className="font-display text-lg text-cream mb-2">No Guests</p><p className="text-cream/35 text-sm">Add guests first, then send invitations.</p></div>
        ) : (
          <table className="table">
            <thead><tr><th className="w-12">
              <input 
                type="checkbox" 
                checked={selectedGuests.length === filteredGuests.length && filteredGuests.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gold/20 bg-white/10 text-gold focus:ring-gold focus:ring-offset-0"
              />
            </th><th>Guest</th><th>Channel</th><th>Card</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filteredGuests.map(g=>(
                <tr key={g.id} className={selectedGuests.includes(g.id) ? 'bg-gold/5' : ''}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedGuests.includes(g.id)}
                      onChange={() => handleSelectGuest(g.id)}
                      className="rounded border-gold/20 bg-white/10 text-gold focus:ring-gold focus:ring-offset-0"
                    />
                  </td>
                  <td><p className="text-cream font-medium">{g.name}</p><p className="text-cream/30 text-xs">{g.contact}</p></td>
                  <td><span className={`badge ${g.channel==='email'?'badge-gold':'badge-teal'}`}>{g.channel}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-slate">{g.card_type||'single'}</span>
                      {g.card_url ? (
                        <span className="text-xs text-gold/60">
                          <i className="fa-solid fa-image"></i>
                        </span>
                      ) : (
                        <span className="text-xs text-rose-400/60">
                          <i className="fa-solid fa-image"></i>
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {g.scanned_at?<span className="badge badge-teal"><i className="fa-solid fa-check mr-1"></i>Checked In</span>
                    :g.sent_via_email||g.sent_via_whatsapp?<span className="badge badge-gold"><i className="fa-solid fa-check mr-1"></i>Sent</span>
                    :<span className="badge badge-slate">Not Sent</span>}
                  </td>
                  <td>
                    <button onClick={()=>{setActive(g);setCardUrl('');setPreview('')}} className="btn-ghost py-1.5 px-4 text-xs">
                      {g.sent_via_email||g.sent_via_whatsapp?'Resend':'Send'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function OrganizerSend() {
  return <Suspense fallback={<div className="p-8 text-cream/30">Loading…</div>}><Content /></Suspense>
}
