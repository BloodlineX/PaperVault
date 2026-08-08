'use client';

// Sparky — PaperVault's original mascot. A small, cheerful spark character
// that floats in the corner of the page. Not based on any copyrighted
// character — custom shapes, custom palette, custom animation.

export default function Mascot() {
  return (
    <div className="mascot-wrap" aria-hidden="true">
      <svg
        viewBox="0 0 140 140"
        width="90"
        height="90"
        className="mascot-float"
      >
        {/* shadow */}
        <ellipse cx="70" cy="126" rx="30" ry="6" fill="rgba(31,58,95,0.12)" />

        {/* body */}
        <g className="mascot-bob">
          {/* ears */}
          <path d="M46 40 L36 8 L58 34 Z" fill="#F59E0B" />
          <path d="M94 40 L104 8 L82 34 Z" fill="#F59E0B" />

          {/* head/body blob */}
          <ellipse cx="70" cy="76" rx="42" ry="40" fill="#FBBF24" />

          {/* cheeks */}
          <circle cx="40" cy="82" r="7" fill="#DB2777" opacity="0.55" />
          <circle cx="100" cy="82" r="7" fill="#DB2777" opacity="0.55" />

          {/* eyes */}
          <g className="mascot-blink">
            <ellipse cx="56" cy="72" rx="6" ry="8" fill="#1F3A5F" />
            <ellipse cx="84" cy="72" rx="6" ry="8" fill="#1F3A5F" />
            <circle cx="58" cy="69" r="2" fill="#fff" />
            <circle cx="86" cy="69" r="2" fill="#fff" />
          </g>

          {/* smile */}
          <path d="M58 92 Q70 102 82 92" stroke="#1F3A5F" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* little spark bolt on the chest */}
          <path d="M72 100 L64 116 L70 116 L66 130 L80 110 L72 110 Z" fill="#DB2777" />

          {/* arms */}
          <path d="M30 84 Q18 90 22 104" stroke="#F59E0B" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M110 84 Q122 90 118 104" stroke="#F59E0B" strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>
      </svg>

      <style>{`
        .mascot-wrap {
          position: fixed;
          bottom: 18px;
          right: 18px;
          z-index: 40;
          pointer-events: none;
        }
        .mascot-float {
          animation: mascot-float 3.2s ease-in-out infinite;
        }
        .mascot-bob {
          animation: mascot-bob 2.4s ease-in-out infinite;
          transform-origin: 70px 116px;
        }
        .mascot-blink {
          animation: mascot-blink 4.5s ease-in-out infinite;
          transform-origin: 70px 72px;
        }
        @keyframes mascot-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes mascot-bob {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes mascot-blink {
          0%, 92%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.1); }
        }
        @media (max-width: 600px) {
          .mascot-wrap svg { width: 64px; height: 64px; }
        }
      `}</style>
    </div>
  );
}
