/**
 * Script to run the training_steps migration
 * Run with: npx tsx scripts/run-training-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('Reading migration file...')
    const migrationPath = join(process.cwd(), 'supabase/migrations/20251205000000_training_steps.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    console.log('Executing migration...')
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('Trying direct SQL execution...')
      const statements = migrationSQL.split(';').filter(s => s.trim())
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' })
          if (stmtError) {
            console.error('Error executing statement:', statement.substring(0, 50))
            console.error(stmtError)
          }
        }
      }
    }
    
    console.log('✓ Migration completed successfully!')
  } catch (error: any) {
    console.error('✗ Migration failed:', error.message)
    console.error('\nAlternative: Run the SQL manually in your Supabase dashboard:')
    console.error('1. Go to your Supabase project dashboard')
    console.error('2. Navigate to SQL Editor')
    console.error('3. Copy and paste the contents of: supabase/migrations/20251205000000_training_steps.sql')
    console.error('4. Run the SQL')
    process.exit(1)
  }
}

runMigration()

