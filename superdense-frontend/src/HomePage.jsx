import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import aircraftImg from "./assets/aircraft.png";
import groundImg from "./assets/ground.png";
import Blank from './Blank';
import AircraftNavigation from './AircraftNavigation';


// Load GSAP dynamically from CD
const GsapLoader = ({ onReady }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
    script.async = true;
    script.onload = () => {
      console.log("GSAP loaded successfully");
      onReady();
    };
    script.onerror = () => console.error("Failed to load GSAP.");
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [onReady]);

  return null;
};

export default function HomePage() {
  const navigate = useNavigate();
  const [gsapReady, setGsapReady] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const satelliteRef = useRef(null);
  const planeRef = useRef(null);
  const groundRef = useRef(null);
  const laserBeam1Ref = useRef(null);
  const laserBeam2Ref = useRef(null);
  const laserBeam3Ref = useRef(null); // NEW beam
  const simulationAreaRef = useRef(null);

  const handleCreateEntanglement = () => {
    if (!gsapReady || typeof window.gsap === 'undefined') {
      console.error("GSAP is not ready yet.");
      return;
    }

    if (!satelliteRef.current || !planeRef.current || !groundRef.current || !simulationAreaRef.current) {
      console.error("One or more refs are not set.");
      return;
    }
    
    const { gsap } = window; 
    const simulationArea = simulationAreaRef.current;
    const satellite = satelliteRef.current;
    const plane = planeRef.current;
    const ground = groundRef.current;
    const laserBeam1 = laserBeam1Ref.current;
    const laserBeam2 = laserBeam2Ref.current;
    const laserBeam3 = laserBeam3Ref.current;

    const simAreaRect = simulationArea.getBoundingClientRect();
    const satelliteRect = satellite.getBoundingClientRect();
    const planeRect = plane.getBoundingClientRect();
    const groundRect = ground.getBoundingClientRect();
    
    const satelliteX = satelliteRect.left - simAreaRect.left + satelliteRect.width / 2;
    const satelliteY = satelliteRect.top - simAreaRect.top + satelliteRect.height / 2;
    
    const planeX = planeRect.left - simAreaRect.left + planeRect.width / 2;
    const planeY = planeRect.top - simAreaRect.top + planeRect.height / 2;

    const groundX = groundRect.left - simAreaRect.left + groundRect.width / 2;
    const groundY = groundRect.top - simAreaRect.top + groundRect.height / 2;
    
    const tl = gsap.timeline({
      onComplete: () => {
        setSuccessMessage(true);
        setTimeout(() => setSuccessMessage(false), 3000);
      }
    });

    // Laser: Satellite → Plane
    laserBeam1.setAttribute('stroke', 'url(#beam-gradient)');
    tl.set(laserBeam1, {
      attr: { x1: satelliteX, y1: satelliteY, x2: satelliteX, y2: satelliteY },
      opacity: 1,
      'stroke-dashoffset': 1000,
      'stroke-dasharray': 1000
    });
    tl.to(laserBeam1, {
      attr: { x2: planeX, y2: planeY },
      duration: 3,
      ease: 'power2.inOut',
      onStart: () => {
        gsap.to(laserBeam1, {
          repeat: 8,
          yoyo: true,
          duration: 0.14,
          opacity: 0.95,
          boxShadow: "0 0 40px #00eaff, 0 0 80px #ff00cc"
        });
      },
      onUpdate: function() {
        const progress = this.progress();
        const grad = document.getElementById('beam-gradient');
        if (grad) grad.setAttribute('x1', `${progress * 100}%`);
      }
    })
    .to(laserBeam1, {
        'stroke-dashoffset': 0,
        duration: 2,
        ease: 'power2.out'
    }, "-=2")
    .to(laserBeam1, {
        opacity: 0,
        duration: 0.4
    });

    // Laser: Satellite → Ground
    laserBeam2.setAttribute('stroke', 'url(#beam-gradient)');
    tl.set(laserBeam2, {
        attr: { x1: satelliteX, y1: satelliteY, x2: satelliteX, y2: satelliteY },
        opacity: 1,
        'stroke-dashoffset': 1000,
        'stroke-dasharray': 1000
      }, "-=2"); 
    tl.to(laserBeam2, {
        attr: { x2: groundX, y2: groundY },
        duration: 2,
        ease: 'power2.inOut',
        onStart: () => {
          gsap.to(laserBeam2, {
            repeat: 8,
            yoyo: true,
            duration: 0.14,
            opacity: 0.95,
            boxShadow: "0 0 40px #ff00cc, 0 0 80px #00eaff"
          });
        },
        onUpdate: function() {
          const progress = this.progress();
          const grad = document.getElementById('beam-gradient');
          if (grad) grad.setAttribute('x1', `${progress * 100}%`);
        }
    }, "<")
    .to(laserBeam2, {
        'stroke-dashoffset': 0,
        duration: 2,
        ease: 'power2.out'
    }, "-=2")
    .to(laserBeam2, {
        opacity: 0,
        duration: 0.4
    });

    // NEW: After entanglement, show Plane → Ground correlation beam
    laserBeam3.setAttribute('stroke', 'url(#beam-gradient)');
    tl.set(laserBeam3, {
      attr: { x1: planeX, y1: planeY, x2: planeX, y2: planeY },
      opacity: 1,
      'stroke-dashoffset': 1000,
      'stroke-dasharray': 1000
    }, "+=0.5"); 
    tl.to(laserBeam3, {
      attr: { x2: groundX, y2: groundY },
      duration: 2,
      ease: 'power2.inOut',
      onStart: () => {
        gsap.to(laserBeam3, {
          repeat: 8,
          yoyo: true,
          duration: 0.14,
          opacity: 0.95,
          boxShadow: "0 0 40px #00eaff, 0 0 80px #ff00cc"
        });
      },
      onUpdate: function() {
        const progress = this.progress();
        const grad = document.getElementById('beam-gradient');
        if (grad) grad.setAttribute('x1', `${progress * 100}%`);
      }
    })
    .to(laserBeam3, {
      'stroke-dashoffset': 0,
      duration: 3,
      ease: 'power2.out'
    }, "-=2")
    .to(laserBeam3, {
      opacity: 0,
      duration: 0.4
    });
  };

  const handleNext = () => {
    navigate('/aircraft-navigation');
  };

  return (
    <>
      <GsapLoader onReady={() => setGsapReady(true)} />
      <style>{`
        .home-page {
          display: flex;
          height: 100vh;
          width: 100vw;
          background: #000011;
          overflow: hidden;
          position: relative;
          flex-direction: row;
        }

        .sidebar {
          width: clamp(300px, 25%, 380px);
          background: rgba(10, 25, 47, 0.7);
          backdrop-filter: blur(12px);
          border-right: 1px solid rgba(107, 114, 128, 0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1rem;
          gap: 1.5rem;
          z-index: 10;
          flex-shrink: 0;
        }

        .sidebar-title {
          font-size: clamp(1.2rem, 2vw, 1.6rem);
          color: #e5e7eb;
          font-weight: 600;
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(107, 114, 128, 0.5);
          padding-bottom: 0.5rem;
          width: 100%;
          text-align: center;
        }

        .nav-button {
          background: linear-gradient(145deg, #3b82f6, #8b5cf6);
          color: white;
          border: none;
          padding: 0.9rem 1.3rem;
          font-size: clamp(0.9rem, 1vw, 1rem);
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          width: 90%;
        }

        .simulation-area {
          flex-grow: 1;
          position: relative;
          height: 100%;
          width: 100%;
        }

        .emoji {
          position: absolute;
          user-select: none;
          will-change: transform;
          filter: drop-shadow(0 0 15px rgba(0, 191, 255, 0.4));
          max-width: 20vw;
        }

        .satellite {
          top: 10%;
          right: 30%;
          width: clamp(220px, 12vw, 160px);
          animation: float 6s ease-in-out infinite;
        }

        .plane {
          top: 60%;
          left: 15%;
          width: clamp(240px, 14vw, 180px);
          animation: float 8s ease-in-out infinite reverse;
        }

        .ground {
          bottom: 5%;
          right: 10%;
          width: clamp(260px, 16vw, 200px);
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }

        .laser-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .laser-beam {
          stroke: #ff9100ff;
          stroke-width: 4px;
          stroke-linecap: round;
          filter: drop-shadow(0 0 8px #ff8000ff) drop-shadow(0 0 16px #ff8400ff);
          opacity: 1;
        }

        .success-message {
          position: absolute;
          top: 15px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: #00ff00;
          font-size: clamp(1rem, 2vw, 1.4rem);
          font-weight: bold;
          padding: 0.8rem 1.6rem;
          border-radius: 12px;
          box-shadow: 0 0 20px rgba(0,255,0,0.6);
          z-index: 20;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        @media (max-width: 768px) {
          .home-page {
            flex-direction: column;
          }
          .sidebar {
            width: 100%;
            flex-direction: row;
            justify-content: space-around;
            border-right: none;
            border-bottom: 1px solid rgba(107,114,128,0.3);
          }
        }
      `}</style>

      <div className="home-page">
        <aside className="sidebar">
          <h2 className="sidebar-title">Controls</h2>
          <motion.button
            className="nav-button"
            onClick={handleCreateEntanglement}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!gsapReady}
          >
            Create Entanglement
          </motion.button>
          <motion.button
            className="nav-button"
            onClick={handleNext}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Communication
          </motion.button>
        </aside>

        <div ref={simulationAreaRef} className="simulation-area">
          <img
            ref={satelliteRef}
            className="emoji satellite"
            src="https://res.cloudinary.com/dkpjimiip/image/upload/v1757147259/pngegg_esf5tj.png"
            alt="Satellite"
          />
          <img
            ref={planeRef}
            className="emoji plane"
            src={aircraftImg}
            alt="Aircraft"
          />
          <img
            ref={groundRef}
            className="emoji ground"
            src={groundImg}
            alt="Ground Station"
          />

          <svg className="laser-svg">
            <defs>
              <filter id="beam-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00eaff" />
                <stop offset="25%" stopColor="#00ff6a" />
                <stop offset="50%" stopColor="#ffea00" />
                <stop offset="75%" stopColor="#ff00ea" />
                <stop offset="10%" stopColor="#ff0000" />
              </linearGradient>
            </defs>
            <line ref={laserBeam1Ref} stroke="url(#beam-gradient)" strokeWidth="8" strokeLinecap="round" filter="url(#beam-glow)" opacity="1" />
            <line ref={laserBeam2Ref} stroke="url(#beam-gradient)" strokeWidth="8" strokeLinecap="round" filter="url(#beam-glow)" opacity="1" />
            <line ref={laserBeam3Ref} stroke="url(#beam-gradient)" strokeWidth="8" strokeLinecap="round" filter="url(#beam-glow)" opacity="1" />
          </svg>

          {successMessage && (
            <div className="success-message">✨ Entanglement Successful! ✨</div>
          )}
        </div>
      </div>
    </>
  );
}
