import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import NavigationPage from './NavigationPage';
import Simulator from './Simulator';
import Entanglement from './Entanglement';
import Encoding from './Encoding';
import Transmission from './Transmission';
import Results from './Results';
import HomePage from './HomePage';
import QKDSimulation from './QKDSimulation';
import SuperdenseCoding from './SuperdenseCoding';
import FullSimulation from './FullSimulation';
import { SimulationProvider } from './SimulationContext';
import AircraftNavigation from './AircraftNavigation';
import IbmCloud from './IbmCloud';
import './index.css';
import Blank from './Blank';

export default function App() {
  return (
    <Router>
      <SimulationProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/navigation" element={<NavigationPage />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/entanglement" element={<Entanglement />} />
          <Route path="/encoding" element={<Encoding />} />
          <Route path="/transmission" element={<Transmission />} />
          <Route path="/results" element={<Results />} />
          {/* New Satellite-Ground Communication Simulator Routes */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/qkd-simulation" element={<QKDSimulation />} />
          <Route path="/superdense-coding" element={<SuperdenseCoding />} />
          <Route path="/full-simulation" element={<FullSimulation />} />
          <Route path="/aircraft-navigation" element={<AircraftNavigation />} />
          <Route path="/ibm-cloud" element={<IbmCloud />} />
          <Route path="/blank" element={<Blank />} />
        </Routes>
      </SimulationProvider>
    </Router>
  );
}