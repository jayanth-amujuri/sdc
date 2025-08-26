import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import NavigationPage from './NavigationPage';
import Simulator from './Simulator';
import './index.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/navigation" element={<NavigationPage />} />
        <Route path="/simulator" element={<Simulator />} />
      </Routes>
    </Router>
  );
}