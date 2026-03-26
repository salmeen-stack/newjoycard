#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function main() {
  if (!process.env.DATABASE_URL) { 
    console.error('DATABASE_URL not set'); 
    process.exit(1) 
  }
  
  const sql = neon(process.env.DATABASE_URL)
  console.log('🔍 Connecting to Neon database...\n')

  try {
    // Get all table names
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    console.log('📊 DATABASE SCHEMA OVERVIEW')
    console.log('='.repeat(50))
    
    if (tables.length === 0) {
      console.log('❌ No tables found in database')
      return
    }
    
    console.log(`📋 Found ${tables.length} tables:\n`)
    
    // For each table, get its columns
    for (const table of tables) {
      const tableName = table.table_name
      
      console.log(`🏷️  TABLE: ${tableName}`)
      console.log('-'.repeat(40))
      
      // Get column information
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = ${tableName} 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      
      if (columns.length === 0) {
        console.log('   ❌ No columns found')
      } else {
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
          const defaultVal = col.column_default ? `DEFAULT ${col.column_default}` : ''
          const length = col.character_maximum_length ? `(${col.character_maximum_length})` : 
                        col.numeric_precision ? `(${col.numeric_precision}${col.numeric_scale ? `,${col.numeric_scale}` : ''})` : ''
          
          console.log(`   📝 ${col.column_name.padEnd(20)} ${col.data_type}${length.padEnd(15)} ${nullable.padEnd(8)} ${defaultVal}`)
        })
      }
      
      // Get row count
      try {
        const countResult = await sql`SELECT COUNT(*) as count FROM ${tableName}`
        console.log(`   📊 Rows: ${countResult[0].count}`)
      } catch (err) {
        console.log(`   📊 Rows: Unable to count (${err.message})`)
      }
      
      console.log('\n')
    }
    
    // Also show foreign key relationships
    console.log('🔗 FOREIGN KEY RELATIONSHIPS')
    console.log('='.repeat(50))
    
    const foreignKeys = await sql`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `
    
    if (foreignKeys.length === 0) {
      console.log('❌ No foreign key relationships found')
    } else {
      foreignKeys.forEach(fk => {
        console.log(`🔗 ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`)
      })
    }
    
    console.log('\n✅ Schema analysis complete!')
    
  } catch (error) {
    console.error('❌ Error analyzing schema:', error)
    process.exit(1)
  }
}

main().catch(e => { 
  console.error('❌ Script failed:', e); 
  process.exit(1) 
})
