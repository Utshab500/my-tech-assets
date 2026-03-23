import React from 'react';
import './App.css';

/* ---------- SVG Components ---------- */

const PeacockBgPattern = () => (
  <div className="peacock-bg">
    <svg viewBox="0 0 700 1100" xmlns="http://www.w3.org/2000/svg" className="peacock-bg-svg">
      <defs>
        <radialGradient id="eyeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a8a8a" />
          <stop offset="40%" stopColor="#1a7a5a" />
          <stop offset="70%" stopColor="#1a3a6b" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <pattern id="featherPat" x="0" y="0" width="140" height="160" patternUnits="userSpaceOnUse">
          <ellipse cx="70" cy="80" rx="30" ry="45" fill="none" stroke="#4a90d9" strokeWidth="1" />
          <ellipse cx="70" cy="80" rx="18" ry="28" fill="none" stroke="#1a8a8a" strokeWidth="1" />
          <ellipse cx="70" cy="80" rx="8" ry="12" fill="url(#eyeGrad)" opacity="0.6" />
          <line x1="70" y1="125" x2="70" y2="160" stroke="#1a3a6b" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="700" height="1100" fill="url(#featherPat)" />
    </svg>
  </div>
);

const CornerFlourish = ({ className }) => (
  <div className={`corner ${className}`}>
    <svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg" className="corner-svg">
      <path d="M5 85 C5 45,5 25,25 10 C35 3,50 2,85 5" fill="none" stroke="#d4a843" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 65 C8 40,12 25,30 15 C38 11,48 9,70 5" fill="none" stroke="#d4a843" strokeWidth="0.8" opacity="0.6" strokeLinecap="round" />
      <circle cx="15" cy="15" r="3" fill="#d4a843" opacity="0.5" />
      <path d="M20 20 C15 15,10 18,8 25 C6 32,12 28,20 20Z" fill="#d4a843" opacity="0.3" />
      <path d="M25 12 C22 8,18 10,16 15 C14 20,19 18,25 12Z" fill="#d4a843" opacity="0.3" />
    </svg>
  </div>
);

const PeacockFeatherEyeDivider = () => (
  <div className="feather-divider">
    <div className="feather-line" />
    <div className="feather-eye">
      <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="fEye" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0d1f3c" />
            <stop offset="25%" stopColor="#1a8a8a" />
            <stop offset="50%" stopColor="#1a7a5a" />
            <stop offset="70%" stopColor="#1e56a0" />
            <stop offset="85%" stopColor="#4a90d9" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <ellipse cx="30" cy="30" rx="28" ry="28" fill="none" stroke="#4a90d9" strokeWidth="0.8" opacity="0.4" />
        <ellipse cx="30" cy="30" rx="22" ry="26" fill="none" stroke="#1a8a8a" strokeWidth="1" opacity="0.6" />
        <ellipse cx="30" cy="30" rx="16" ry="20" fill="none" stroke="#1a7a5a" strokeWidth="1.2" opacity="0.7" />
        <ellipse cx="30" cy="30" rx="10" ry="14" fill="none" stroke="#d4a843" strokeWidth="1.5" opacity="0.8" />
        <ellipse cx="30" cy="30" rx="6" ry="8" fill="url(#fEye)" />
        <ellipse cx="30" cy="30" rx="3" ry="4" fill="#0d1f3c" />
        <ellipse cx="30" cy="28" rx="1.5" ry="1.5" fill="#f0c65a" opacity="0.7" />
      </svg>
    </div>
    <div className="feather-line" />
  </div>
);

const PeacockFeather = ({ className }) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M50 95 Q48 60,50 30 Q52 60,50 95Z" fill="#1a7a5a" opacity="0.6" />
    <path d="M50 10 Q30 25,35 45 Q40 55,50 50 Q60 55,65 45 Q70 25,50 10Z" fill="none" stroke="#4a90d9" strokeWidth="1.2" />
    <path d="M50 15 Q35 28,38 42 Q42 50,50 46 Q58 50,62 42 Q65 28,50 15Z" fill="none" stroke="#1a8a8a" strokeWidth="1" />
    <path d="M50 20 Q40 30,42 40 Q45 45,50 42 Q55 45,58 40 Q60 30,50 20Z" fill="none" stroke="#d4a843" strokeWidth="1" />
    <ellipse cx="50" cy="32" rx="6" ry="8" fill="#0d1f3c" stroke="#1a8a8a" strokeWidth="0.8" />
    <ellipse cx="50" cy="30" rx="2.5" ry="3.5" fill="#1a8a8a" />
    <circle cx="50" cy="29" r="1.2" fill="#f0c65a" />
  </svg>
);

const KrishnaFlute = () => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="krishna-main">
    <defs>
      <linearGradient id="fluteGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#c49730" />
        <stop offset="30%" stopColor="#f0c65a" />
        <stop offset="50%" stopColor="#f7e5a0" />
        <stop offset="70%" stopColor="#f0c65a" />
        <stop offset="100%" stopColor="#c49730" />
      </linearGradient>
    </defs>
    <rect x="15" y="44" width="70" height="12" rx="6" fill="url(#fluteGrad)" transform="rotate(-15,50,50)" />
    <circle cx="35" cy="48" r="2" fill="#8B6914" transform="rotate(-15,50,50)" />
    <circle cx="45" cy="48" r="2" fill="#8B6914" transform="rotate(-15,50,50)" />
    <circle cx="55" cy="48" r="2" fill="#8B6914" transform="rotate(-15,50,50)" />
    <circle cx="65" cy="48" r="2" fill="#8B6914" transform="rotate(-15,50,50)" />
    <text x="72" y="30" fontSize="16" fill="#f0c65a" opacity="0.6" fontFamily="serif">♪</text>
    <text x="80" y="22" fontSize="12" fill="#4a90d9" opacity="0.5" fontFamily="serif">♫</text>
    <text x="18" y="35" fontSize="10" fill="#4a90d9" opacity="0.4" fontFamily="serif">♪</text>
    <path d="M22 43 Q18 30,22 18 Q25 10,30 8" fill="none" stroke="#1a8a8a" strokeWidth="0.8" />
    <ellipse cx="30" cy="8" rx="4" ry="6" fill="#1a7a5a" opacity="0.5" stroke="#4a90d9" strokeWidth="0.5" />
    <circle cx="30" cy="7" r="1.5" fill="#f0c65a" opacity="0.6" />
    <path d="M42 72 Q45 65,50 62 Q55 65,58 72" fill="none" stroke="#d4a843" strokeWidth="0.8" opacity="0.5" />
    <path d="M38 74 Q42 66,50 60 Q58 66,62 74" fill="none" stroke="#d4a843" strokeWidth="0.6" opacity="0.4" />
  </svg>
);

const SmallDivider = () => <div className="small-divider" />;

const SmallPeacockDivider = () => (
  <div className="small-peacock-divider">
    <div className="feather-line" />
    <svg viewBox="0 0 30 30" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="15" cy="15" rx="8" ry="10" fill="none" stroke="#d4a843" strokeWidth="0.8" />
      <ellipse cx="15" cy="15" rx="4" ry="5" fill="#1a8a8a" opacity="0.4" />
      <circle cx="15" cy="14" r="1.5" fill="#f0c65a" opacity="0.6" />
    </svg>
    <div className="feather-line" />
  </div>
);

/* ---------- Main App ---------- */

function App() {
  return (
    <>
      <div className="page-wrap">
        <div className="card-wrapper">
          <div className="card">
            <div className="gold-border-1" />
            <div className="gold-border-2" />

            <PeacockBgPattern />

            <div className="particles">
              <div className="particle particle-1" />
              <div className="particle particle-2" />
              <div className="particle particle-3" />
              <div className="particle particle-4" />
              <div className="particle particle-5" />
              <div className="particle particle-6" />
              <div className="particle particle-7" />
              <div className="particle particle-8" />
              <div className="particle particle-9" />
              <div className="particle particle-10" />
              <div className="particle particle-11" />
              <div className="particle particle-12" />
            </div>

            <CornerFlourish className="corner-tl" />
            <CornerFlourish className="corner-tr" />
            <CornerFlourish className="corner-bl" />
            <CornerFlourish className="corner-br" />

            <div className="card-inner">
              <div className="fade-in delay-1 om-section">
                <div className="om-symbol">ॐ</div>
              </div>

              <div className="fade-in delay-2 shubh-label">
                <span>শুভ অন্নপ্রাশন</span>
              </div>

              <div className="fade-in delay-3 title-section">
                <div className="title-main">Annaprashana</div>
                <div className="title-sub">Rice Ceremony</div>
              </div>

              <div className="fade-in delay-4">
                <PeacockFeatherEyeDivider />
              </div>

              <div className="fade-in delay-5 krishna-section">
                <PeacockFeather className="krishna-feather" />
                <KrishnaFlute />
                <PeacockFeather className="krishna-feather" />
              </div>

              <div className="fade-in delay-6 baby-name-section">
                <div className="baby-name-label">With Blessings, We Name Our Little One</div>
                <div className="baby-name">TISHAN SAHA</div>
              </div>

              <div className="fade-in delay-7 invitation-text">
                <span className="dear-guest">Dear Guest,</span>
                <p className="invitation-body">
                  With hearts brimming with joy and gratitude, we are blessed to share that our little prince will take his first sacred grain of rice on <span className="highlight">28th May</span> - a divine step into a life of <span className="highlight">prosperity, health, and abundance</span>. To celebrate this cherished milestone with our loved ones, we are arranging the <span className="highlight">Annaprashana</span> celebration event on <span className="highlight">31st May</span>.
                  <br />
                  <br />
                  As the divine flute of <span className="highlight">Lord Krishna</span> fills our home with celestial melodies, may your gracious presence shower our little one with blessings that bloom like <span className="highlight">a thousand lotuses</span>. Your warmth and love shall make this sacred occasion truly unforgettable.
                </p>
              </div>

              <div className="fade-in delay-8">
                <SmallDivider />
              </div>

              <div className="fade-in delay-9 parents-section">
                <div className="parents-label">With Love &amp; Blessings From</div>
                <div className="parent-names">
                  <div className="parent">
                    <div className="parent-role">Father</div>
                    <div className="parent-name">Utshab Saha</div>
                  </div>
                  <div className="ampersand">&amp;</div>
                  <div className="parent">
                    <div className="parent-role">Mother</div>
                    <div className="parent-name">Sweta Dey</div>
                  </div>
                </div>
              </div>

              <div className="fade-in delay-10">
                <SmallDivider />
              </div>

              <div className="fade-in delay-11 details-section">
                <div className="detail-block">
                  <svg className="detail-icon" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="5" width="22" height="20" rx="2" fill="none" stroke="#d4a843" strokeWidth="1.2" />
                    <line x1="3" y1="11" x2="25" y2="11" stroke="#d4a843" strokeWidth="0.8" />
                    <line x1="9" y1="3" x2="9" y2="7" stroke="#d4a843" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="19" y1="3" x2="19" y2="7" stroke="#d4a843" strokeWidth="1.2" strokeLinecap="round" />
                    <circle cx="14" cy="18" r="2.5" fill="#d4a843" opacity="0.5" />
                  </svg>
                  <div className="detail-label">Date</div>
                  <div className="detail-value">31st May, 2026
                    <br />
                    Sunday, 7:00 PM
                  </div>
                </div>

                <div className="detail-block">
                  <svg className="detail-icon" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 3 C8 3,3 8,3 14 C3 22,14 27,14 27 C14 27,25 22,25 14 C25 8,20 3,14 3Z" fill="none" stroke="#d4a843" strokeWidth="1.2" />
                    <circle cx="14" cy="13" r="4" fill="none" stroke="#d4a843" strokeWidth="1" />
                    <circle cx="14" cy="13" r="1.5" fill="#d4a843" opacity="0.5" />
                  </svg>
                  <div className="detail-label">Venue</div>
                  <div className="detail-value">
                    Swayambar, Baruipur
                    <br />
                    Kolkata - 700144
                  </div>
                </div>
              </div>

              <div className="fade-in delay-12 footer-section">
                <SmallPeacockDivider />
                <div className="blessing">
                  <div className="blessing-text">Your Presence is Our Greatest Blessing</div>
                  <div className="blessing-sub">আপনার উপস্থিতি আমাদের পরম আশীর্বাদ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <iframe
        width="0"
        height="0"
        src="https://www.youtube.com/embed/tsf4TMl9AcQ?autoplay=1&mute=1&playsinline=1&loop=1&playlist=tsf4TMl9AcQ&controls=0&modestbranding=1"
        title="Background Music"
        frameBorder="0"
        allow="autoplay; encrypted-media; picture-in-picture"
        className="yt-hidden"
      />
    </>
  );
}

export default App;
