-- Add SMS token support for analog phone guests
-- This migration adds minimal, backward-compatible changes for SMS-based check-in

-- Add sms_token column for 6-digit numeric tokens (NULL for non-SMS guests)
ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS sms_token VARCHAR(6) UNIQUE;

-- Add sms_used column to track one-time usage (NULL for non-SMS guests)
ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS sms_used BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_sms_token ON invitations(sms_token);
CREATE INDEX IF NOT EXISTS idx_invitations_sms_used ON invitations(sms_used);

-- Add comments to document the new columns
COMMENT ON COLUMN invitations.sms_token IS '6-digit numeric token for SMS-based guests (NULL for digital guests)';
COMMENT ON COLUMN invitations.sms_used IS 'Whether the SMS token has been used for one-time check-in';

-- Verification: Check if columns were added successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'invitations' AND column_name IN ('sms_token', 'sms_used');
