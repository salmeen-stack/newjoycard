'use client'
import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'

interface ScanResult { valid:boolean; alreadyScanned:boolean; message:string; guest?:{name:string;card_type:string;dress_code:string;event_title:string;scanned_at?:string} }
interface Recent { name:string; card_type:string; time:string }
interface GuestInfo {
  id: string
  qr_token: string
  name: string
  card_type: string
  dress_code: string
  event_title: string
}

interface CenterNotificationProps {
  type: 'success' | 'warning' | 'error'
  message: string
  guestInfo?: GuestInfo
  onClose: () => void
}

function CenterNotification({ type, message, guestInfo, onClose }: CenterNotificationProps) {
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
             type === 'warning' ? 'Already Checked In' :
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

function Content() {
  const sp = useSearchParams()
  const eventId = sp.get('event')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult|null>(null)
  const [recent, setRecent] = useState<Recent[]>([])
  const [count, setCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [capturedGuest, setCapturedGuest] = useState<GuestInfo | null>(null)
  const [centerNotification, setCenterNotification] = useState<{
    type: 'success' | 'warning' | 'error'
    message: string
    guestInfo?: GuestInfo
  } | null>(null)
  const scanRef = useRef<{stop:()=>Promise<void>}|null>(null)
  const busy = useRef(false)
  const scannerActive = useRef(false)

  const handleScan = useCallback(async (token: string) => {
    if (busy.current) return
    busy.current = true
    
    try {
      // Parse QR code to extract guest info without auto-verifying
      const response = await fetch(`/api/invitations/${token}/parse`, { method: 'POST' })
      
      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type')
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error('API returned HTML error page - check server logs')
      }
      
      const data = await response.json()
      
      if (data.guest) {
        setCapturedGuest(data.guest)
        setShowConfirmModal(true)
        // Don't show result notification when opening modal
        // The notification will be shown after modal interaction
        busy.current = false
      } else {
        setResult({
          valid: false,
          alreadyScanned: false,
          message: data.error || 'Invalid QR code'
        })
        setTimeout(() => { setResult(null); busy.current = false }, 3000)
      }
    } catch (error: unknown) {
      setResult({
        valid: false,
        alreadyScanned: false,
        message: `Scan error: ${(error as Error)?.message || 'Failed to scan QR code'}`
      })
      setTimeout(() => { setResult(null); busy.current = false }, 3000)
    }
  }, [])

  const handleConfirmCheckIn = async () => {
    if (!capturedGuest) return
    
    try {
      // Use QR token for verify API
      const response = await fetch(`/api/invitations/verify/${capturedGuest.qr_token}`, { method: 'POST' })
      const data = await response.json()
      
      if (data.valid) {
        // Close modal immediately
        setShowConfirmModal(false)
        setCapturedGuest(null)
        
        // Show center notification after modal closes
        setTimeout(() => {
          setCenterNotification({
            type: 'success',
            message: 'Guest checked in successfully',
            guestInfo: data.guest
          })
        }, 300) // Wait for modal animation to complete
        
        setCount(c => c + 1)
        setRecent(prev => [{name: data.guest!.name, card_type: data.guest!.card_type, time: new Date().toLocaleTimeString()}, ...prev.slice(0, 9)])
      } else {
        // For already scanned guests, close modal then show notification
        setShowConfirmModal(false)
        setCapturedGuest(null)
        
        setTimeout(() => {
          setCenterNotification({
            type: 'warning',
            message: data.alreadyScanned ? 'Guest was already checked in' : 'Guest already checked in',
            guestInfo: data.guest
          })
        }, 300)
      }
    } catch (error: unknown) {
      // Close modal on error too
      setShowConfirmModal(false)
      setCapturedGuest(null)
      
      setTimeout(() => {
        setCenterNotification({
          type: 'error',
          message: 'Failed to check in guest'
        })
      }, 300)
    }
    
    busy.current = false
  }

  const handleCancelConfirm = () => {
    setShowConfirmModal(false)
    setCapturedGuest(null)
    busy.current = false
  }

  const start = useCallback(async () => {
    setError('')
    scannerActive.current = true
    
    try {
      // ✅ Production-safe HTTPS check
      const isSecureContext = location.protocol === 'https:' || 
                             location.hostname === 'localhost' || 
                             location.hostname === '127.0.0.1'
      
      if (!isSecureContext) {
        throw new Error('Camera access requires HTTPS in production. Please ensure your site is served over HTTPS.')
      }
      
      // Enhanced camera permission check
      try {
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName })
        if (permissions.state === 'denied') {
          throw new Error('Camera access denied. Please enable camera permissions in your browser settings.')
        }
      } catch (permError) {
        // Permission query failed, continuing silently
      }
      
      // Enhanced camera API support check
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.')
      }
      
      // Production-safe import with error handling
      let Html5Qrcode
      try {
        const module = await import('html5-qrcode')
        Html5Qrcode = module.Html5Qrcode
      } catch (importError) {
        throw new Error('Failed to load QR scanner library. Please refresh the page and try again.')
      }
      
      // Create scanner with error handling
      let scanner
      try {
        // Small delay to ensure DOM is updated
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Check if container exists and is visible
        const container = document.getElementById('qr-reader')
        if (!container) {
          throw new Error('QR scanner container not found')
        }
        
        // Force container to be visible
        container.style.display = 'block'
        container.style.visibility = 'visible'
        
        scanner = new Html5Qrcode('qr-reader')
        scanRef.current = scanner
      } catch (scannerError) {
        throw new Error('Failed to initialize QR scanner. Please refresh the page and try again.')
      }
      
      // Production-safe camera configuration with fallback
      const getCameraConfig = () => {
        const config = Object.freeze({ facingMode: 'environment' })
        return config
      }
      
      const cameraConfig = getCameraConfig()
      
      // Double validation before starting
      // Validate config before starting
      if (typeof cameraConfig !== 'object' || Object.keys(cameraConfig).length !== 1) {
        throw new Error('Invalid camera configuration detected. Please refresh the page.')
      }
      
      // Enhanced scanner start with comprehensive error handling
      await scanner.start(
        cameraConfig, // Exactly one key
        { 
          fps: 10, 
          qrbox: { width: 260, height: 260 },
          // Additional production-safe options
          disableFlip: false
        },
        async (text) => {
          try {
            // Handle full URLs and direct tokens
            let token = text
            
            // Extract token from full URL
            if (text.includes('/invite/')) {
              token = text.split('/invite/')[1]
            } else if (text.includes('/verify/')) {
              token = text.split('/verify/')[1]
            }
            
            // Validate token format
            const tokenMatch = token.match(/^[a-f0-9-]{36}$/)
            if (tokenMatch) {
              await handleScan(token)
            }
          } catch (scanError) {
            // Error handled silently
          }
        },
        (errorMessage) => {
          // Enhanced error filtering - ignore common scanner errors
          if (errorMessage.includes('No QR code found') || 
              errorMessage.includes('No barcode or QR code detected')) {
            // Don't show error for normal scanning state
            return
          }
          
          // Show helpful error messages for common issues
          let userFriendlyMessage = errorMessage
          if (errorMessage.includes('No MultiFormat Readers were able to detect the code')) {
            userFriendlyMessage = 'QR code not clear. Please hold the QR code steady and well-lit.'
          } else if (errorMessage.includes('Camera access denied') || errorMessage.includes('NotAllowedError')) {
            userFriendlyMessage = 'Camera permission denied. Please allow camera access in your browser settings.'
          } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('no camera')) {
            userFriendlyMessage = 'No camera found. Please ensure your device has a working camera.'
          } else if (errorMessage.includes('NotReadableError') || errorMessage.includes('already in use')) {
            userFriendlyMessage = 'Camera is already in use by another application. Please close other apps using the camera.'
          } else if (errorMessage.includes('HTTPS') || errorMessage.includes('secure')) {
            userFriendlyMessage = 'Camera requires HTTPS. Please ensure you are accessing this page over a secure connection.'
          } else if (errorMessage.includes('not supported') || errorMessage.includes('getUserMedia')) {
            userFriendlyMessage = 'Camera not supported. Please use a modern browser like Chrome, Firefox, or Safari.'
          }
          
          setError(`Scanner error: ${userFriendlyMessage}`)
        }
      )
      
      setScanning(true) // Set scanning to true after successful start
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      
      // Enhanced production error messages
      if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
        setError('Camera access denied. Please allow camera access and try again.')
      } else if (errorMsg.includes('NotFoundError') || errorMsg.includes('no camera')) {
        setError('No camera found. Please ensure your device has a camera.')
      } else if (errorMsg.includes('NotReadableError') || errorMsg.includes('already in use')) {
        setError('Camera is already in use by another application.')
      } else if (errorMsg.includes('HTTPS') || errorMsg.includes('secure')) {
        setError('Camera requires HTTPS connection. Please ensure your site is served over HTTPS.')
      } else if (errorMsg.includes('not supported') || errorMsg.includes('getUserMedia')) {
        setError('Camera API not supported. Please use Chrome, Firefox, or Safari on a mobile device.')
      } else if (errorMsg.includes('object should have exactly 1 key')) {
        setError('Camera configuration error. Please refresh the page and try again.')
      } else if (errorMsg.includes('Failed to load') || errorMsg.includes('Failed to initialize')) {
        setError('Scanner library error. Please refresh the page and try again.')
      } else {
        setError(`Camera error: ${errorMsg}`)
      }
      scannerActive.current = false
      setScanning(false)
    }
  }, [handleScan])

  async function stop() {
    if (scanRef.current) { 
      try { 
        await scanRef.current.stop() 
      } catch {} 
      scanRef.current = null 
    }
    scannerActive.current = false
    setScanning(false)
    setResult(null)
  }

  useEffect(()=>{
    return () => {
      if(scanRef.current && !scannerActive.current) {
        scanRef.current.stop().catch(()=>{})
      }
    }
  },[scanning])

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-6 sm:mb-8">
        <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Staff · Check-In</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cream">QR Scanner</h1>
        {eventId && <p className="text-cream/35 text-sm mt-1">Event #{eventId}</p>}
      </motion.div>

      <div className="flex gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="flex-1 stat-card"><p className="font-display text-2xl font-bold text-teal">{count}</p><p className="text-cream/30 text-xs uppercase tracking-widest mt-1">This Session</p></div>
        <div className="flex-1 stat-card"><p className={`font-display text-2xl font-bold ${scanning?'text-teal':'text-cream/40'}`}>{scanning?'Active':'Stopped'}</p><p className="text-cream/30 text-xs uppercase tracking-widest mt-1">Scanner</p></div>
      </div>

      <div className="glass-gold p-4 sm:p-6 mb-5">
        <div id="qr-reader" className={`w-full rounded-xl overflow-hidden ${!scanning ? 'hidden' : 'block'}`} style={{minHeight: 280, backgroundColor: '#000'}} />
        {!scanning && (
          <div className="flex flex-col items-center py-8 sm:py-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-5 sm:mb-6 float">
              <i className="fa-solid fa-qrcode text-gold text-2xl sm:text-3xl" />
            </div>
            <h3 className="font-display text-xl text-cream mb-2">Camera Ready</h3>
            <p className="text-cream/35 text-sm text-center mb-6">Press start to activate the QR scanner.</p>
            {error && (
              <div className="mb-6 w-full">
                <p className="text-rose-400 text-sm bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-2 mb-4 text-center">{error}</p>
                <div className="text-center">
                  <p className="text-cream/35 text-xs mb-3">Having camera issues?</p>
                  <a href={`/staff/scan-manual${eventId ? '?event=' + eventId : ''}`} className="text-gold hover:text-gold/70 text-sm underline">
                    Try Manual Entry Instead
                  </a>
                </div>
              </div>
            )}
            
            <button onClick={start} className="btn-gold w-full sm:w-auto px-12 py-4">Start Scanner</button>
          </div>
        )}
        {scanning && <div className="flex justify-center mt-4"><button onClick={stop} className="btn-ghost w-full sm:w-auto px-8">Stop Scanner</button></div>}
      </div>

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

      {recent.length>0 && (
        <div className="glass-gold p-4 sm:p-5">
          <h3 className="font-display text-base font-semibold text-cream mb-4">Recent Check-ins</h3>
          <div className="space-y-2">
            {recent.map((r,i)=>(
              <motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div><p className="text-cream text-sm font-medium">{r.name}</p><p className="text-cream/30 text-xs">{r.card_type} entry</p></div>
                <p className="text-teal text-xs">{r.time}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function StaffScan() {
  return <Suspense fallback={<div className="p-8 text-cream/30">Loading…</div>}><Content /></Suspense>
}
