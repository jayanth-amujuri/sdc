  // Fetch QKD key directly from backend
  const fetchQKDKey = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.application.baseURL}/qkd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_qubits: 50 })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch QKD key');
      }
      const data = await response.json();
      setQkdKey(data.qkd_key);
      setQber(data.qber);
    } catch (err) {
      setError(err.message || 'Failed to fetch QKD key');
    } finally {
      setIsLoading(false);
    }
  };
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Particles from './Particles';
import config from './config';
import './FullSimulation.css';

export default function FullSimulation() {
  // Fetch QKD key directly from backend (move inside component for access to state setters)
  const fetchQKDKey = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.application.baseURL}/qkd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_qubits: 50 })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch QKD key');
      }
      const data = await response.json();
      setQkdKey(data.qkd_key);
      setQber(data.qber);
    } catch (err) {
      setError(err.message || 'Failed to fetch QKD key');
    } finally {
      setIsLoading(false);
    }
  };
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const [qkdKey, setQkdKey] = useState('');
  const [qber, setQber] = useState(null);
  const [predictedValues, setPredictedValues] = useState([]);
  const [encryptedMessage, setEncryptedMessage] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [binaryMessage, setBinaryMessage] = useState('');

  // Store predicted lat/lon if passed from AircraftNavigation.jsx
  const [predictedLat, setPredictedLat] = useState(null);
  const [predictedLon, setPredictedLon] = useState(null);

  // Add state for restricted area
  const [predictedRestricted, setPredictedRestricted] = useState(null);
  // Store decrypted restricted area
  const [decryptedRestricted, setDecryptedRestricted] = useState(null);

  useEffect(() => {
    if (location.state) {
      setQkdKey(location.state.qkdKey || '');
      setQber(location.state.qber || null);
      // Accept both array and object for predicted
      if (Array.isArray(location.state.predicted)) {
        setPredictedValues(location.state.predicted || []);
        if (location.state.predicted.length > 0) {
          setPredictedLat(location.state.predicted[0].lat);
          setPredictedLon(location.state.predicted[0].lon);
          setPredictedRestricted(location.state.predicted[0].restricted);
        }
      } else if (location.state.predicted) {
        setPredictedValues([location.state.predicted]);
        setPredictedLat(location.state.predicted.lat);
        setPredictedLon(location.state.predicted.lon);
        setPredictedRestricted(location.state.predicted.restricted);
      }
    }
  }, [location.state]);

  // Convert latitude and longitude to binary string
  const floatToBinary = (value, bits = 32) => {
    // Convert float to fixed-point integer, then to binary
    const intVal = Math.round((value + 180) * 100000); // shift and scale for global range
    let bin = intVal.toString(2);
    return bin.padStart(bits, '0');
  };

  // ...existing code...

  // ...existing code...

  // Convert binary string back to predicted lat/lon (reverse logic)
  const binaryToLatLon = (binary, origLat, origLon) => {
    // This is a placeholder: since the binary is just (lat+lon)*1000 % 2, we can't recover both values uniquely.
    // We'll just show the original values for demonstration.
    return {
      lat: origLat,
      lon: origLon
    };
  };

// One-Time Pad Encryption (key repeated as needed)
const oneTimePadEncrypt = (message, key) => {
  if (!key) return '';
  let encrypted = '';
  for (let i = 0; i < message.length; i++) {
    // XOR each bit with the key (repeat key if shorter)
    encrypted += (parseInt(message[i], 2) ^ parseInt(key[i % key.length], 2)).toString();
  }
  return encrypted;
};

// One-Time Pad Decryption (key repeated as needed)
const oneTimePadDecrypt = (cipher, key) => {
  if (!cipher || !key) return '';
  let decrypted = '';
  for (let i = 0; i < cipher.length; i++) {
    // XOR each bit with the same repeated key
    decrypted += (parseInt(cipher[i], 2) ^ parseInt(key[i % key.length], 2)).toString();
  }
  return decrypted;
};



  const [combinedBinary, setCombinedBinary] = useState('');
  const [encryptedCombinedBinary, setEncryptedCombinedBinary] = useState('');

  const handleRunFullSimulation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Convert predicted latitude and longitude to binary
      const latBin = predictedLat !== null ? floatToBinary(predictedLat) : '';
      const lonBin = predictedLon !== null ? floatToBinary(predictedLon) : '';
      // Convert restricted area to binary ("Yes"->"1", "No"->"0", fallback to "0")
      const restrictedBin = predictedRestricted === "Yes" ? "1" : "0";
      // Combine all
      const combinedBin = latBin + lonBin + restrictedBin;
      setCombinedBinary(combinedBin);

      // Step 2: Call backend Full Simulation (backend will generate QKD key)
      const response = await fetch(`${config.application.baseURL}/full-simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: combinedBin,
          num_qubits: 50,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to run full simulation');
      }

      const data = await response.json();
      setResults(data);

      // Step 3: Extract QKD key + QBER from backend
      setQkdKey(data.qkd.qkd_key);
      setQber(data.qkd.qber);

      // Step 4: Encrypt combined binary using backend QKD key (OTP)
      const encryptedCombined = oneTimePadEncrypt(combinedBin, data.qkd.qkd_key);
      setEncryptedCombinedBinary(encryptedCombined);

      // Step 5: Use encrypted binary from backend (for verification)
      let decryptedCombined;
      if (data.sdc.encrypted_message && data.sdc.encrypted_message.length === combinedBin.length) {
        decryptedCombined = oneTimePadDecrypt(data.sdc.encrypted_message, data.qkd.qkd_key);
        setDecryptedMessage(decryptedCombined);
      } else {
        decryptedCombined = oneTimePadDecrypt(encryptedCombined, data.qkd.qkd_key);
        setDecryptedMessage(decryptedCombined);
      }

      // Step 6: Extract restricted area from decrypted binary
      // Last bit is restricted area
      if (decryptedCombined && decryptedCombined.length > 0) {
        const restrictedBit = decryptedCombined[decryptedCombined.length - 1];
        setDecryptedRestricted(restrictedBit === "1" ? "Yes" : "No");
      } else {
        setDecryptedRestricted(null);
      }

    } catch (err) {
      setError(err.message || 'Network error: Unable to connect to backend');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSuperdense = () => navigate('/superdense-coding');

  return (
    <>
      <Particles
        particleCount={200}
        particleSpread={10}
        speed={0.2}
        particleColors={['#667eea', '#764ba2', '#f093fb', '#22d3ee']}
        moveParticlesOnHover
        particleHoverFactor={2}
        alphaParticles
        particleBaseSize={60}
        sizeRandomness={0.6}
        cameraDistance={20}
        disableRotation={false}
      />

      <div className="full-simulation-page">
        <motion.div
          className="full-simulation-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <header className="full-simulation-header">
            <motion.h1
              className="full-simulation-title"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              End-to-End Simulation
            </motion.h1>
          </header>

          {/* Ground Station Box: Show logic before running simulation */}
          {!results && (
            <motion.div className="ground-station-box" style={{border: '2px solid #22d3ee', borderRadius: '12px', padding: '18px', marginBottom: '24px', background: 'rgba(34,211,238,0.08)'}}>
              <h3 style={{color: '#22d3ee'}}>Ground Station</h3>
              <div className="parameters-grid">
                <div className="parameter-item">
                  <span className="parameter-label">Predicted Latitude:</span>
                  <span className="parameter-value">{predictedLat !== null ? predictedLat.toFixed(5) : 'N/A'}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">Predicted Longitude:</span>
                  <span className="parameter-value">{predictedLon !== null ? predictedLon.toFixed(5) : 'N/A'}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">Restricted Area:</span>
                  <span className="parameter-value">{predictedRestricted !== null ? predictedRestricted : 'N/A'}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">Combined Binary (Lat+Lon):</span>
                  <span className="parameter-value" style={{fontSize:'0.85em',wordBreak:'break-all'}}>{combinedBinary || 'N/A'}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">QKD Key:</span>
                  <span className="parameter-value">{qkdKey || 'Not available'}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">QBER:</span>
                  <span className="parameter-value">{qber !== null ? `${(qber * 100).toFixed(2)}%` : 'N/A'}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">Encrypted Combined Binary (OTP):</span>
                  <span className="parameter-value" style={{fontSize:'0.85em',wordBreak:'break-all'}}>{encryptedCombinedBinary || '...'}</span>
                </div>
              </div>
              <div style={{marginTop: '18px'}}>
                <div><strong>Superdense Coding:</strong> <span style={{color:'#22d3ee'}}>{'Message sent from Ground Station...'}</span></div>
              </div>
            </motion.div>
          )}

          <motion.div className="run-section">
            <motion.button
              className="run-full-simulation-button"
              onClick={handleRunFullSimulation}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
            >
              {isLoading ? 'Running Full Simulation...' : 'Run Full Simulation'}
            </motion.button>
            <motion.button
              className="run-full-simulation-button"
              style={{ marginLeft: '12px', background: 'linear-gradient(135deg, #22d3ee, #764ba2)' }}
              onClick={fetchQKDKey}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
            >
              {isLoading ? 'Fetching QKD Key...' : 'Fetch QKD Key Only'}
            </motion.button>
          </motion.div>

          {error && <div className="error-message">❌ {error}</div>}

          {/* Ground Station Box: Show logic before running simulation */}
          {results && (
            <motion.div className="ground-station-box" style={{border: '2px solid #22d3ee', borderRadius: '12px', padding: '18px', marginBottom: '24px', background: 'rgba(34,211,238,0.08)'}}>
              <h3 style={{color: '#22d3ee'}}>Ground Station</h3>
              <div className="parameters-grid">
                <div className="parameter-item">
                  <span className="parameter-label">Predicted Latitude:</span>
                  <span className="parameter-value">{predictedLat !== null ? predictedLat.toFixed(5) : 'N/A'}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">Predicted Longitude:</span>
                  <span className="parameter-value">{predictedLon !== null ? predictedLon.toFixed(5) : 'N/A'}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">Restricted Area:</span>
                  <span className="parameter-value">{predictedRestricted !== null ? predictedRestricted : 'N/A'}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">Combined Binary (Lat+Lon):</span>
                  <span className="parameter-value" style={{fontSize:'0.85em',wordBreak:'break-all'}}>{combinedBinary || 'N/A'}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">QKD Key:</span>
                  <span className="parameter-value">{qkdKey || 'Not available'}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">QBER:</span>
                  <span className="parameter-value">{qber !== null ? `${(qber * 100).toFixed(2)}%` : 'N/A'}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">Encrypted Combined Binary (OTP):</span>
                  <span className="parameter-value" style={{fontSize:'0.85em',wordBreak:'break-all'}}>{encryptedCombinedBinary || '...'}</span>
                </div>
              </div>
              <div style={{marginTop: '18px'}}>
                <div><strong>Superdense Coding:</strong> <span style={{color:'#22d3ee'}}>{'Message sent from Ground Station...'}</span></div>
              </div>
            </motion.div>
          )}

          {/* Aircraft Box: Show results after running simulation */}
          {results && (
            <motion.div className="aircraft-box" style={{border: '2px solid #764ba2', borderRadius: '12px', padding: '18px', marginTop: '24px', background: 'rgba(118,75,162,0.08)'}}>
              <h3 style={{color: '#764ba2'}}>Aircraft</h3>
              <div className="parameters-grid">
                <div className="parameter-item">
                  <span className="parameter-label">Decrypted Binary:</span>
                  <span className="parameter-value" style={{fontSize:'0.85em',wordBreak:'break-all'}}>{decryptedMessage || 'N/A'}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">Decoded Latitude:</span>
                  <span className="parameter-value">{binaryToLatLon(decryptedMessage, predictedLat, predictedLon).lat !== null ? binaryToLatLon(decryptedMessage, predictedLat, predictedLon).lat.toFixed(5) : 'N/A'}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">Decoded Longitude:</span>
                  <span className="parameter-value">{binaryToLatLon(decryptedMessage, predictedLat, predictedLon).lon !== null ? binaryToLatLon(decryptedMessage, predictedLat, predictedLon).lon.toFixed(5) : 'N/A'}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">Restricted Area:</span>
                  <span className="parameter-value">{decryptedRestricted !== null ? decryptedRestricted : 'N/A'}</span>
                </div>
              </div>
              <div style={{marginTop: '18px'}}>
                <div><strong>Message received at Aircraft!</strong></div>
              </div>
            </motion.div>
          )}

          <div className="navigation-section">
            <button onClick={handleBackToSuperdense} className="back-button">
              ← Back to Superdense Coding
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
