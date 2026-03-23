'use client'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Home() {
  const [invitationCards, setInvitationCards] = useState<Array<{id: string, name: string, event: string, date: string}>>([])

  useEffect(() => {
    // Fetch some sample invitation cards from web
    const sampleCards = [
      { id: '1', name: 'John Doe', event: 'Tech Conference 2024', date: '2024-03-15' },
      { id: '2', name: 'Sarah Chen', event: 'Wedding Expo', date: '2024-04-20' },
      { id: '3', name: 'Michael Rodriguez', event: 'Corporate Gala', date: '2024-05-10' },
      { id: '4', name: 'Emily Johnson', event: 'Annual Summit', date: '2024-06-05' },
      { id: '5', name: 'David Kim', event: 'Product Launch', date: '2024-07-15' },
      { id: '6', name: 'Lisa Wang', event: 'Charity Ball', date: '2024-08-20' },
    ]
    setInvitationCards(sampleCards)
  }, [])

  // Double cards for seamless loop (CSS handles the rest)
  const doubledCards = [...invitationCards, ...invitationCards]

  return (
    <main className="min-h-screen bg-navy-900 overflow-hidden">
      {/* CSS for infinite scrolling */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .scrolling-content {
          animation: scroll 30s linear infinite;
          display: flex;
          gap: 20px;
          width: fit-content;
        }

        .scrolling-container {
          overflow: hidden;
          width: 100%;
        }
      `}</style>
      {/* Ambient glow blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gold/5 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-gold/3 blur-[160px] pointer-events-none" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 max-w-7xl mx-auto">
        <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center">
            <i className="fa-solid fa-star text-gold" style={{fontSize:'0.75rem'}}/>
          </div>
          <span className="font-display text-2xl text-gold font-semibold tracking-widest">joycard</span>
        </motion.div>
        <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="flex gap-2 sm:gap-3">
          <Link href="/login" className="btn-ghost py-2 px-4 sm:px-5 text-xs">
            <i className="fa-solid fa-right-to-bracket mr-1.5"/>
            <span className="hidden sm:inline">Staff / </span>Organizer
          </Link>
          <Link href="/admin/login" className="btn-gold py-2 px-4 sm:px-5 text-xs">
            <i className="fa-solid fa-crown mr-1.5"/>Admin
          </Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-24">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.1}}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/20 bg-gold/5 mb-8">
          <span className="pulse-dot bg-teal animate-pulse" />
          <span className="text-xs tracking-widest uppercase text-gold/70">Invitation Management System</span>
        </motion.div>

        <motion.h1 initial={{opacity:0,x:-100}} animate={{opacity:1,x:0}} transition={{delay:.2, duration:0.8, ease:[0.16,1,0.3,1]}}
          className="font-display text-4xl sm:text-6xl md:text-8xl font-bold text-cream leading-none mb-6 max-w-4xl">
          <motion.span initial={{opacity:0,x:-50}} animate={{opacity:1,x:0}} transition={{delay:.3, duration:0.6, ease:[0.16,1,0.3,1]}}>
            Craft 
          </motion.span>
          <motion.span initial={{opacity:0,x:-50}} animate={{opacity:1,x:0}} transition={{delay:.4, duration:0.6, ease:[0.16,1,0.3,1]}} className="text-gold">
            Moments
          </motion.span>
          <br />
          <motion.span initial={{opacity:0,x:-50}} animate={{opacity:1,x:0}} transition={{delay:.5, duration:0.6, ease:[0.16,1,0.3,1]}}>
            Worth Remembering
          </motion.span>
        </motion.h1>

        <motion.p initial={{opacity:0,x:-80}} animate={{opacity:1,x:0}} transition={{delay:.6, duration:0.8, ease:[0.16,1,0.3,1]}}
          className="text-base sm:text-lg text-cream/50 max-w-xl mb-10 leading-relaxed px-2">
          Complete digital invitation management — elegant card delivery, WhatsApp &amp; Email sending, and secure QR check-in.
        </motion.p>

        <motion.div initial={{opacity:0,x:-60}} animate={{opacity:1,x:0}} transition={{delay:.7, duration:0.6, ease:[0.16,1,0.3,1]}}
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0 mb-12">
          <motion.div whileHover={{scale:1.05}} whileTap={{scale:0.98}} transition={{type:"spring", stiffness:400, damping:25}}>
            <Link href="/login" className="btn-gold px-8 sm:px-10 py-4 text-center block">
              <i className="fa-solid fa-arrow-right mr-2"/>Get Started
            </Link>
          </motion.div>
          <motion.div whileHover={{scale:1.05}} whileTap={{scale:0.98}} transition={{type:"spring", stiffness:400, damping:25}}>
            <Link href="/admin/login" className="btn-ghost px-8 sm:px-10 py-4 text-center block">
              <i className="fa-solid fa-crown mr-2"/>Admin Portal
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.65}}
          className="flex flex-wrap justify-center gap-6 sm:gap-10">
          {[
            { icon:'fa-calendar-days', label:'Events', val:'Any size' },
            { icon:'fa-paper-plane',   label:'Delivery', val:'WhatsApp & Email' },
            { icon:'fa-qrcode',        label:'Check-in', val:'Instant QR scan' },
          ].map((s,i)=>(
            <div key={i} className="flex items-center gap-2.5 text-cream/40">
              <i className={`fa-solid ${s.icon} text-gold/50`} style={{fontSize:'1.125rem'}}/>
              <span className="text-xs tracking-wide">{s.val}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Feature cards */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="section-label">
          <i className="fa-solid fa-sparkles mr-2 text-gold/40"/>How it works
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {[
            {
              icon:'fa-crown', title:'Admin', color:'gold',
              desc:'Full system control — create events, manage teams, and get real-time insights.',
              items:[
                {icon:'fa-calendar-plus', text:'Create & manage events'},
                {icon:'fa-users-gear',    text:'Assign organizers & staff'},
                {icon:'fa-chart-pie',     text:'Full analytics'},
                {icon:'fa-shield-halved', text:'System oversight'},
              ]
            },
            {
              icon:'fa-envelope', title:'Organizer', color:'teal',
              desc:'Manage guest lists and send beautiful digital invitations instantly.',
              items:[
                {icon:'fa-image',       text:'Upload invitation cards'},
                {icon:'fa-list-check',  text:'Manage guest lists'},
                {icon:'fa-share-nodes', text:'Send via WhatsApp or Email'},
                {icon:'fa-chart-line',  text:'Track delivery status'},
              ]
            },
            {
              icon:'fa-mobile-screen', title:'Staff', color:'gold',
              desc:'Run smooth event check-ins with the live QR scanner.',
              items:[
                {icon:'fa-qrcode',        text:'Live QR scanner'},
                {icon:'fa-gauge-high',    text:'Real-time check-in stats'},
                {icon:'fa-ban',           text:'Duplicate scan prevention'},
                {icon:'fa-circle-check',  text:'Guest verification'},
              ]
            },
          ].map((c,i) => (
            <motion.div key={i} 
              initial={{opacity:0,y:30}} 
              whileInView={{opacity:1,y:0}}
              viewport={{once:true}} 
              transition={{delay:i*.12, duration:0.5, ease:[0.16,1,0.3,1]}}
              whileHover={{ 
                scale: 1.05, 
                y: -8,
                boxShadow: "0 20px 40px rgba(255,215,0,0.15)",
                transition: { duration: 0.3, ease: [0.16,1,0.3,1] }
              }}
              className="glass-gold p-6 sm:p-8 group cursor-pointer relative overflow-hidden">
              
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Icon with enhanced hover */}
              <motion.div 
                whileHover={{ 
                  rotate: [0, -5, 5, 0],
                  scale: 1.1,
                  transition: { duration: 0.5, repeat: Infinity, repeatDelay: 2 }
                }}
                className={`feature-icon mb-4 ${c.color==='teal'?'feature-icon-teal':'feature-icon-gold'} relative z-10`}>
                <i className={`fa-solid ${c.icon}`} />
              </motion.div>
              
              {/* Title with hover effect */}
              <motion.h3 
                whileHover={{ x: 5 }}
                className={`font-display text-xl font-semibold mb-2 ${c.color==='teal'?'text-teal':'text-gold'} relative z-10 transition-colors duration-300 group-hover:text-cream`}>
                {c.title}
              </motion.h3>
              
              {/* Description with hover effect */}
              <motion.p 
                initial={{ opacity: 0.4 }}
                whileHover={{ opacity: 0.8 }}
                className="text-cream/40 text-sm mb-5 leading-relaxed relative z-10 transition-all duration-300 group-hover:text-cream/60">
                {c.desc}
              </motion.p>
              
              {/* Feature list with staggered hover */}
              <ul className="space-y-1.5 relative z-10">
                {c.items.map((it,j)=>(
                  <motion.li 
                    key={j} 
                    initial={{ x: 0 }}
                    whileHover={{ x: 8 }}
                    transition={{ delay: j * 0.05 }}
                    className="feature-list-item group/item">
                    <motion.span 
                      whileHover={{ 
                        scale: 1.2,
                        rotate: 360,
                        transition: { duration: 0.6, ease: [0.16,1,0.3,1] }
                      }}
                      className={`feature-list-dot ${c.color==='teal'?'feature-list-dot-teal':'feature-list-dot-gold'}`}>
                      <i className={`fa-solid ${it.icon}`} style={{fontSize:'0.55rem'}}/>
                    </motion.span>
                    <motion.span 
                      whileHover={{ color: c.color === 'teal' ? '#14b8a6' : '#fbbf24' }}
                      className="transition-colors duration-300">
                      {it.text}
                    </motion.span>
                  </motion.li>
                ))}
              </ul>
              
              {/* Subtle glow effect on hover */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                   style={{
                     boxShadow: `inset 0 0 30px ${c.color === 'teal' ? 'rgba(20,184,166,0.1)' : 'rgba(251,191,36,0.1)'}`
                   }} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Animated Cards Section */}
      <section className="relative z-10 py-16 sm:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="text-center mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-cream mb-4">
              Trusted by Event Professionals Worldwide
            </h2>
            <p className="text-cream/60 text-lg">
              Join thousands of successful events powered by Joycard
            </p>
          </motion.div>
        </div>
        
        {/* Infinite Scrolling Cards - CSS Animation for seamless loop */}
        <div className="scrolling-container">
          <div className="scrolling-content">
            {doubledCards.map((card: {id: string, name: string, event: string, date: string}, i: number) => (
              <motion.div
                key={`row1-${i}`}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-gold p-4 rounded-xl min-w-[320px] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                    <i className="fa-solid fa-id-card text-gold text-sm" />
                  </div>
                  <div>
                    <p className="font-display text-lg text-cream">{card.name}</p>
                    <p className="text-gold text-sm font-medium">{card.event}</p>
                    <p className="text-cream/60 text-xs">{card.date}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Second Row - CSS Animation for seamless loop */}
        <div className="scrolling-container">
          <div className="scrolling-content" style={{animationDelay: '-15s'}}>
            {doubledCards.map((card: {id: string, name: string, event: string, date: string}, i: number) => (
              <motion.div
                key={`row2-${i}`}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-gold p-4 rounded-xl min-w-[320px] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                    <i className="fa-solid fa-id-card text-gold text-sm" />
                  </div>
                  <div>
                    <p className="font-display text-lg text-cream">{card.name}</p>
                    <p className="text-gold text-sm font-medium">{card.event}</p>
                    <p className="text-cream/60 text-xs">{card.date}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 site-footer px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12 border-t border-cream/10">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gold/10 border border-gold/20 flex items-center justify-center">
                <i className="fa-solid fa-star text-gold" style={{fontSize:'0.5rem'}}/>
              </div>
              <span className="font-display text-gold/60 text-sm font-semibold tracking-widest">joycard</span>
            </div>
            <p className="text-cream/40 text-sm leading-relaxed">
              Complete digital invitation management system for modern events. 
              Elegant card delivery, seamless check-ins, and real-time analytics.
            </p>
            <div className="flex gap-3 pt-2">
              <a href="#" className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center hover:bg-gold/20 transition-colors">
                <i className="fa-brands fa-facebook-f text-gold text-sm" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center hover:bg-gold/20 transition-colors">
                <i className="fa-brands fa-twitter text-gold text-sm" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center hover:bg-gold/20 transition-colors">
                <i className="fa-brands fa-instagram text-gold text-sm" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center hover:bg-gold/20 transition-colors">
                <i className="fa-brands fa-linkedin-in text-gold text-sm" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-display text-cream font-semibold text-sm tracking-wider uppercase">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-cream/40 hover:text-gold text-sm transition-colors">
                  <i className="fa-solid fa-right-to-bracket mr-2 text-xs"></i>
                  Staff / Organizer Login
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="text-cream/40 hover:text-gold text-sm transition-colors">
                  <i className="fa-solid fa-crown mr-2 text-xs"></i>
                  Admin Portal
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-cream/40 hover:text-gold text-sm transition-colors">
                  <i className="fa-solid fa-sparkles mr-2 text-xs"></i>
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-cream/40 hover:text-gold text-sm transition-colors">
                  <i className="fa-solid fa-tag mr-2 text-xs"></i>
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-display text-cream font-semibold text-sm tracking-wider uppercase">Contact</h3>
            <ul className="space-y-2">
              <li className="text-cream/40 text-sm">
                <i className="fa-solid fa-envelope mr-2 text-gold/60"></i>
                <a href="mailto:hello@joycard.app" className="hover:text-gold transition-colors">
                  hello@joycard.app
                </a>
              </li>
              <li className="text-cream/40 text-sm">
                <i className="fa-solid fa-phone mr-2 text-gold/60"></i>
                <a href="tel:+1234567890" className="hover:text-gold transition-colors">
                  +1 (234) 567-890
                </a>
              </li>
              <li className="text-cream/40 text-sm">
                <i className="fa-solid fa-mobile-alt mr-2 text-gold/60"></i>
                <a href="tel:+1987654321" className="hover:text-gold transition-colors">
                  +1 (987) 654-321
                </a>
              </li>
              <li className="text-cream/40 text-sm">
                <i className="fa-solid fa-headset mr-2 text-gold/60"></i>
                <a href="#" className="hover:text-gold transition-colors">
                  24/7 Support
                </a>
              </li>
            </ul>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-display text-cream font-semibold text-sm tracking-wider uppercase">Location</h3>
            <div className="space-y-3">
              <div className="text-cream/40 text-sm">
                <i className="fa-solid fa-building mr-2 text-gold/60"></i>
                <span className="block">Joycard Headquarters</span>
                <span className="block text-xs mt-1">123 Tech Street, Suite 100</span>
                <span className="block text-xs">San Francisco, CA 94105</span>
              </div>
              <div className="text-cream/40 text-sm">
                <i className="fa-solid fa-globe mr-2 text-gold/60"></i>
                <span className="block">Global Presence</span>
                <span className="block text-xs mt-1">United States, Europe, Asia</span>
                <span className="block text-xs">50+ Countries Worldwide</span>
              </div>
              <div className="text-cream/40 text-sm">
                <i className="fa-solid fa-clock mr-2 text-gold/60"></i>
                <span className="block">Business Hours</span>
                <span className="block text-xs mt-1">Mon-Fri: 9AM-6PM PST</span>
                <span className="block text-xs">24/7 Emergency Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center py-6 border-t border-cream/10">
          <p className="text-cream/20 text-xs tracking-widest mb-2 sm:mb-0">
            © {new Date().getFullYear()} joycard. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-cream/25 hover:text-cream/60 text-xs transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-cream/25 hover:text-cream/60 text-xs transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-cream/25 hover:text-cream/60 text-xs transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
