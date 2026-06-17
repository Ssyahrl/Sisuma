import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020810] flex flex-col items-center justify-center relative overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 680 520" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="spaceBg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0d1b3e"/>
            <stop offset="100%" stopColor="#020810"/>
          </radialGradient>
          <style>{`
            .star { fill: white; }
            .twinkle1 { animation: twinkle 2.5s ease-in-out infinite; }
            .twinkle2 { animation: twinkle 3.2s ease-in-out infinite 0.8s; }
            .twinkle3 { animation: twinkle 1.8s ease-in-out infinite 1.4s; }
            .float { animation: float 4s ease-in-out infinite; transform-origin: 340px 220px; }
            .rotate-slow { animation: rotateSlow 12s linear infinite; transform-origin: 340px 220px; }
            .blink { animation: blink 1.5s ease-in-out infinite; }
            @keyframes twinkle { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
            @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
            @keyframes rotateSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
          `}</style>
        </defs>
        <rect width="680" height="520" fill="url(#spaceBg)"/>
        <circle className="star twinkle1" cx="42" cy="38" r="1"/>
        <circle className="star twinkle2" cx="120" cy="72" r="1.2"/>
        <circle className="star twinkle3" cx="200" cy="25" r="0.8"/>
        <circle className="star twinkle1" cx="310" cy="55" r="1"/>
        <circle className="star twinkle2" cx="430" cy="18" r="1.5"/>
        <circle className="star twinkle3" cx="550" cy="44" r="0.9"/>
        <circle className="star twinkle1" cx="630" cy="80" r="1.1"/>
        <circle className="star twinkle2" cx="80" cy="130" r="1.3"/>
        <circle className="star twinkle1" cx="580" cy="110" r="1"/>
        <circle className="star twinkle3" cx="30" cy="200" r="0.9"/>
        <circle className="star twinkle2" cx="650" cy="210" r="1.1"/>
        <circle className="star twinkle1" cx="100" cy="340" r="1.2"/>
        <circle className="star twinkle3" cx="600" cy="360" r="0.8"/>
        <circle className="star twinkle2" cx="50" cy="440" r="1"/>
        <circle className="star twinkle1" cx="640" cy="450" r="1.3"/>
        <circle cx="88" cy="390" r="52" fill="#1a3a6e" opacity="0.7"/>
        <ellipse cx="88" cy="390" rx="78" ry="14" fill="none" stroke="#2a7adf" strokeWidth="1.5" opacity="0.4"/>
        <circle cx="590" cy="80" r="28" fill="#1c2a4a" opacity="0.8"/>
        <text x="340" y="160" textAnchor="middle" fontFamily="Arial Black,Arial" fontSize="96" fontWeight="900" fill="#1a4a8a" opacity="0.5">404</text>
        <text x="340" y="160" textAnchor="middle" fontFamily="Arial Black,Arial" fontSize="96" fontWeight="900" fill="none" stroke="#4a9eff" strokeWidth="1.5" opacity="0.8">404</text>
        <g className="float">
          <path d="M340 265 Q360 275 380 260 Q400 245 410 250" fill="none" stroke="#4a9eff" strokeWidth="1.5" opacity="0.5" strokeDasharray="4 3"/>
          <ellipse cx="340" cy="230" rx="32" ry="36" fill="#e8eef5" stroke="#c0ccd8" strokeWidth="1.5"/>
          <circle cx="340" cy="192" r="26" fill="#d0dce8" stroke="#b0bcc8" strokeWidth="1.5"/>
          <ellipse cx="340" cy="192" rx="18" ry="16" fill="#1a6adc" opacity="0.8"/>
          <ellipse cx="333" cy="186" rx="6" ry="5" fill="white" opacity="0.25"/>
          <path d="M314 192 Q340 168 366 192" fill="none" stroke="#ff6a3d" strokeWidth="3" strokeLinecap="round"/>
          <ellipse cx="308" cy="228" rx="10" ry="22" fill="#dce6f0" stroke="#b8c8d8" strokeWidth="1" transform="rotate(-18 308 228)"/>
          <ellipse cx="372" cy="228" rx="10" ry="22" fill="#dce6f0" stroke="#b8c8d8" strokeWidth="1" transform="rotate(18 372 228)"/>
          <ellipse cx="300" cy="244" rx="8" ry="10" fill="#c8d6e4" stroke="#a8b8c8" strokeWidth="1" transform="rotate(-18 300 244)"/>
          <ellipse cx="380" cy="244" rx="8" ry="10" fill="#c8d6e4" stroke="#a8b8c8" strokeWidth="1" transform="rotate(18 380 244)"/>
          <ellipse cx="326" cy="262" rx="11" ry="18" fill="#dce6f0" stroke="#b8c8d8" strokeWidth="1"/>
          <ellipse cx="354" cy="262" rx="11" ry="18" fill="#dce6f0" stroke="#b8c8d8" strokeWidth="1"/>
          <ellipse cx="325" cy="278" rx="12" ry="8" fill="#c0ccd8" stroke="#a0b0c0" strokeWidth="1"/>
          <ellipse cx="355" cy="278" rx="12" ry="8" fill="#c0ccd8" stroke="#a0b0c0" strokeWidth="1"/>
          <rect x="326" y="218" width="28" height="20" rx="4" fill="#b8c8d8" stroke="#98a8b8" strokeWidth="1"/>
          <circle cx="334" cy="228" r="3" fill="#4a9eff" className="blink"/>
          <circle cx="346" cy="228" r="2" fill="#3adf6a"/>
        </g>
        <g className="rotate-slow">
          <g transform="translate(340,220)">
            <g transform="translate(130, 0)">
              <rect x="-12" y="-6" width="24" height="12" rx="2" fill="#8ab4e8" opacity="0.8"/>
              <rect x="-28" y="-3" width="14" height="6" rx="1" fill="#4a7ab8" opacity="0.7"/>
              <rect x="14" y="-3" width="14" height="6" rx="1" fill="#4a7ab8" opacity="0.7"/>
              <circle cx="0" cy="0" r="3" fill="#ffaa44" className="blink"/>
            </g>
          </g>
        </g>
        <text x="340" y="330" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="600" fill="#8ab4e8">Halaman Tidak Ditemukan</text>
        <text x="340" y="355" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fill="#4a6a9a">Sepertinya kamu tersesat </text>
      </svg>

      {/* Button di atas SVG */}
      <div className="relative z-5 mt-150">
        <Link href="/dashboard" className="px-6 py-2 border border-[#4a9eff] text-[#4a9eff] rounded-full text-sm hover:bg-[#4a9eff] hover:text-white transition-all">
          ← Kembali ke Home
        </Link>
      </div>
    </div>
  )
}