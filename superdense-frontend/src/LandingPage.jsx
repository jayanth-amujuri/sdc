import { useNavigate } from 'react-router-dom';
import Particles from './Particles';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    navigate('/navigation');
  };

  return (
    <>
      {/* Particles Background */}
      <Particles 
        particleCount={700}
        particleSpread={18}
        speed={0.18}
        particleColors={["#8ab4ff", "#a78bfa", "#22d3ee", "#38bdf8", "#f093fb"]}
        moveParticlesOnHover={true}
        particleHoverFactor={2.2}
        alphaParticles={true}
        particleBaseSize={120}
        sizeRandomness={0.9}
        cameraDistance={22}
        disableRotation={false}
      />
      
      <div className="landing-page">
        <div className="landing-container">
          {/* Hero Section */}
          <section className="hero-section">
            <h1 className="hero-title">Superdense Coding Simulator</h1>
            <p className="hero-subtitle">
              Experience the power of quantum communication through interactive simulations
            </p>
            <p className="hero-description">
              Discover how quantum entanglement enables the transmission of two classical bits 
              using just one quantum bit, revolutionizing secure communication protocols.
            </p>
            <button onClick={handleGetStarted} className="cta-button">
              🚀 Get Started
            </button>
          </section>

          {/* Info Sections */}
          <div className="info-sections">
            <div className="info-card">
              <span className="info-icon">🔬</span>
              <h3 className="info-title">Quantum Computing</h3>
              <p className="info-description">
                Explore the fundamental principles of quantum mechanics applied to computation
              </p>
              <ul className="info-features">
                <li>Quantum superposition and entanglement</li>
                <li>Quantum gates and circuits</li>
                <li>Measurement and quantum states</li>
                <li>Quantum algorithms and protocols</li>
              </ul>
            </div>

            <div className="info-card">
              <span className="info-icon">📡</span>
              <h3 className="info-title">Superdense Coding</h3>
              <p className="info-description">
                Learn about this revolutionary quantum communication protocol
              </p>
              <ul className="info-features">
                <li>Transmit 2 bits using 1 qubit</li>
                <li>Quantum entanglement utilization</li>
                <li>Bell state preparation</li>
                <li>Secure information transfer</li>
              </ul>
            </div>

            <div className="info-card">
              <span className="info-icon">⚡</span>
              <h3 className="info-title">Interactive Simulation</h3>
              <p className="info-description">
                Hands-on experience with real quantum computing backends
              </p>
              <ul className="info-features">
                <li>Local Qiskit Aer simulation</li>
                <li>IBM Quantum Platform integration</li>
                <li>Real-time circuit visualization</li>
                <li>Performance comparison analysis</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <footer className="landing-footer">
            <p className="footer-text">
              Built with cutting-edge quantum computing technologies
            </p>
            <div className="footer-links">
              <a href="#" className="footer-link">About</a>
              <a href="#" className="footer-link">Documentation</a>
              <a href="#" className="footer-link">GitHub</a>
              <a href="#" className="footer-link">Contact</a>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
