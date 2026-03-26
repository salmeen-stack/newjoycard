import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

// Staff POST — verify SMS token and check-in guest
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const auth = requireRole(req, 'admin', 'staff')
  if (auth instanceof NextResponse) return auth
  const { user } = auth
  const { token } = await params

  try {
    // Validate token format (6-digit numeric)
    if (!/^\d{6}$/.test(token)) {
      return NextResponse.json({ 
        valid: false, 
        alreadyScanned: false, 
        message: 'Invalid token format. Token must be 6 digits.' 
      })
    }

    // Find invitation by SMS token
    const rows = await sql`
      SELECT i.*, g.name AS guest_name, g.event_id,
        e.title AS event_title, e.date AS event_date
      FROM invitations i
      JOIN guests g ON g.id = i.guest_id
      JOIN events e ON e.id = g.event_id
      WHERE i.sms_token = ${token}
    `
    
    if (!rows.length) {
      return NextResponse.json({ 
        valid: false, 
        alreadyScanned: false, 
        message: 'Invalid token — not recognised.' 
      })
    }
    
    const inv = rows[0]

    // Staff can only scan events assigned to them
    if (user.role === 'staff') {
      const assigned = await sql`
        SELECT 1 FROM staff_events WHERE staff_id=${user.id} AND event_id=${inv.event_id}
      `
      if (!assigned.length) {
        return NextResponse.json({ 
          valid: false, 
          alreadyScanned: false, 
          message: 'You are not assigned to this event.' 
        })
      }
    }

    // Check if SMS token has already been used
    if (inv.sms_used) {
      return NextResponse.json({
        valid: false, 
        alreadyScanned: true,
        message: 'This token has already been used for check-in.',
        guest: { 
          name: inv.guest_name, 
          card_type: inv.card_type, 
          dress_code: inv.dress_code, 
          event_title: inv.event_title 
        },
      })
    }

    // Check if already checked in via QR (shouldn't happen but handle gracefully)
    if (inv.scanned_at) {
      return NextResponse.json({
        valid: false, 
        alreadyScanned: true,
        message: 'Guest already checked in via QR code.',
        guest: { 
          name: inv.guest_name, 
          card_type: inv.card_type, 
          dress_code: inv.dress_code, 
          event_title: inv.event_title,
          scanned_at: inv.scanned_at 
        },
      })
    }

    // Mark SMS token as used and check in the guest
    await sql`
      UPDATE invitations 
      SET scanned_at=NOW(), sms_used=TRUE 
      WHERE id=${inv.id}
    `
    
    return NextResponse.json({
      valid: true, 
      alreadyScanned: false, 
      message: 'Check-in successful via SMS token!',
      guest: { 
        name: inv.guest_name, 
        card_type: inv.card_type, 
        dress_code: inv.dress_code, 
        event_title: inv.event_title 
      },
    })
  } catch (err) { 
    console.error('SMS token verification error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 }) 
  }
}
