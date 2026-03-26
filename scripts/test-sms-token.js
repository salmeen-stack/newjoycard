#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function testSMS() {
  if (!process.env.DATABASE_URL) { 
    console.error('DATABASE_URL not set'); 
    process.exit(1) 
  }
  
  const sql = neon(process.env.DATABASE_URL)
  console.log('🧪 Testing SMS Token Generation...\n')

  try {
    // Test creating an SMS guest (you'll need to replace with actual event_id)
    const testEventId = 1 // Replace with actual event ID
    const testName = 'Test SMS Guest'
    const testPhone = '+1234567890'
    
    console.log('📝 Creating test SMS guest...')
    
    // First create the guest
    const [guest] = await sql`
      INSERT INTO guests (event_id, name, contact, phone, channel)
      VALUES (${testEventId}, ${testName}, ${testPhone}, ${testPhone}, 'sms')
      RETURNING *
    `
    
    console.log('✅ Guest created:', guest.id, guest.name)
    
    // Generate 6-digit token
    const smsToken = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('🔢 Generated SMS Token:', smsToken)
    
    // Create invitation with SMS token
    const [invitation] = await sql`
      INSERT INTO invitations (guest_id, card_type, dress_code, qr_token, sms_token)
      VALUES (${guest.id}, 'single', 'Smart Casual', 'test-qr-token', ${smsToken})
      RETURNING *
    `
    
    console.log('🎫 Invitation created:')
    console.log('   QR Token:', invitation.qr_token)
    console.log('   SMS Token:', invitation.sms_token)  // ← THIS IS WHAT YOU NEED
    console.log('   SMS Used:', invitation.sms_used)
    
    // Test verification
    console.log('\n🔍 Testing SMS token verification...')
    const verifyResult = await sql`
      SELECT i.*, g.name AS guest_name, g.event_id,
        e.title AS event_title, e.date AS event_date
      FROM invitations i
      JOIN guests g ON g.id = i.guest_id
      JOIN events e ON e.id = g.event_id
      WHERE i.sms_token = ${smsToken}
    `
    
    if (verifyResult.length > 0) {
      console.log('✅ SMS token verification works!')
      console.log('   Guest:', verifyResult[0].guest_name)
      console.log('   Event:', verifyResult[0].event_title)
    } else {
      console.log('❌ SMS token verification failed')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testSMS()
