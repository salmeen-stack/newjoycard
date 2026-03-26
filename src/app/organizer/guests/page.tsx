'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

interface Guest { id:number; name:string; contact:string; channel:string; card_type?:string; dress_code?:string; inv_id?:number; qr_token?:string; scanned_at?:string; sent_via_email?:boolean; sent_via_whatsapp?:boolean; sms_token?:string; sms_used?:boolean }
interface Asgn  { id:number; event_id:number; event_title:string; guest_limit:number; guests_added:number }
const INIT = { name:'', contact:'', phone:'', channel:'email', card_type:'single', dress_code:'Smart Casual' }

function Content() {
  const sp = useSearchParams()
  const [selEvent, setSelEvent] = useState(sp.get('event')||'')
  const [guests,   setGuests]   = useState<Guest[]>([])
  const [asgns,    setAsgns]    = useState<Asgn[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [importModal, setImportModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form,     setForm]     = useState(INIT)
  const [saving,   setSaving]   = useState(false)
  const [importing, setImporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked-in' | 'not-checked-in'>('all')
  const [selectedGuests, setSelectedGuests] = useState<number[]>([])
  const [bulkAction, setBulkAction] = useState<'send' | 'resend' | 'export' | null>(null)
  const [bulkSending, setBulkSending] = useState(false)

  // Smart suggestions based on patterns
  const getSmartSuggestions = (name: string, contact: string) => {
    const suggestions = []
    
    // Card type suggestions based on name patterns
    if (name.toLowerCase().includes('mr') || name.toLowerCase().includes('mrs') || name.toLowerCase().includes('dr')) {
      suggestions.push({ type: 'card_type', value: 'single', reason: 'Professional title detected' })
    }
    if (name.toLowerCase().includes('and') || name.toLowerCase().includes('&')) {
      suggestions.push({ type: 'card_type', value: 'double', reason: 'Couple detected' })
    }
    
    // Dress code suggestions based on event type
    const currentEvent = asgns.find(a => String(a.event_id) === selEvent)
    if (currentEvent?.event_title?.toLowerCase().includes('wedding')) {
      suggestions.push({ type: 'dress_code', value: 'Formal', reason: 'Wedding event' })
    } else if (currentEvent?.event_title?.toLowerCase().includes('corporate')) {
      suggestions.push({ type: 'dress_code', value: 'Business Casual', reason: 'Corporate event' })
    }
    
    return suggestions
  }

  const applySuggestion = (type: string, value: string) => {
    if (type === 'card_type') {
      setForm(f => ({ ...f, card_type: value }))
    } else if (type === 'dress_code') {
      setForm(f => ({ ...f, dress_code: value }))
    }
  }

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

  const handleBulkSend = async () => {
    if (selectedGuests.length === 0) {
      toast.error('Please select guests to send invitations')
      return
    }
    
    setBulkSending(true)
    try {
      const promises = selectedGuests.map(async (guestId) => {
        const guest = guests.find(g => g.id === guestId)
        if (!guest || !guest.inv_id) return
        
        const response = await fetch('/api/invitations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invitation_id: guest.inv_id,
            send_email: guest.channel === 'email',
            send_whatsapp: guest.channel === 'whatsapp'
          })
        })
        
        return response.ok
      })
      
      const results = await Promise.all(promises)
      const successCount = results.filter(r => r).length
      
      toast.success(`Invitations sent to ${successCount}/${selectedGuests.length} guests`)
      setSelectedGuests([])
      load()
    } catch (error) {
      toast.error('Failed to send bulk invitations')
    } finally {
      setBulkSending(false)
    }
  }

  const handleBulkExport = () => {
    if (selectedGuests.length === 0) {
      toast.error('Please select guests to export')
      return
    }
    
    const selectedGuestData = guests.filter(g => selectedGuests.includes(g.id))
    const csv = [
      ['Name', 'Contact', 'Channel', 'Card Type', 'Status'],
      ...selectedGuestData.map(g => [
        g.name,
        g.contact,
        g.channel,
        g.card_type || 'single',
        g.scanned_at ? 'Checked In' : 'Not Checked In'
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `guests_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success(`Exported ${selectedGuests.length} guests`)
    setSelectedGuests([])
  }

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
      (filterStatus === 'checked-in' && guest.scanned_at) ||
      (filterStatus === 'not-checked-in' && !guest.scanned_at)
    
    return matchesSearch && matchesStatus
  })
  useEffect(()=>{ load() },[load])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!selEvent) { toast.error('Select an event first'); return }
    setSaving(true)
    try {
      const url = editingId ? `/api/guests/${editingId}` : '/api/guests'
      const method = editingId ? 'PUT' : 'POST'
      
      const r = await fetch(url, { 
        method, 
        headers:{'Content-Type':'application/json'}, 
        body:JSON.stringify({...form,event_id:+selEvent}) 
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d.error); return }
      
      toast.success(editingId ? 'Guest updated!' : 'Guest added!')
      setModal(false)
      setEditingId(null)
      setForm(INIT)
      load()
    } finally { setSaving(false) }
  }

  async function del(id:number) {
    if (!confirm('Remove guest?')) return
    const r = await fetch(`/api/guests/${id}`,{method:'DELETE'})
    r.ok ? (toast.success('Removed'), load()) : toast.error('Failed')
  }

  function edit(guest: Guest) {
    setEditingId(guest.id)
    setForm({
      name: guest.name,
      contact: guest.contact,
      phone: guest.channel !== 'email' ? guest.contact : '',
      channel: guest.channel,
      card_type: guest.card_type || 'single',
      dress_code: guest.dress_code || 'Smart Casual'
    })
    setModal(true)
  }

  function closeModal() {
    setModal(false)
    setEditingId(null)
    setForm(INIT)
  }

  function parseCSV(text: string): Array<{name: string, contact: string, channel: string}> {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []
    
    // Skip header row
    const dataLines = lines.slice(1)
    
    return dataLines.map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      
      // Expected format: name,contact (channel defaults to whatsapp for phone numbers)
      const name = values[0] || ''
      const contact = values[1] || ''
      
      // Auto-detect channel based on contact format
      let channel = 'whatsapp'
      if (contact.includes('@')) {
        channel = 'email'
      }
      
      return { name, contact, channel }
    }).filter(guest => guest.name && guest.contact)
  }

  async function handleImport(file: File) {
    if (!selEvent) { toast.error('Select an event first'); return }
    if (!file) return
    
    const text = await file.text()
    const guests = parseCSV(text)
    
    if (guests.length === 0) {
      toast.error('No valid guests found in file')
      return
    }
    
    setImporting(true)
    try {
      const response = await fetch('/api/guests/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: +selEvent, guests })
      })
      const data = await response.json()
      
      if (!response.ok) {
        toast.error(data.error || 'Import failed')
        return
      }
      
      toast.success(`Imported ${data.imported} guests successfully!${data.failed ? ` ${data.failed} failed.` : ''}`)
      setImportModal(false)
      load()
    } catch (error) {
      toast.error('Import failed')
    } finally {
      setImporting(false)
    }
  }

  const cur = asgns.find(a=>String(a.event_id)===selEvent)

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="flex flex-wrap items-start sm:items-center justify-between gap-3 mb-6 sm:mb-10">
        <div><p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Organizer</p><h1 className="font-display text-3xl sm:text-4xl font-semibold text-cream">Guests</h1></div>
        <div className="flex gap-3">
          <button onClick={()=>setImportModal(true)} disabled={!selEvent} className="btn-ghost disabled:opacity-40">
            <i className="fa-solid fa-upload mr-2"></i>Import CSV
          </button>
          <button onClick={()=>setModal(true)} disabled={!selEvent} className="btn-gold disabled:opacity-40">+ Add Guest</button>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="label">Event</label>
          <select className="input min-w-[220px]" value={selEvent} onChange={e=>setSelEvent(e.target.value)}>
            <option value="">All Events</option>
            {asgns.map(a=><option key={a.event_id} value={a.event_id}>{a.event_title}</option>)}
          </select>
        </div>
        
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
            <option value="checked-in">Checked In</option>
            <option value="not-checked-in">Not Checked In</option>
          </select>
        </div>
        
        {cur && (
          <div className="flex gap-3">
            <div className="glass-gold px-4 py-2 text-center"><p className="text-gold font-display text-lg font-bold">{cur.guests_added}</p><p className="text-cream/25 text-xs">Added</p></div>
            <div className="glass-gold px-4 py-2 text-center"><p className="text-cream font-display text-lg font-bold">{cur.guest_limit}</p><p className="text-cream/25 text-xs">Limit</p></div>
          </div>
        )}
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
            <button 
              onClick={handleSelectAll}
              className="btn-ghost text-sm py-1.5 px-3"
            >
              {selectedGuests.length === filteredGuests.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleBulkSend}
              disabled={bulkSending}
              className="btn-gold text-sm py-1.5 px-3 disabled:opacity-40"
            >
              {bulkSending ? 'Sending...' : '📧 Send Invitations'}
            </button>
            <button 
              onClick={handleBulkExport}
              className="btn-ghost text-sm py-1.5 px-3"
            >
              📥 Export CSV
            </button>
            <button 
              onClick={() => setSelectedGuests([])}
              className="btn-ghost text-sm py-1.5 px-3"
            >
              ✕ Clear Selection
            </button>
          </div>
        </motion.div>
      )}
      
      {searchTerm && (
        <div className="mb-4">
          <p className="text-cream/35 text-sm">
            Found {filteredGuests.length} guest{filteredGuests.length !== 1 ? 's' : ''} matching "{searchTerm}"
          </p>
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy-900/80 backdrop-blur-sm">
            <motion.div initial={{scale:.95,y:20}} animate={{scale:1,y:0}} exit={{scale:.95}} className="glass-gold p-8 w-full max-w-md">
              <h2 className="font-display text-2xl font-semibold text-cream mb-6">
              {editingId ? 'Edit Guest' : 'Add Guest'}
            </h2>
              <form onSubmit={add} className="space-y-4">
                <div>
                  <label className="label">Name</label>
                  <input 
                    className="input" 
                    required 
                    value={form.name} 
                    onChange={e=>setForm(f=>({...f,name:e.target.value}))} 
                    placeholder="Full name" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Channel</label>
                    <select 
                      className="input" 
                      value={form.channel} 
                      onChange={e=>setForm(f=>({...f,channel:e.target.value, contact: e.target.value === 'email' ? f.contact : f.phone, phone: e.target.value !== 'email' ? f.phone : ''}))}
                    >
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="sms">SMS (Analog Phone)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">
                      {form.channel === 'email' ? 'Email Address' : 'Phone Number'}
                    </label>
                    <input 
                      className="input" 
                      required 
                      value={form.channel === 'email' ? form.contact : form.phone} 
                      onChange={e=>setForm(f=>({
                        ...f, 
                        contact: form.channel === 'email' ? e.target.value : f.contact,
                        phone: form.channel !== 'email' ? e.target.value : f.phone
                      }))} 
                      placeholder={form.channel === 'email' ? 'email@example.com' : '+1234567890'} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Card Type</label>
                    <select 
                      className="input" 
                      value={form.card_type} 
                      onChange={e=>setForm(f=>({...f,card_type:e.target.value}))}
                    >
                      <option value="single">Single</option>
                      <option value="double">Double</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Dress Code</label>
                    <input 
                      className="input" 
                      value={form.dress_code} 
                      onChange={e=>setForm(f=>({...f,dress_code:e.target.value}))} 
                    />
                  </div>
                </div>
                
                {/* Smart Suggestions */}
                {form.name && (
                  <div className="mt-4 p-3 bg-gold/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fa-solid fa-lightbulb text-gold text-sm"></i>
                      <span className="text-cream/80 text-sm font-medium">Smart Suggestions</span>
                    </div>
                    <div className="space-y-2">
                      {getSmartSuggestions(form.name, form.contact).map((suggestion, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="text-cream/60">{suggestion.reason}</span>
                          <button
                            onClick={() => applySuggestion(suggestion.type, suggestion.value)}
                            className="text-gold hover:text-gold/80 transition-colors"
                          >
                            {suggestion.type === 'card_type' ? `Set to ${suggestion.value}` : `Use "${suggestion.value}"`}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-gold flex-1">
                    {saving ? (editingId ? 'Updating…' : 'Adding…') : (editingId ? 'Update Guest' : 'Add Guest')}
                  </button>
                  <button type="button" onClick={closeModal} className="btn-ghost flex-1">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {importModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy-900/80 backdrop-blur-sm">
            <motion.div initial={{scale:.95,y:20}} animate={{scale:1,y:0}} exit={{scale:.95}} className="glass-gold p-8 w-full max-w-md">
              <h2 className="font-display text-2xl font-semibold text-cream mb-6">Import Guests</h2>
              
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-display text-lg text-cream mb-2">CSV Format</h3>
                  <p className="text-cream/60 text-sm mb-3">Create a CSV file with just name and contact:</p>
                  <code className="text-gold text-xs block bg-black/20 p-2 rounded">
                    name,contact
                  </code>
                  <p className="text-cream/60 text-xs mt-3">Examples:</p>
                  <code className="text-gold text-xs block bg-black/20 p-2 rounded">
                    "John Doe","+1234567890"<br/>
                    "Jane Smith","+1987654321"<br/>
                    "Mike Wilson","mike@example.com"
                  </code>
                  <p className="text-cream/60 text-xs mt-3">Channel will be auto-detected:</p>
                  <ul className="text-cream/60 text-xs mt-2 ml-4">
                    <li>• Phone numbers → WhatsApp</li>
                    <li>• Email addresses → Email</li>
                  </ul>
                </div>
                
                <div>
                  <label className="label">Select CSV File</label>
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={e => e.target.files?.[0] && handleImport(e.target.files[0])}
                    disabled={importing}
                    className="input file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gold/20 file:text-gold hover:file:bg-gold/30 disabled:opacity-50"
                  />
                </div>
                
                <div className="text-cream/35 text-xs">
                  <p>• First row should contain headers (name,contact)</p>
                  <p>• Phone numbers should include country code (+1)</p>
                  <p>• Use Edit Guest to add card type and dress code</p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={()=>setImportModal(false)} 
                  disabled={importing}
                  className="btn-ghost flex-1 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
              
              {importing && (
                <div className="text-center mt-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gold"></div>
                  <p className="text-cream/60 text-sm mt-2">Importing guests...</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-gold overflow-x-auto">
        {loading ? <div className="p-8 text-center text-cream/30 text-sm">Loading…</div>
        : filteredGuests.length===0 && searchTerm ? (
          <div className="p-16 text-center"><div className="empty-icon mx-auto"><i className="fa-solid fa-magnifying-glass text-gold/60"></i></div><p className="font-display text-lg text-cream mb-2">No Matching Guests</p><p className="text-cream/35 text-sm">Try adjusting your search or filters.</p></div>
        ) : guests.length===0 ? (
          <div className="p-16 text-center"><div className="empty-icon mx-auto"><i className="fa-solid fa-ticket text-gold/60"></i></div><p className="font-display text-lg text-cream mb-2">No Guests</p><p className="text-cream/35 text-sm">Select an event and add guests.</p></div>
        ) : (
          <table className="table">
            <thead><tr><th className="w-12">
              <input 
                type="checkbox" 
                checked={selectedGuests.length === filteredGuests.length && filteredGuests.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gold/20 bg-white/10 text-gold focus:ring-gold focus:ring-offset-0"
              />
            </th><th>Name</th><th>Contact</th><th>Channel</th><th>Card</th><th>Dress Code</th><th>Status</th><th></th></tr></thead>
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
                  <td className="font-medium text-cream">{g.name}</td>
                  <td className="text-cream/45 text-xs">{g.contact}</td>
                  <td><span className={`badge ${
                    g.channel==='email'?'badge-gold':
                    g.channel==='whatsapp'?'badge-teal':
                    'badge-amber-400'
                  }`}>{g.channel}</span></td>
                  <td><span className="badge badge-slate">{g.card_type||'single'}</span></td>
                  <td className="text-cream/45 text-xs">{g.dress_code||'—'}</td>
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
                  <td>
                    <div className="flex gap-2">
                      <button onClick={()=>edit(g)} className="text-cream/25 hover:text-gold transition-colors text-xs">Edit</button>
                      <button onClick={()=>del(g.id)} className="text-cream/25 hover:text-rose-400 transition-colors text-xs">Remove</button>
                    </div>
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

export default function OrganizerGuests() {
  return <Suspense fallback={<div className="p-8 text-cream/30">Loading…</div>}><Content /></Suspense>
}
