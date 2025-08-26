import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Particles from './Particles';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();

  const handleStartSimulation = () => {
    navigate('/qkd-simulation');
  };

  return (
    <>
      <Particles 
        particleCount={300}
        particleSpread={15}
        speed={0.3}
        particleColors={["#667eea", "#764ba2", "#f093fb", "#22d3ee", "#2563eb", "#7c3aed"]}
        moveParticlesOnHover={true}
        particleHoverFactor={2}
        alphaParticles={true}
        particleBaseSize={80}
        sizeRandomness={0.8}
        cameraDistance={25}
        disableRotation={false}
      />
      
      <div className="home-page">
        <motion.div 
          className="home-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <header className="home-header">
            <motion.h1 
              className="home-title"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Satellite–Ground Secure Communication Simulator
            </motion.h1>
            
            <motion.p 
              className="home-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Experience the future of secure communication through quantum key distribution 
              and superdense coding protocols. This simulator demonstrates how quantum 
              mechanics enables ultra-secure satellite-to-ground communication systems.
            </motion.p>
          </header>

          {/* Flowchart/Illustration Placeholder */}
          <motion.div 
            className="flowchart-container"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="flowchart">
              <div className="flow-step">
                <div className="step-icon">🛰️</div>
                <span>Satellite</span>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-icon">🔐</div>
                <span>QKD</span>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-icon">📡</div>
                <span>Transmission</span>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-icon">🏠</div>
                <span>Ground Station</span>
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div 
            className="features-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <h2 className="features-title">Key Features</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🔑</div>
                <h3>Quantum Key Distribution</h3>
                <p>E91 protocol implementation for secure key generation</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Superdense Coding</h3>
                <p>Transmit 2 classical bits using 1 quantum bit</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🛡️</div>
                <h3>Security Analysis</h3>
                <p>Eavesdropper detection and QBER calculation</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h3>Real-time Visualization</h3>
                <p>Interactive circuit diagrams and result analysis</p>
              </div>
            </div>
          </motion.div>

          {/* Start Button */}
          <motion.div 
            className="start-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <button 
              className="start-button"
              onClick={handleStartSimulation}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🚀 Start Simulation
            </button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
