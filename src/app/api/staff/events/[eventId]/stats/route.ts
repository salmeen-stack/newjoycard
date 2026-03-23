import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const auth = requireRole(req, 'staff')
  if (auth instanceof NextResponse) return auth
  
  const { eventId } = await params
  
  try {
    console.log('Fetching stats for event:', eventId, 'user:', auth.user.id)
    
    // Get specific event details
    const [eventDetails] = await sql`
      SELECT 
        e.id as event_id,
        e.title as event_title,
        e.date as event_date,
        e.location as event_location,
        e.description
      FROM events e
      LEFT JOIN staff_events se ON se.event_id = e.id AND se.staff_id = ${auth.user.id}
      WHERE e.id = ${eventId}
      GROUP BY e.id, e.title, e.date, e.location, e.description
    `
    
    console.log('Event details:', eventDetails)
    
    if (!eventDetails) {
      return NextResponse.json({ error: 'Event not found or not assigned to you' }, { status: 404 })
    }
    
    // Get guest statistics for this event
    let guestStats = { total_guests: 0, checked_in: 0 }
    let recentCheckins: Array<{name: string, card_type: string, scanned_at: string}> = []
    
    try {
      const [statsResult] = await sql`
        SELECT 
          COUNT(*) as total_guests,
          COUNT(CASE WHEN i.scanned_at IS NOT NULL THEN 1 END) as checked_in
        FROM guests g
        LEFT JOIN invitations i ON g.id = i.guest_id
        WHERE g.event_id = ${eventId}
      `
      
      guestStats = (statsResult as any) || { total_guests: 0, checked_in: 0 }
      
      // Get recent check-ins
      const recentCheckinsData = await sql`
        SELECT 
          g.name,
          g.card_type,
          i.scanned_at
        FROM invitations i
        JOIN guests g ON g.id = i.guest_id
        WHERE i.event_id = ${eventId}
        AND i.scanned_at IS NOT NULL
        ORDER BY i.scanned_at DESC
        LIMIT 10
      `
      
      recentCheckins = recentCheckinsData as Array<{name: string, card_type: string, scanned_at: string}>
    } catch (error) {
      console.error('Error fetching guest stats for event', eventId, error)
    }
    
    const totalGuests = guestStats.total_guests || 0
    const checkedIn = guestStats.checked_in || 0
    const checkInPercentage = totalGuests > 0 ? Math.round((checkedIn / totalGuests) * 100) : 0
    
    const eventData = {
      ...eventDetails,
      totalGuests,
      checkedIn: checkedIn,
      remaining: totalGuests - checkedIn,
      checkInPercentage: checkInPercentage,
      recentCheckins: recentCheckins
    }
    
    console.log('Final event data:', eventData)
    
    return NextResponse.json({ event: eventData })
    
  } catch (error) {
    console.error('Error fetching event stats:', error)
    return NextResponse.json({ error: 'Server error: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 })
  }
}
