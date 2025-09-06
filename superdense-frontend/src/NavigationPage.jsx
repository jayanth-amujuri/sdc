import { useNavigate } from 'react-router-dom';
import Particles from './Particles';
import './NavigationPage.css';

export default function NavigationPage() {
  const navigate = useNavigate();
  
  const handleTestingPhase = () => {
    navigate('/simulator?mode=testing');
  };
  
  const handleApplicationPhase = () => {
    navigate('/home');
  };

  const handleIBMQuantumCloud = () => {
    navigate('/aircraft-navigation');
  };
  
  const handleBackToLanding = () => {
    navigate('/');
  };

  return (
    <>
      {/* Particles Background */}
      <Particles 
        particleCount={400}
        particleSpread={20}
        speed={0.2}
        particleColors={["#667eea", "#764ba2", "#f093fb", "#22d3ee", "#2563eb", "#7c3aed"]}
        moveParticlesOnHover={true}
        particleHoverFactor={3}
        alphaParticles={true}
        particleBaseSize={100}
        sizeRandomness={1.0}
        cameraDistance={30}
        disableRotation={false}
      />
      
      <div className="navigation-page">
        <div className="navigation-container">
          {/* Header */}
          <header className="navigation-header">
            <h1 className="navigation-title">Choose Your Phase</h1>
            <p className="navigation-subtitle">
              Select whether you want to test the quantum simulation or dive into real quantum applications
            </p>
          </header>

          {/* Navigation Options */}
          <div className="navigation-options">
            {/* Testing Phase */}
            <div className="navigation-option" onClick={handleTestingPhase}>
              <span className="option-icon">🧪</span>
              <h2 className="option-title">Testing Phase</h2>
              <p className="option-description">
                Explore and experiment with the Superdense Coding protocol in a controlled environment
              </p>
              <ul className="option-features">
                <li>Local Qiskit Aer simulation</li>
                <li>Real-time circuit visualization</li>
                <li>Detailed result analysis</li>
                <li>Perfect for learning and testing</li>
              </ul>
            </div>

            {/* Application Phase */}
            <div className="navigation-option" onClick={handleApplicationPhase}>
              <span className="option-icon">🚀</span>
              <h2 className="option-title">Application Phase</h2>
              <p className="option-description">
                Experience real quantum computing with IBM Quantum Platform backend
              </p>
              <ul className="option-features">
                <li>IBM Quantum backend execution</li>
                <li>Real quantum hardware results</li>
                <li>Professional quantum computing</li>
                <li>Production-ready applications</li>
              </ul>
            </div>

            {/* IBM Quantum Cloud Phase */}
            <div className="navigation-option" onClick={handleIBMQuantumCloud}>
              <span className="option-icon">☁️</span>
              <h2 className="option-title">IBM Quantum Cloud</h2>
              <p className="option-description">
                Navigate aircraft with satellite-ground integration powered by IBM Quantum Cloud
              </p>
              <ul className="option-features">
                <li>Aircraft trajectory prediction</li>
                <li>Satellite-ground communication</li>
                <li>Six-state QKD integration</li>
                <li>Real-time restricted status monitoring</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <footer className="navigation-footer">
            <button onClick={handleBackToLanding} className="back-button">
              ← Back to Landing
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}
