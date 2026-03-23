import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    
    console.log('QR Parse API - Received token:', token)
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }
    
    // Parse the QR code token to extract guest information
    // Expected formats: 
    // - /invite/[guest_id]
    // - /verify/[guest_id] 
    // - https://domain.com/invite/[guest_id]
    // - https://domain.com/verify/[guest_id]
    // - [guest_id] (direct token)
    let guestId: string | null = null
    
    // Handle full URLs
    if (token.includes('/invite/')) {
      guestId = token.split('/invite/')[1]
    } else if (token.includes('/verify/')) {
      guestId = token.split('/verify/')[1]
    } else if (token.startsWith('http')) {
      // Extract path from full URL
      const urlPath = new URL(token).pathname
      if (urlPath.includes('/invite/')) {
        guestId = urlPath.split('/invite/')[1]
      } else if (urlPath.includes('/verify/')) {
        guestId = urlPath.split('/verify/')[1]
      }
    } else {
      // Assume it's a direct guest ID
      guestId = token
    }
    
    if (!guestId) {
      return NextResponse.json({ error: 'Invalid QR code format' }, { status: 400 })
    }
    
    console.log('QR Parse API - Extracted guest ID:', guestId)
    
    // Get guest information from database using qr_token
    const [invitation] = await sql`
      SELECT 
        g.id,
        g.name,
        g.card_type,
        g.dress_code,
        e.title as event_title,
        e.date as event_date
      FROM invitations i
      JOIN guests g ON g.id = i.guest_id
      JOIN events e ON e.id = g.event_id
      WHERE i.qr_token = ${guestId}
      LIMIT 1
    `
    
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      guest: {
        id: invitation.id,
        name: invitation.name,
        card_type: invitation.card_type,
        dress_code: invitation.dress_code,
        event_title: invitation.event_title,
        event_date: invitation.event_date
      }
    })
    
  } catch (error) {
    console.error('Error parsing QR code:', error)
    return NextResponse.json({ 
      error: 'Failed to parse QR code: ' + (error instanceof Error ? error.message : 'Unknown error') 
    }, { status: 500 })
  }
}
