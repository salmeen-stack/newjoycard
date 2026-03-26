'use client'
import { useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

interface GuestInfo {
  name: string
  card_type: string
  dress_code: string
  event_title: string
}

interface CheckInResult {
  valid: boolean
  alreadyScanned: boolean
  message: string
  guest?: GuestInfo
}

function CenterNotification({ type, message, guestInfo, onClose }: { 
  type: 'success' | 'warning' | 'error'
  message: string
  guestInfo?: GuestInfo
  onClose: () => void
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-gold p-6 rounded-2xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            type === 'success' ? 'bg-teal/20 border border-teal/20' :
            type === 'warning' ? 'bg-amber-500/20 border border-amber-500/20' :
            'bg-rose-500/20 border border-rose-500/20'
          }`}>
            <i className={`text-2xl sm:text-3xl ${
              type === 'success' ? 'fa-solid fa-circle-check text-teal' :
              type === 'warning' ? 'fa-solid fa-triangle-exclamation text-amber-400' :
              'fa-solid fa-circle-xmark text-rose-400'
            }`} />
          </div>
          <h3 className="font-display text-xl text-cream mb-2">
            {type === 'success' ? 'Check-in Successful' :
             type === 'warning' ? 'Token Already Used' :
             'Check-in Failed'}
          </h3>
        </div>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className={`font-semibold mb-4 ${
              type === 'success' ? 'text-teal' :
              type === 'warning' ? 'text-amber-400' :
              'text-rose-400'
            }`}>{message}</p>
            
            {guestInfo && (
              <div className="bg-white/5 rounded-xl p-4 text-left">
                <h4 className="font-display text-cream mb-3 text-center">Guest Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cream/60">Name:</span>
                    <span className="text-cream font-medium">{guestInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/60">Card Type:</span>
                    <span className="text-cream font-medium">{guestInfo.card_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/60">Event:</span>
                    <span className="text-cream font-medium">{guestInfo.event_title}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="btn-gold w-full py-3 mt-6"
        >
          <i className="fa-solid fa-check mr-2"></i>
          OK
        </button>
      </motion.div>
    </motion.div>
  )
}

function SMSCheckInContent() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [centerNotification, setCenterNotification] = useState<{
    type: 'success' | 'warning' | 'error'
    message: string
    guestInfo?: GuestInfo
  } | null>(null)
  const sp = useSearchParams()
  const eventId = sp.get('event')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      toast.error('Please enter a 6-digit token')
      return
    }

    if (!/^\d{6}$/.test(token)) {
      toast.error('Token must be exactly 6 digits')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`/api/invitations/sms-verify/${token}`, {
        method: 'POST'
      })
      
      const data: CheckInResult = await response.json()
      
      if (data.valid) {
        setCenterNotification({
          type: 'success',
          message: data.message,
          guestInfo: data.guest
        })
        setToken('') // Clear token on success
      } else {
        setCenterNotification({
          type: data.alreadyScanned ? 'warning' : 'error',
          message: data.message,
          guestInfo: data.guest
        })
        setToken('') // Clear token on error too
      }
    } catch (error) {
      setCenterNotification({
        type: 'error',
        message: 'Failed to verify token. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setToken(value)
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-6 sm:mb-10">
        <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Staff</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cream">SMS Token Check-in</h1>
        <p className="text-cream/35 text-sm mt-1">Verify guests using 6-digit SMS tokens</p>
      </motion.div>

      <div className="glass-gold p-4 sm:p-6 mb-5 sm:mb-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="label">Event ID</label>
            <input 
              className="input"
              value={eventId || ''}
              readOnly
              placeholder="Event ID will be set automatically"
            />
          </div>

          <div className="mb-6">
            <label className="label">6-Digit SMS Token</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={token}
              onChange={handleTokenChange}
              className="input text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              disabled={loading}
              required
            />
            <p className="text-cream/35 text-xs mt-2">Enter the 6-digit token provided to the guest</p>
          </div>

          <button
            type="submit"
            disabled={loading || token.length !== 6}
            className="btn-gold w-full"
          >
            {loading ? (
              'Verifying...'
            ) : (
              <><i className="fa-solid fa-mobile-alt mr-2"/>Verify Token & Check-in</>
            )}
          </button>
        </form>
      </div>

      {/* Instructions */}
      <div className="glass-gold p-4 sm:p-6 mb-5">
        <h3 className="font-display text-lg text-cream mb-4">How it works:</h3>
        <ol className="space-y-2 text-cream/80 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-gold font-bold">1.</span>
            <span>Guest receives a 6-digit SMS token (e.g., 123456)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold font-bold">2.</span>
            <span>Guest provides the token to staff at check-in</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold font-bold">3.</span>
            <span>Staff enters the token here to verify and check-in</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold font-bold">4.</span>
            <span>Token becomes invalid after one-time use</span>
          </li>
        </ol>
      </div>

      {/* Center Notification */}
      <AnimatePresence>
        {centerNotification && (
          <CenterNotification
            type={centerNotification.type}
            message={centerNotification.message}
            guestInfo={centerNotification.guestInfo}
            onClose={() => setCenterNotification(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SMSCheckInPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-cream">Loading...</div></div>}>
      <SMSCheckInContent />
    </Suspense>
  )
}
