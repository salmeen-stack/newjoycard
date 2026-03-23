'use client'
import { useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

interface GuestInfo {
  id: string
  qr_token: string
  name: string
  card_type: string
  dress_code: string
  event_title: string
}

function ConfirmModal({ guestInfo, onConfirm, onCancel }: { 
  guestInfo: GuestInfo
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-gold p-6 rounded-2xl max-w-md w-full mx-4"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gold/20 border border-gold/20 flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-qrcode text-gold text-2xl sm:text-3xl" />
          </div>
          <h3 className="font-display text-xl text-cream mb-2">Confirm Guest Check-In</h3>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-cream/60 text-sm mb-1">Guest Name</p>
            <p className="font-display text-lg text-cream">{guestInfo.name}</p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-cream/60 text-sm mb-1">Card Type</p>
            <p className="font-display text-lg text-cream">{guestInfo.card_type}</p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-cream/60 text-sm mb-1">Dress Code</p>
            <p className="font-display text-lg text-cream">{guestInfo.dress_code}</p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-cream/60 text-sm mb-1">Event</p>
            <p className="font-display text-lg text-cream">{guestInfo.event_title}</p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="btn-ghost flex-1 py-3"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-gold flex-1 py-3"
          >
            <i className="fa-solid fa-check mr-2"></i>
            Check In Guest
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ManualScanContent() {
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState<{valid: boolean; message: string; guest?: any; alreadyScanned?: boolean} | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [capturedGuest, setCapturedGuest] = useState<GuestInfo | null>(null)
  const sp = useSearchParams()
  const eventId = sp.get('event')

  async function handleManualScan() {
    const qrCode = prompt('Enter QR code token (36-character UUID like: 550e8400-e29b-41d4-a716-446655440000):')
    if (!qrCode) return
    
    setScanning(true)
    try {
      // Use parse API first to get guest info
      const res = await fetch(`/api/invitations/${qrCode}/parse`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.guest) {
        setCapturedGuest(data.guest)
        setShowConfirmModal(true)
        setLastScan({
          valid: true,
          message: data.guest.scanned_at ? 'Guest already checked in' : 'Guest found - ready to check in',
          guest: data.guest,
          alreadyScanned: data.guest.scanned_at ? true : false
        })
      } else {
        setLastScan({
          valid: false,
          message: data.error || 'Invalid QR code'
        })
        toast.error(data.error || 'Invalid QR code')
      }
    } catch (error) {
      console.error('Manual scan error:', error)
      setLastScan({
        valid: false,
        message: 'Failed to verify QR code'
      })
      toast.error('Failed to verify QR code')
    } finally {
      setScanning(false)
    }
  }

  // Debug function to test with sample token
  const testWithSample = () => {
    const sampleToken = '550e8400-e29b-41d4-a716-446655440000'
    if (confirm(`Test with sample token: ${sampleToken}?`)) {
      handleManualScanWithToken(sampleToken)
    }
  }

  const handleManualScanWithToken = async (qrCode: string) => {
    setScanning(true)
    try {
      console.log('Testing with token:', qrCode)
      const res = await fetch(`/api/invitations/${qrCode}/parse`, {
        method: 'POST'
      })
      const data = await res.json()
      console.log('Parse response:', data)
      
      if (data.guest) {
        setCapturedGuest(data.guest)
        setShowConfirmModal(true)
        setLastScan({
          valid: true,
          message: data.guest.scanned_at ? 'Guest already checked in' : 'Guest found - ready to check in',
          guest: data.guest,
          alreadyScanned: data.guest.scanned_at ? true : false
        })
      } else {
        setLastScan({
          valid: false,
          message: data.error || 'Invalid QR code'
        })
        toast.error(data.error || 'Invalid QR code')
      }
    } catch (error) {
      console.error('Manual scan error:', error)
      setLastScan({
        valid: false,
        message: 'Failed to verify QR code'
      })
      toast.error('Failed to verify QR code')
    } finally {
      setScanning(false)
    }
  }

  const handleConfirmCheckIn = async () => {
    if (!capturedGuest) return
    
    try {
      const response = await fetch(`/api/invitations/verify/${capturedGuest.qr_token}`, { method: 'POST' })
      const data = await response.json()
      
      if (data.valid) {
        toast.success(`${data.guest?.name || 'Guest'} checked in successfully!`)
        setLastScan({
          valid: true,
          message: 'Guest checked in successfully',
          guest: data.guest,
          alreadyScanned: false
        })
      } else {
        toast.error(data.message || 'Failed to check in guest')
        setLastScan({
          valid: false,
          message: data.message || 'Failed to check in guest'
        })
      }
    } catch (error) {
      toast.error('Failed to check in guest')
    }
    
    setShowConfirmModal(false)
    setCapturedGuest(null)
  }

  const handleCancelConfirm = () => {
    setShowConfirmModal(false)
    setCapturedGuest(null)
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-6 sm:mb-10">
        <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Staff</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cream">Manual QR Entry</h1>
        <p className="text-cream/35 text-sm mt-1">Enter QR code token manually when camera access is not available</p>
        <p className="text-cream/25 text-xs mt-2">QR tokens are 36-character UUIDs (e.g., 550e8400-e29b-41d4-a716-446655440000)</p>
      </motion.div>

      <div className="glass-gold p-4 sm:p-6 mb-5 sm:mb-6">
        <div className="mb-4">
          <label className="label">Event ID</label>
          <input 
            className="input"
            value={eventId || ''}
            readOnly
            placeholder="Event ID will be set automatically"
          />
        </div>

        <button
          onClick={handleManualScan}
          disabled={scanning}
          className="btn-gold w-full mb-3"
        >
          {scanning ? 'Scanning...' : <><i className="fa-solid fa-qrcode mr-2"/>Enter QR Token</>}
        </button>

        {/* Debug Test Button */}
        <button
          onClick={testWithSample}
          disabled={scanning}
          className="btn-ghost w-full text-sm"
        >
          🧪 Test with Sample Token
        </button>
      </div>

      {lastScan && (
        <motion.div
          initial={{opacity:0,y:20}}
          animate={{opacity:1,y:0}}
          className={`glass-gold p-6 mb-4 border-l-2 ${
            lastScan.valid ? 'border-teal/20' : 'border-red-500/20'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-cream">
              {lastScan.valid
                ? <><i className="fa-solid fa-circle-check text-teal mr-2"/>Scan Successful</>
                : <><i className="fa-solid fa-circle-xmark text-rose-400 mr-2"/>Scan Failed</>}
            </h3>
            <span className={`badge ${
              lastScan.valid ? 'badge-teal' : 'badge-red-400'
            }`}>
              {lastScan.alreadyScanned ? 'Already Checked In' : lastScan.valid ? 'Valid' : 'Invalid'}
            </span>
          </div>

          <div className="text-cream/80 text-sm mb-4">
            <p className="font-medium">{lastScan.message}</p>
            {lastScan.guest && (
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <h4 className="font-display text-cream mb-2">Guest Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-cream/45">Name:</span>
                    <p className="text-cream font-medium">{lastScan.guest.name}</p>
                  </div>
                  <div>
                    <span className="text-cream/45">Event:</span>
                    <p className="text-cream font-medium">{lastScan.guest.event_title}</p>
                  </div>
                  <div>
                    <span className="text-cream/45">Entry:</span>
                    <p className="text-cream font-medium">{lastScan.guest.card_type}</p>
                  </div>
                  <div>
                    <span className="text-cream/45">Dress Code:</span>
                    <p className="text-cream font-medium">{lastScan.guest.dress_code}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setLastScan(null)}
            className="btn-gold w-full"
          >
            Clear Result
          </button>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && capturedGuest && (
          <ConfirmModal
            guestInfo={capturedGuest}
            onConfirm={handleConfirmCheckIn}
            onCancel={handleCancelConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ManualScanPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-cream">Loading...</div></div>}>
      <ManualScanContent />
    </Suspense>
  )
}
