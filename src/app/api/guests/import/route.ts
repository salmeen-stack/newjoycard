import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'
import { generateToken } from '@/lib/qr'

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    const { event_id, guests } = await req.json()
    
    if (!event_id || !Array.isArray(guests)) {
      return NextResponse.json({ error: 'event_id and guests array required' }, { status: 400 })
    }

    if (guests.length === 0) {
      return NextResponse.json({ error: 'No guests to import' }, { status: 400 })
    }

    // Check organizer assignment if user is organizer
    if (user.role === 'organizer') {
      const [asgn] = await sql`
        SELECT oa.guest_limit, COUNT(g.id)::int AS current_count
        FROM organizer_assignments oa
        LEFT JOIN guests g ON g.event_id = oa.event_id
        WHERE oa.organizer_id=${user.id} AND oa.event_id=${event_id}
        GROUP BY oa.guest_limit
      `
      if (!asgn) return NextResponse.json({ error: 'Not assigned to this event' }, { status: 403 })
      if (asgn.current_count + guests.length > asgn.guest_limit)
        return NextResponse.json({ error: `Import would exceed guest limit of ${asgn.guest_limit}` }, { status: 400 })
    }

    let imported = 0
    let failed = 0
    const errors: string[] = []

    // Process each guest
    for (const guest of guests) {
      try {
        const { name, contact, channel } = guest
        
        // Validate required fields
        if (!name || !contact) {
          failed++
          errors.push(`Missing name or contact for guest`)
          continue
        }
        
        // Auto-detect channel if not provided
        let finalChannel = channel
        if (!finalChannel) {
          finalChannel = contact.includes('@') ? 'email' : 'whatsapp'
        }
        
        // Validate channel
        if (!['email', 'whatsapp'].includes(finalChannel)) {
          failed++
          errors.push(`Invalid channel "${finalChannel}" for ${name}`)
          continue
        }
        
        // Validate contact format based on channel
        if (finalChannel === 'email' && !contact.includes('@')) {
          failed++
          errors.push(`Invalid email format for ${name}`)
          continue
        }
        
        if (finalChannel === 'whatsapp' && (!contact.startsWith('+') || !/^\+\d+$/.test(contact))) {
          failed++
          errors.push(`Phone number must start with + and contain only digits for ${name}`)
          continue
        }

        // Insert guest with default values
        const [newGuest] = await sql`
          INSERT INTO guests (event_id, name, contact, phone, channel)
          VALUES (${event_id}, ${name}, ${contact}, ${finalChannel === 'whatsapp' ? contact : null}, ${finalChannel})
          RETURNING *
        `
        
        // Create invitation with default values
        const token = generateToken()
        await sql`
          INSERT INTO invitations (guest_id, card_type, dress_code, qr_token)
          VALUES (${newGuest.id}, 'single', 'Smart Casual', ${token})
        `
        
        imported++
      } catch (error) {
        failed++
        errors.push(`Failed to import ${guest.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      imported,
      failed,
      errors: errors.slice(0, 10), // Limit errors to prevent huge responses
      message: `Successfully imported ${imported} guests${failed > 0 ? ` with ${failed} failures` : ''}`
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ 
      error: 'Import failed: ' + (error instanceof Error ? error.message : 'Unknown error') 
    }, { status: 500 })
  }
}
