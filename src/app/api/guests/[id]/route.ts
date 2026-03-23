import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const guestId = parseInt(id)
  if (isNaN(guestId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const { name, contact, phone, channel, card_type, dress_code } = await req.json()
    if (!name || !channel)
      return NextResponse.json({ error: 'name and channel required' }, { status: 400 })
    
    // Validate channel
    if (!['email', 'whatsapp'].includes(channel))
      return NextResponse.json({ error: 'channel must be email or whatsapp' }, { status: 400 })
    
    // Validate contact based on channel
    if (channel === 'email' && !contact)
      return NextResponse.json({ error: 'email is required when channel is email' }, { status: 400 })
    
    if (channel === 'whatsapp' && !phone)
      return NextResponse.json({ error: 'phone is required when channel is whatsapp' }, { status: 400 })

    const [guest] = await sql`
      UPDATE guests 
      SET name = ${name}, 
          contact = ${channel === 'email' ? contact : phone}, 
          phone = ${channel === 'whatsapp' ? phone : null}, 
          channel = ${channel}
      WHERE id = ${guestId}
      RETURNING *
    `

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    // Update invitation if provided
    if (card_type || dress_code) {
      await sql`
        UPDATE invitations 
        SET card_type = COALESCE(${card_type}, card_type),
            dress_code = COALESCE(${dress_code}, dress_code)
        WHERE guest_id = ${guestId}
      `
    }

    return NextResponse.json({ guest })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const guestId = parseInt(id)
  if (isNaN(guestId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  try {
    await sql`DELETE FROM guests WHERE id = ${guestId}`
    return NextResponse.json({ success: true })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}
