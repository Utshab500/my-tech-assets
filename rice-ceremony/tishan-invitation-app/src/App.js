import React from 'react';

/* ─────────── SVG Components ─────────── */

const PeacockBgPattern = () => (
  <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,overflow:'hidden',opacity:0.08,zIndex:0}}>
    <svg viewBox="0 0 700 1100" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
      <defs>
        <radialGradient id="eyeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a8a8a"/><stop offset="40%" stopColor="#1a7a5a"/>
          <stop offset="70%" stopColor="#1a3a6b"/><stop offset="100%" stopColor="transparent"/>
        </radialGradient>
        <pattern id="featherPat" x="0" y="0" width="140" height="160" patternUnits="userSpaceOnUse">
          <ellipse cx="70" cy="80" rx="30" ry="45" fill="none" stroke="#4a90d9" strokeWidth="1"/>
          <ellipse cx="70" cy="80" rx="18" ry="28" fill="none" stroke="#1a8a8a" strokeWidth="1"/>
          <ellipse cx="70" cy="80" rx="8" ry="12" fill="url(#eyeGrad)" opacity="0.6"/>
          <line x1="70" y1="125" x2="70" y2="160" stroke="#1a3a6b" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="700" height="1100" fill="url(#featherPat)"/>
    </svg>
  </div>
);

const CornerFlourish = ({style}) => (
  <div style={{position:'absolute',width:90,height:90,zIndex:3,...style}}>
    <svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
      <path d="M5 85 C5 45,5 25,25 10 C35 3,50 2,85 5" fill="none" stroke="#d4a843" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5 65 C8 40,12 25,30 15 C38 11,48 9,70 5" fill="none" stroke="#d4a843" strokeWidth="0.8" opacity="0.6" strokeLinecap="round"/>
      <circle cx="15" cy="15" r="3" fill="#d4a843" opacity="0.5"/>
      <path d="M20 20 C15 15,10 18,8 25 C6 32,12 28,20 20Z" fill="#d4a843" opacity="0.3"/>
      <path d="M25 12 C22 8,18 10,16 15 C14 20,19 18,25 12Z" fill="#d4a843" opacity="0.3"/>
    </svg>
  </div>
);

const PeacockFeatherEyeDivider = () => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',margin:'18px 0',gap:12}}>
    <div style={{flex:1,height:1,background:'linear-gradient(90deg,transparent,#d4a843,transparent)'}}/>
    <div style={{width:60,height:60,flexShrink:0}}>
      <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="fEye" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0d1f3c"/><stop offset="25%" stopColor="#1a8a8a"/>
            <stop offset="50%" stopColor="#1a7a5a"/><stop offset="70%" stopColor="#1e56a0"/>
            <stop offset="85%" stopColor="#4a90d9"/><stop offset="100%" stopColor="transparent"/>
          </radialGradient>
        </defs>
        <ellipse cx="30" cy="30" rx="28" ry="28" fill="none" stroke="#4a90d9" strokeWidth="0.8" opacity="0.4"/>
        <ellipse cx="30" cy="30" rx="22" ry="26" fill="none" stroke="#1a8a8a" strokeWidth="1" opacity="0.6"/>
        <ellipse cx="30" cy="30" rx="16" ry="20" fill="none" stroke="#1a7a5a" strokeWidth="1.2" opacity="0.7"/>
        <ellipse cx="30" cy="30" rx="10" ry="14" fill="none" stroke="#d4a843" strokeWidth="1.5" opacity="0.8"/>
        <ellipse cx="30" cy="30" rx="6" ry="8" fill="url(#fEye)"/>
        <ellipse cx="30" cy="30" rx="3" ry="4" fill="#0d1f3c"/>
        <ellipse cx="30" cy="28" rx="1.5" ry="1.5" fill="#f0c65a" opacity="0.7"/>
      </svg>
    </div>
    <div style={{flex:1,height:1,background:'linear-gradient(90deg,transparent,#d4a843,transparent)'}}/>
  </div>
);

const PeacockFeather = ({style}) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
    <path d="M50 95 Q48 60,50 30 Q52 60,50 95Z" fill="#1a7a5a" opacity="0.6"/>
    <path d="M50 10 Q30 25,35 45 Q40 55,50 50 Q60 55,65 45 Q70 25,50 10Z" fill="none" stroke="#4a90d9" strokeWidth="1.2"/>
    <path d="M50 15 Q35 28,38 42 Q42 50,50 46 Q58 50,62 42 Q65 28,50 15Z" fill="none" stroke="#1a8a8a" strokeWidth="1"/>
    <path d="M50 20 Q40 30,42 40 Q45 45,50 42 Q55 45,58 40 Q60 30,50 20Z" fill="none" stroke="#d4a843" strokeWidth="1"/>
    <ellipse cx="50" cy="32" rx="6" ry="8" fill="#0d1f3c" stroke="#1a8a8a" strokeWidth="0.8"/>
    <ellipse cx="50" cy="30" rx="2.5" ry="3.5" fill="#1a8a8a"/>
    <circle cx="50" cy="29" r="1.2" fill="#f0c65a"/>
  </svg>
);

const KrishnaFlute = () => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{width:100,height:100}}>
    <defs>
      <linearGradient id="fluteGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#c49730"/><stop offset="30%" stopColor="#f0c65a"/>
        <stop offset="50%" stopColor="#f7e5a0"/><stop offset="70%" stopColor="#f0c65a"/>
        <stop offset="100%" stopColor="#c49730"/>
      </linearGradient>
    </defs>
    <rect x="15" y="44" width="70" height="12" rx="6" fill="url(#fluteGrad)" transform="rotate(-15,50,50)"/>
    <circle cx="35" cy="48" r="2" fill="#8B6914" transform="rotate(-15,50,50)"/>
    <circle cx="45" cy="48" r="2" fill="#8B6914" transform="rotate(-15,50,50)"/>
    <circle cx="55" cy="48" r="2" fill="#8B6914" transform="rotate(-15,50,50)"/>
    <circle cx="65" cy="48" r="2" fill="#8B6914" transform="rotate(-15,50,50)"/>
    <text x="72" y="30" fontSize="16" fill="#f0c65a" opacity="0.6" fontFamily="serif">♪</text>
    <text x="80" y="22" fontSize="12" fill="#4a90d9" opacity="0.5" fontFamily="serif">♫</text>
    <text x="18" y="35" fontSize="10" fill="#4a90d9" opacity="0.4" fontFamily="serif">♪</text>
    <path d="M22 43 Q18 30,22 18 Q25 10,30 8" fill="none" stroke="#1a8a8a" strokeWidth="0.8"/>
    <ellipse cx="30" cy="8" rx="4" ry="6" fill="#1a7a5a" opacity="0.5" stroke="#4a90d9" strokeWidth="0.5"/>
    <circle cx="30" cy="7" r="1.5" fill="#f0c65a" opacity="0.6"/>
    <path d="M42 72 Q45 65,50 62 Q55 65,58 72" fill="none" stroke="#d4a843" strokeWidth="0.8" opacity="0.5"/>
    <path d="M38 74 Q42 66,50 60 Q58 66,62 74" fill="none" stroke="#d4a843" strokeWidth="0.6" opacity="0.4"/>
  </svg>
);

const SmallDivider = () => (
  <div style={{width:120,height:1,background:'linear-gradient(90deg,transparent,#d4a843,transparent)',margin:'0 auto'}}/>
);

const SmallPeacockDivider = ({style}) => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,...style}}>
    <div style={{flex:1,height:1,background:'linear-gradient(90deg,transparent,#d4a843,transparent)'}}/>
    <svg viewBox="0 0 30 30" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="15" cy="15" rx="8" ry="10" fill="none" stroke="#d4a843" strokeWidth="0.8"/>
      <ellipse cx="15" cy="15" rx="4" ry="5" fill="#1a8a8a" opacity="0.4"/>
      <circle cx="15" cy="14" r="1.5" fill="#f0c65a" opacity="0.6"/>
    </svg>
    <div style={{flex:1,height:1,background:'linear-gradient(90deg,transparent,#d4a843,transparent)'}}/>
  </div>
);

/* ─────────── Sparkle Particles ─────────── */

const particles = [
  {left:'10%',top:'15%',delay:'0s'},{left:'25%',top:'40%',delay:'0.8s'},
  {left:'45%',top:'20%',delay:'1.6s'},{left:'65%',top:'55%',delay:'2.4s'},
  {left:'80%',top:'30%',delay:'0.4s'},{left:'15%',top:'70%',delay:'1.2s'},
  {left:'50%',top:'80%',delay:'2.0s'},{left:'85%',top:'75%',delay:'2.8s'},
  {left:'35%',top:'90%',delay:'3.2s'},{left:'70%',top:'10%',delay:'1.8s'},
  {left:'90%',top:'50%',delay:'0.6s'},{left:'5%',top:'50%',delay:'3.0s'},
];


/* ─────────── CSS Keyframes (injected once) ─────────── */

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Great+Vibes&family=Noto+Sans+Bengali:wght@300;400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:linear-gradient(135deg,#0a1628 0%,#1a3a6b 50%,#0a1628 100%); min-height:100vh; }
    @keyframes sparkle {
      0%,100% { opacity:0; transform:translateY(0) scale(0.5); }
      50% { opacity:0.8; transform:translateY(-30px) scale(1); }
    }
    @keyframes fadeInUp {
      from { opacity:0; transform:translateY(20px); }
      to { opacity:1; transform:translateY(0); }
    }
    @keyframes glowPulse {
      0%,100% { filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 20px rgba(240,198,90,0.3)); }
      50% { filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 40px rgba(240,198,90,0.6)); }
    }
  `}</style>
);

/* ─────────── Main App ─────────── */

function App() {
  const fadeIn = (i) => ({
    animation: `fadeInUp 0.8s ease-out ${0.1 + i * 0.1}s both`
  });

  return (
    <>
      <GlobalStyles />
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh',padding:20,fontFamily:"'Cormorant Garamond',serif"}}>
        <div style={{width:700,maxWidth:'100%',position:'relative'}}>
          <div style={{
            background:'linear-gradient(180deg,#0d1f3c 0%,#122952 15%,#163670 40%,#122952 70%,#0d1f3c 100%)',
            borderRadius:12,position:'relative',overflow:'hidden',
            boxShadow:'0 0 60px rgba(26,86,160,0.4),0 0 120px rgba(212,168,67,0.15),inset 0 0 80px rgba(0,0,0,0.3)'
          }}>
            {/* Gold borders */}
            <div style={{position:'absolute',inset:8,border:'2px solid #d4a843',borderRadius:8,pointerEvents:'none',zIndex:2}}/>
            <div style={{position:'absolute',inset:14,border:'1px solid rgba(212,168,67,0.4)',borderRadius:6,pointerEvents:'none',zIndex:2}}/>

            <PeacockBgPattern />

            {/* Particles */}
            <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,overflow:'hidden',pointerEvents:'none',zIndex:0}}>
              {particles.map((p,i) => (
                <div key={i} style={{
                  position:'absolute',width:3,height:3,background:'#f0c65a',borderRadius:'50%',opacity:0,
                  left:p.left,top:p.top,animation:`sparkle 4s ease-in-out infinite ${p.delay}`
                }}/>
              ))}
            </div>

            {/* Corner flourishes */}
            <CornerFlourish style={{top:16,left:16}} />
            <CornerFlourish style={{top:16,right:16,transform:'scaleX(-1)'}} />
            <CornerFlourish style={{bottom:16,left:16,transform:'scaleY(-1)'}} />
            <CornerFlourish style={{bottom:16,right:16,transform:'scale(-1,-1)'}} />

            {/* Card content */}
            <div style={{padding:'50px 40px 45px',position:'relative',zIndex:1,textAlign:'center'}}>

              {/* OM */}
              <div style={{...fadeIn(0),marginBottom:8}}>
                <div style={{fontSize:36,color:'#f0c65a',textShadow:'0 0 20px rgba(240,198,90,0.5)',letterSpacing:4}}>ॐ</div>
              </div>

              {/* Shubh label */}
              <div style={{...fadeIn(1),marginBottom:6}}>
                <span style={{fontFamily:"'Noto Sans Bengali',sans-serif",fontSize:16,fontWeight:500,color:'#f0c65a',letterSpacing:3}}>শুভ অন্নপ্রাশন</span>
              </div>

              {/* Title */}
              <div style={{...fadeIn(2),marginBottom:10}}>
                <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:38,fontWeight:700,color:'#f0c65a',textShadow:'0 0 30px rgba(240,198,90,0.4),0 2px 4px rgba(0,0,0,0.5)',letterSpacing:4,lineHeight:1.2}}>Annaprashana</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:300,color:'#a8d0f0',letterSpacing:6,textTransform:'uppercase',marginTop:4}}>Rice Ceremony</div>
              </div>

              {/* Peacock feather eye divider */}
              <div style={fadeIn(3)}><PeacockFeatherEyeDivider /></div>

              {/* Krishna section */}
              <div style={{...fadeIn(4),display:'flex',justifyContent:'center',alignItems:'center',margin:'10px 0 14px',gap:20}}>
                <PeacockFeather style={{width:60,height:80}} />
                <KrishnaFlute />
                <PeacockFeather style={{width:60,height:80}} />
              </div>

              {/* Baby Name */}
              <div style={{...fadeIn(5),marginBottom:10}}>
                <div style={{fontSize:13,color:'#a8d0f0',letterSpacing:5,textTransform:'uppercase',fontWeight:300,marginBottom:6}}>With Blessings, We Name Our Little One</div>
                <div style={{
                  fontFamily:"'Cinzel Decorative',serif",fontSize:44,fontWeight:900,letterSpacing:6,lineHeight:1.3,
                  background:'linear-gradient(180deg,#f7e5a0 0%,#d4a843 40%,#c49730 70%,#f0c65a 100%)',
                  WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
                  animation:'glowPulse 3s ease-in-out infinite'
                }}>TISHAN SAHA</div>
              </div>

              {/* Invitation text */}
              <div style={{...fadeIn(6),margin:'18px 20px',lineHeight:1.8}}>
                <span style={{fontFamily:"'Great Vibes',cursive",fontSize:30,color:'#f0c65a',marginBottom:10,display:'block'}}>Dear Guest,</span>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16.5,fontWeight:400,color:'#d4e8f7',lineHeight:1.85,fontStyle:'italic'}}>
                  With hearts brimming with joy and gratitude, we cordially invite you to
                  grace the auspicious <span style={{color:'#f0c65a',fontWeight:600,fontStyle:'normal'}}>Annaprashana</span> ceremony
                  of our beloved little prince. As the divine flute of
                  <span style={{color:'#f0c65a',fontWeight:600,fontStyle:'normal'}}> Lord Krishna</span> fills our home with celestial
                  melodies, we celebrate the blessed moment when our precious one takes
                  his first grain of rice — a sacred step into a life of
                  <span style={{color:'#f0c65a',fontWeight:600,fontStyle:'normal'}}> prosperity, health, and abundance</span>.
                  <br/><br/>
                  May the peacock feathers of good fortune adorn his path, and may your
                  gracious presence shower our little one with blessings that bloom like
                  <span style={{color:'#f0c65a',fontWeight:600,fontStyle:'normal'}}> a thousand lotuses</span>. Your warmth and love
                  shall make this divine occasion truly unforgettable.
                </p>
              </div>

              <div style={fadeIn(7)}><SmallDivider /></div>

              {/* Parents */}
              <div style={{...fadeIn(8),margin:'22px 0 18px'}}>
                <div style={{fontSize:12,color:'#4a90d9',letterSpacing:4,textTransform:'uppercase',fontWeight:300,marginBottom:10}}>With Love & Blessings From</div>
                <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:30,flexWrap:'wrap'}}>
                  <div>
                    <div style={{fontSize:11,color:'rgba(168,208,240,0.6)',letterSpacing:3,textTransform:'uppercase',fontWeight:300,marginBottom:3}}>Father</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:500,color:'#fdf8ef',letterSpacing:2}}>Utshab Saha</div>
                  </div>
                  <div style={{fontFamily:"'Great Vibes',cursive",fontSize:32,color:'#d4a843'}}>&amp;</div>
                  <div>
                    <div style={{fontSize:11,color:'rgba(168,208,240,0.6)',letterSpacing:3,textTransform:'uppercase',fontWeight:300,marginBottom:3}}>Mother</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:500,color:'#fdf8ef',letterSpacing:2}}>Sweta Dey</div>
                  </div>
                </div>
              </div>

              <div style={fadeIn(9)}><SmallDivider /></div>

              {/* Details */}
              <div style={{...fadeIn(10),display:'flex',justifyContent:'center',gap:50,margin:'22px 0 18px',flexWrap:'wrap'}}>
                <div style={{textAlign:'center'}}>
                  <svg style={{width:28,height:28,margin:'0 auto 6px',display:'block'}} viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="5" width="22" height="20" rx="2" fill="none" stroke="#d4a843" strokeWidth="1.2"/>
                    <line x1="3" y1="11" x2="25" y2="11" stroke="#d4a843" strokeWidth="0.8"/>
                    <line x1="9" y1="3" x2="9" y2="7" stroke="#d4a843" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="19" y1="3" x2="19" y2="7" stroke="#d4a843" strokeWidth="1.2" strokeLinecap="round"/>
                    <circle cx="14" cy="18" r="2.5" fill="#d4a843" opacity="0.5"/>
                  </svg>
                  <div style={{fontSize:10,color:'rgba(168,208,240,0.5)',letterSpacing:4,textTransform:'uppercase',fontWeight:300,marginBottom:4}}>Date</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:500,color:'#fdf8ef',letterSpacing:1,lineHeight:1.5}}>31st June, 2026</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <svg style={{width:28,height:28,margin:'0 auto 6px',display:'block'}} viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 3 C8 3,3 8,3 14 C3 22,14 27,14 27 C14 27,25 22,25 14 C25 8,20 3,14 3Z" fill="none" stroke="#d4a843" strokeWidth="1.2"/>
                    <circle cx="14" cy="13" r="4" fill="none" stroke="#d4a843" strokeWidth="1"/>
                    <circle cx="14" cy="13" r="1.5" fill="#d4a843" opacity="0.5"/>
                  </svg>
                  <div style={{fontSize:10,color:'rgba(168,208,240,0.5)',letterSpacing:4,textTransform:'uppercase',fontWeight:300,marginBottom:4}}>Venue</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:500,color:'#fdf8ef',letterSpacing:1,lineHeight:1.5}}>Swaymbar, Baruipur<br/>Kolkata — 700144</div>
                </div>
              </div>

              {/* Footer */}
              <div style={fadeIn(11)}>
                <SmallPeacockDivider style={{margin:'14px 0 10px'}} />
                <div style={{textAlign:'center',marginTop:20}}>
                  <div style={{fontFamily:"'Great Vibes',cursive",fontSize:22,color:'#f0c65a',textShadow:'0 0 20px rgba(240,198,90,0.3)'}}>Your Presence is Our Greatest Blessing</div>
                  <div style={{fontFamily:"'Noto Sans Bengali',sans-serif",fontSize:13,color:'#a8d0f0',marginTop:4,letterSpacing:2}}>আপনার উপস্থিতি আমাদের পরম আশীর্বাদ</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Hidden YouTube player for background music - autoplay on load */}
      <iframe
        width="0"
        height="0"
        src="https://www.youtube.com/embed/tsf4TMl9AcQ?autoplay=1&loop=1&playlist=tsf4TMl9AcQ&controls=0&showinfo=0&modestbranding=1"
        title="Background Music"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        style={{position:'fixed',bottom:0,right:0,width:0,height:0,border:'none',opacity:0,pointerEvents:'none'}}
      />
    </>
  );
}

export default App;
