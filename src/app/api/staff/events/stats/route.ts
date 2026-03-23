import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = requireRole(req, 'staff')
  if (auth instanceof NextResponse) return auth
  
  try {
    console.log('Fetching staff event stats for user:', auth.user.id)
    
    // Get all events assigned to this staff member
    const events = await sql`
      SELECT 
        e.id as event_id,
        e.title as event_title,
        e.date as event_date,
        e.location as event_location,
        e.description
      FROM staff_events se
      JOIN events e ON e.id = se.event_id
      WHERE se.staff_id = ${auth.user.id}
      ORDER BY e.date ASC, e.title ASC
    `
    
    console.log('Found events:', events.length)
    
    // Get statistics for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        try {
          // Get guest counts for this event
          const [guestStats] = await sql`
            SELECT 
              COUNT(*) as total_guests,
              COUNT(CASE WHEN i.scanned_at IS NOT NULL THEN 1 END) as checked_in,
              COUNT(CASE WHEN i.scanned_at IS NULL THEN 1 END) as remaining
            FROM guests g
            LEFT JOIN invitations i ON g.id = i.guest_id
            WHERE g.event_id = ${event.event_id}
          `
          
          const totalGuests = guestStats?.total_guests || 0
          const checkedIn = guestStats?.checked_in || 0
          const checkInPercentage = totalGuests > 0 ? Math.round((checkedIn / totalGuests) * 100) : 0
          
          // Get recent check-ins
          const recentCheckins = await sql`
            SELECT 
              g.name,
              g.card_type,
              i.scanned_at
            FROM invitations i
            JOIN guests g ON g.id = i.guest_id
            WHERE i.event_id = ${event.event_id}
            AND i.scanned_at IS NOT NULL
            ORDER BY i.scanned_at DESC
            LIMIT 10
          `
          
          return {
            ...event,
            totalGuests,
            checkedIn: checkedIn,
            remaining: totalGuests - checkedIn,
            checkInPercentage: checkInPercentage,
            recentCheckins: recentCheckins
          }
        } catch (error) {
          console.error('Error processing event:', event.event_id, error)
          return {
            ...event,
            totalGuests: 0,
            checkedIn: 0,
            remaining: 0,
            checkInPercentage: 0,
            recentCheckins: []
          }
        }
      })
    )
    
    console.log('Processed events with stats')
    
    return NextResponse.json({ events: eventsWithStats })
    
  } catch (error) {
    console.error('Error fetching staff event stats:', error)
    return NextResponse.json({ error: 'Server error: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 })
  }
}
