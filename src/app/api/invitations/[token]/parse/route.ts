import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }
    
    // Parse the QR code token to extract guest information
    // Expected format: /invite/[guest_id] or /verify/[guest_id]
    let guestId: string | null = null
    
    if (token.startsWith('/invite/')) {
      guestId = token.replace('/invite/', '')
    } else if (token.startsWith('/verify/')) {
      guestId = token.replace('/verify/', '')
    } else {
      return NextResponse.json({ error: 'Invalid QR code format' }, { status: 400 })
    }
    
    if (!guestId) {
      return NextResponse.json({ error: 'Invalid guest ID in QR code' }, { status: 400 })
    }
    
    // Get guest information from database
    const [guest] = await sql`
      SELECT 
        g.id,
        g.name,
        g.card_type,
        g.dress_code,
        e.title as event_title,
        e.date as event_date
      FROM guests g
      JOIN events e ON e.id = g.event_id
      WHERE g.id = ${guestId}
      LIMIT 1
    `
    
    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      guest: {
        id: guest.id,
        name: guest.name,
        card_type: guest.card_type,
        dress_code: guest.dress_code,
        event_title: guest.event_title,
        event_date: guest.event_date
      }
    })
    
  } catch (error) {
    console.error('Error parsing QR code:', error)
    return NextResponse.json({ 
      error: 'Failed to parse QR code: ' + (error instanceof Error ? error.message : 'Unknown error') 
    }, { status: 500 })
  }
}
