'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { format, isToday, isFuture, isPast } from 'date-fns'
import toast from 'react-hot-toast'

interface EventStats {
  event_id: number
  event_title: string
  event_date: string
  event_location: string
  description?: string
  total_guests: number
  checked_in: number
  remaining: number
  check_in_percentage: number
  recent_checkins: Array<{
    name: string
    card_type: string
    scanned_at: string
  }>
}

interface StatCard {
  title: string
  value: string | number
  subtitle: string
  color: string
  icon: string
  trend?: 'up' | 'down' | 'stable'
}

function StatCard({ stat, index }: { stat: StatCard; index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
          <i className={`fa-solid ${stat.icon} text-white text-sm`}></i>
        </div>
        {stat.trend && (
          <div className={`flex items-center text-xs ${
            stat.trend === 'up' ? 'text-teal' : 
            stat.trend === 'down' ? 'text-rose-400' : 'text-cream/40'
          }`}>
            <i className={`fa-solid fa-arrow-${
              stat.trend === 'up' ? 'up' : 
              stat.trend === 'down' ? 'down' : 'right'
            } mr-1`}></i>
            {stat.trend === 'up' ? '12%' : stat.trend === 'down' ? '5%' : '0%'}
          </div>
        )}
      </div>
      <h3 className="font-display text-2xl font-bold text-cream mb-1">{stat.value}</h3>
      <p className="text-cream/30 text-xs uppercase tracking-widest">{stat.title}</p>
      <p className="text-cream/40 text-xs mt-1">{stat.subtitle}</p>
    </motion.div>
  )
}

function EventTrackingCard({ event, index }: { event: EventStats; index: number }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-gold p-4 sm:p-5 mb-4 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Compact View */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-display text-lg font-semibold text-cream truncate">{event.event_title}</h3>
            {isToday(new Date(event.event_date)) && (
              <span className="text-gold text-xs flex-shrink-0">Today</span>
            )}
          </div>
          <p className="text-gold/60 text-sm">{format(new Date(event.event_date), 'MMM d, h:mm a')}</p>
          <p className="text-cream/30 text-xs truncate">{event.event_location}</p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="text-right">
            <p className="text-cream text-lg font-bold">{event.checked_in}/{event.total_guests}</p>
            <p className="text-cream/30 text-xs">checked in</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'} text-cream/40 text-xs`}></i>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-cream/40">Progress</span>
          <span className="text-xs font-medium text-cream">{event.check_in_percentage}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${event.check_in_percentage}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-gradient-to-r from-teal to-gold rounded-full"
          />
        </div>
      </div>

      {/* Expanded View */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="font-display text-lg font-bold text-cream">{event.total_guests}</p>
                <p className="text-cream/25 text-xs">Total Guests</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="font-display text-lg font-bold text-teal">{event.checked_in}</p>
                <p className="text-cream/25 text-xs">Checked In</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="font-display text-lg font-bold text-gold">{event.remaining}</p>
                <p className="text-cream/25 text-xs">Remaining</p>
              </div>
            </div>

            {event.recent_checkins.length > 0 && (
              <div>
                <h4 className="font-display text-sm font-semibold text-cream mb-3">Recent Check-ins</h4>
                <div className="space-y-2">
                  {event.recent_checkins.slice(0, 5).map((checkin, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${
                          checkin.card_type === 'VIP' ? 'bg-gold/20' : 'bg-teal/20'
                        } flex items-center justify-center`}>
                          <i className={`fa-solid fa-${
                            checkin.card_type === 'VIP' ? 'crown text-gold' : 'user text-teal'
                          } text-xs`}></i>
                        </div>
                        <div>
                          <p className="text-cream text-sm font-medium">{checkin.name}</p>
                          <p className="text-cream/40 text-xs">{checkin.card_type}</p>
                        </div>
                      </div>
                      <span className="text-cream/40 text-xs">
                        {format(new Date(checkin.scanned_at), 'h:mm a')}
                      </span>
                    </div>
                  ))}
                </div>
                {event.recent_checkins.length > 5 && (
                  <p className="text-cream/40 text-xs mt-2 text-center">
                    +{event.recent_checkins.length - 5} more check-ins
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Content() {
  const sp = useSearchParams()
  const eventId = sp.get('event')
  const [events, setEvents] = useState<EventStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null)
  const [stats, setStats] = useState<StatCard[]>([])

  const fetchEventStats = useCallback(async () => {
    setLoading(true)
    try {
      const url = eventId 
        ? `/api/staff/events/${eventId}/stats`
        : '/api/staff/events/stats'
      
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch event stats')
      
      const data = await res.json()
      
      if (eventId && data.event) {
        // Single event view
        setEvents([data.event])
        setSelectedEvent(parseInt(eventId))
      } else {
        // All events view
        setEvents(data.events || [])
      }
      
      // Calculate overall stats
      const totalGuests = data.events?.reduce((sum: number, ev: EventStats) => sum + ev.total_guests, 0) || 0
      const totalCheckedIn = data.events?.reduce((sum: number, ev: EventStats) => sum + ev.checked_in, 0) || 0
      const activeEvents = data.events?.filter((ev: EventStats) => 
        isToday(new Date(ev.event_date)) || isFuture(new Date(ev.event_date))
      ).length || 0
      
      setStats([
        {
          title: 'Total Guests',
          value: totalGuests.toLocaleString(),
          subtitle: 'Across all events',
          color: 'bg-gold/20',
          icon: 'fa-users',
          trend: 'up'
        },
        {
          title: 'Checked In',
          value: totalCheckedIn.toLocaleString(),
          subtitle: `${Math.round((totalCheckedIn / totalGuests) * 100)}% overall`,
          color: 'bg-teal/20',
          icon: 'fa-user-check',
          trend: 'up'
        },
        {
          title: 'Active Events',
          value: activeEvents,
          subtitle: 'Today & upcoming',
          color: 'bg-cream/20',
          icon: 'fa-calendar-check',
          trend: 'stable'
        }
      ])
      
    } catch (error) {
      console.error('Error fetching event stats:', error)
      toast.error('Failed to load event statistics')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchEventStats()
    
    // Set up real-time updates (poll every 30 seconds)
    const interval = setInterval(fetchEventStats, 30000)
    return () => clearInterval(interval)
  }, [fetchEventStats])

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-6 sm:mb-8">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Staff</p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-cream">
              {eventId ? 'Event Tracking' : 'Event Overview'}
            </h1>
            {eventId && (
              <p className="text-cream/35 text-sm mt-1">
                Real-time statistics for Event #{eventId}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Overview - Only show on overview page */}
      {!eventId && (
        <motion.div 
          initial={{opacity:0,y:10}} 
          animate={{opacity:1,y:0}} 
          className="mb-6 sm:mb-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {stats.map((stat, index) => (
              <StatCard key={stat.title} stat={stat} index={index} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass-gold p-6 h-32 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <motion.div 
          initial={{opacity:0,y:20}} 
          animate={{opacity:1,y:0}} 
          className="glass-gold p-16 text-center"
        >
          <div className="empty-icon mx-auto">
            <i className="fa-solid fa-chart-line text-gold/60"></i>
          </div>
          <h3 className="font-display text-xl text-cream mb-2">No Events Found</h3>
          <p className="text-cream/35 text-sm">
            {eventId 
              ? 'Event not found or you don\'t have access to track this event.'
              : 'No events available for tracking.'
            }
          </p>
        </motion.div>
      ) : (
        /* Event Cards */
        <div className="space-y-4">
          {events.map((event, index) => (
            <EventTrackingCard 
              key={event.event_id} 
              event={event} 
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  )
}
