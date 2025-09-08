import React, { useState, useEffect } from "react";
import { useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  Polygon,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import "./AircraftNavigation.css";
import { useNavigate } from "react-router-dom";
import aircraftImg from "./assets/aircraft.png";
import groundImg from "./assets/ground.png";
// import satelliteImg from "./assets/satellite.png";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

// Custom blue icon for predicted point
const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to recenter map
function RecenterMap({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) map.setView([lat, lon], 6);
  }, [lat, lon, map]);
  return null;
}

// Restricted areas polygons
const restrictedAreas = [
  [
    [33.9, 73.5],
    [34.5, 73.8],
    [35.05, 74.5],
    [34.8, 75.2],
    [34.4, 75.3],
    [33.8, 74.9],
    [33.5, 74.3]
  ],
  [
    [35.5, 78.1],
    [36.1, 78.5],
    [36.5, 79.0],
    [36.2, 79.5],
    [35.8, 79.2],
    [35.6, 78.8]
  ]
];

// Utility to check if a point is inside a polygon
function pointInPolygon(point, vs) {
  const x = point[1],
    y = point[0];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][1],
      yi = vs[i][0];
    const xj = vs[j][1],
      yj = vs[j][0];
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0000001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isRestricted(point) {
  return restrictedAreas.some((area) => pointInPolygon(point, area));
}

// Dynamically load GSAP
const useGsapLoader = (onReady) => {
  React.useEffect(() => {
    if (window.gsap) {
      onReady();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
    script.async = true;
    script.onload = () => onReady();
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [onReady]);
};

export default function AircraftNavigation() {
  const [flights, setFlights] = useState([]);
  const [selectedIcao24, setSelectedIcao24] = useState("");
  const [flightData, setFlightData] = useState(null);
  const [showCurrentTable, setShowCurrentTable] = useState(false);
  const [showPredictedTable, setShowPredictedTable] = useState(false);
  const [loadingFlights, setLoadingFlights] = useState(true);
  const [flightError, setFlightError] = useState("");
  const [gsapReady, setGsapReady] = useState(false);

  const navigate = useNavigate();

  // Refs for images and beams
  const aircraftRef = useRef(null);
  const satelliteRef = useRef(null);
  const groundRef = useRef(null);
  const beam1Ref = useRef(null);
  const beam2Ref = useRef(null);

  useGsapLoader(() => setGsapReady(true));

  useEffect(() => {
    setLoadingFlights(true);
    axios
      .get("http://127.0.0.1:5002/api/flights")
      .then((res) => {
        setFlights(res.data.flights || []);
        setLoadingFlights(false);
        setFlightError("");
      })
      .catch((err) => {
        setFlights([]);
        setLoadingFlights(false);
        setFlightError("Error fetching flights. Please check backend or network.");
      });
  }, []);

  const fetchTrajectory = async (icao24) => {
    if (!icao24) return;
    try {
      setShowCurrentTable(false);
      setShowPredictedTable(false);
      const res = await axios.get("http://127.0.0.1:5002/api/predict", {
        params: { icao24 }
      });
      const data = res.data;

      const historical = data.historical_path.map((p) => ({
        ...p,
        restricted: isRestricted([p.lat, p.lon]) ? "Yes" : "No"
      }));

      const predicted = data.predicted_path.map((p) => ({
        ...p,
        restricted: isRestricted([p.lat, p.lon]) ? "Yes" : "No"
      }));

      // Ensure 'restricted' is set for current flight
      const currentFlight = {
        ...data.flight,
        restricted: isRestricted([data.flight.latitude, data.flight.longitude]) ? "Yes" : "No"
      };

      // Only show predicted if it differs from current
      let lastPredicted = predicted[predicted.length - 1];
      if (
        lastPredicted &&
        lastPredicted.lat.toFixed(5) === currentFlight.latitude.toFixed(5) &&
        lastPredicted.lon.toFixed(5) === currentFlight.longitude.toFixed(5)
      ) {
        lastPredicted = null;
      }

      setFlightData({
        ...data,
        flight: currentFlight,
        historical_path: historical,
        predicted_path: predicted,
        last_predicted: lastPredicted
      });

      // Animate laser beams after flight path is fetched
      setTimeout(() => animateLaserBeams(() => {
        setShowCurrentTable(true);
      }), 300);
    } catch (err) {
      alert(err.response?.data?.error || "Error fetching trajectory");
    }
  };

  // Enhanced laser beam animation logic
  const animateLaserBeams = (onCompleteCallback) => {
    if (!gsapReady || !window.gsap) {
      if (onCompleteCallback) onCompleteCallback();
      return;
    }
    const gsap = window.gsap;
    if (!aircraftRef.current || !satelliteRef.current || !groundRef.current || !beam1Ref.current || !beam2Ref.current) {
      if (onCompleteCallback) onCompleteCallback();
      return;
    }

    // Get positions relative to right-panel
    const panel = aircraftRef.current.closest('.right-panel');
    const getCenter = (el) => {
      const rect = el.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      return {
        x: rect.left - panelRect.left + rect.width / 2,
        y: rect.top - panelRect.top + rect.height / 2
      };
    };
    const aircraft = getCenter(aircraftRef.current);
    const satellite = getCenter(satelliteRef.current);
    const ground = getCenter(groundRef.current);

    // Animate aircraft → satellite
    // Animated gradient for laser
    // beam1Ref.current.setAttribute('stroke', 'url(#beam-gradient)');
    const defs = panel.querySelector("defs");
let grad1 = document.getElementById("beam-gradient-1");
if (!grad1) {
  grad1 = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  grad1.setAttribute("id", "beam-gradient-1");
  grad1.setAttribute("gradientUnits", "userSpaceOnUse");
  defs.appendChild(grad1);

  ["#00eaff", "#00ffcc", "#00ff6a", "#0077ff"].forEach((color, i) => {
    const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop.setAttribute("offset", `${(i / 3) * 100}%`);
    stop.setAttribute("stop-color", color);
    grad1.appendChild(stop);
  });
}
grad1.setAttribute("x1", aircraft.x);
grad1.setAttribute("y1", aircraft.y);
grad1.setAttribute("x2", satellite.x);
grad1.setAttribute("y2", satellite.y);

beam1Ref.current.setAttribute("stroke", "url(#beam-gradient-1)");

    gsap.set(beam1Ref.current, {
      attr: { x1: aircraft.x, y1: aircraft.y, x2: aircraft.x, y2: aircraft.y },
      opacity: 1,
      filter: 'url(#beam-glow)',
      strokeDasharray: 1000,
      strokeDashoffset: 1000
    });
    gsap.to(beam1Ref.current, {
      attr: { x2: satellite.x, y2: satellite.y },
      duration: 2,
      ease: 'power2.inOut',
      delay: 1.2,
      onStart: () => {
        gsap.to(beam1Ref.current, {
          repeat: 8,
          yoyo: true,
          duration: 0.14,
          opacity: 0.95,
          boxShadow: "0 0 40px #00eaff, 0 0 80px #ff00cc"
        });
      },
      onComplete: () => {
        gsap.to(beam1Ref.current, {
          strokeDashoffset: 0,
          duration: 1,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(beam1Ref.current, { opacity: 0, duration: 0.5 });
            // Animate satellite → ground
            // beam2Ref.current.setAttribute('stroke', 'url(#beam-gradient)');
            let grad2 = document.getElementById("beam-gradient-2");
if (!grad2) {
  grad2 = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  grad2.setAttribute("id", "beam-gradient-2");
  grad2.setAttribute("gradientUnits", "userSpaceOnUse");
  defs.appendChild(grad2);

  ["#00eaff", "#00ffcc", "#00ff6a", "#0077ff"].forEach((color, i) => {
    const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop.setAttribute("offset", `${(i / 3) * 100}%`);
    stop.setAttribute("stop-color", color);
    grad2.appendChild(stop);
  });
}
grad2.setAttribute("x1", satellite.x);
grad2.setAttribute("y1", satellite.y);
grad2.setAttribute("x2", ground.x);
grad2.setAttribute("y2", ground.y);

beam2Ref.current.setAttribute("stroke", "url(#beam-gradient-2)");


            gsap.set(beam2Ref.current, {
              attr: { x1: satellite.x, y1: satellite.y, x2: satellite.x, y2: satellite.y },
              opacity: 1,
              filter: 'url(#beam-glow)',
              strokeDasharray: 1000,
              strokeDashoffset: 1000
            });
            gsap.to(beam2Ref.current, {
              attr: { x2: ground.x, y2: ground.y },
              duration: 2,
              ease: 'power2.inOut',
              delay: 1.2,
              onStart: () => {
                gsap.to(beam2Ref.current, {
                  repeat: 8,
                  yoyo: true,
                  duration: 0.14,
                  opacity: 0.95,
                  boxShadow: "0 0 40px #00eaff, 0 0 80px #00ffcc, 0 0 120px #00ff6a"

                });
              },
              onUpdate: function() {
                const progress = this.progress();
                const grad = document.getElementById('beam-gradient');
                if (grad) grad.setAttribute('x1', `${progress * 100}%`);
              },
              onComplete: () => {
                gsap.to(beam2Ref.current, {
                  strokeDashoffset: 0,
                  duration: 1,
                  ease: 'power2.out',
                  onComplete: () => {
                    gsap.to(beam2Ref.current, { opacity: 0, duration: 0.5 });
                    setTimeout(() => {
                      if (onCompleteCallback) onCompleteCallback();
                    }, 300);
                  }
                });
              }
            });
          }
        });
      }
    });
  };

    const handlePerformSDC = () => {
      if (!flightData || !flightData.last_predicted) return;
      setShowCurrentTable(false);
      setShowPredictedTable(false);
      animateReverseLaserBeams(() => {
        setShowPredictedTable(true);
      });
    };

  // Laser beam animation for ground → satellite → aircraft
  const animateReverseLaserBeams = (onCompleteCallback) => {
    if (!gsapReady || !window.gsap) {
      if (onCompleteCallback) onCompleteCallback();
      return;
    }
    const gsap = window.gsap;
    if (!aircraftRef.current || !satelliteRef.current || !groundRef.current || !beam1Ref.current || !beam2Ref.current) {
      if (onCompleteCallback) onCompleteCallback();
      return;
    }

    // Get positions relative to right-panel
    const panel = aircraftRef.current.closest('.right-panel');
    const getCenter = (el) => {
      const rect = el.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      return {
        x: rect.left - panelRect.left + rect.width / 2,
        y: rect.top - panelRect.top + rect.height / 2
      };
    };
    const aircraft = getCenter(aircraftRef.current);
    const satellite = getCenter(satelliteRef.current);
    const ground = getCenter(groundRef.current);

    // Animate ground → satellite
    gsap.set(beam1Ref.current, {
      attr: { x1: ground.x, y1: ground.y, x2: ground.x, y2: ground.y },
      opacity: 1,
      strokeDasharray: 1000,
      strokeDashoffset: 1000
    });
    gsap.to(beam1Ref.current, {
      attr: { x2: satellite.x, y2: satellite.y },
      duration: 1.5,
      ease: 'power2.inOut',
      onComplete: () => {
        gsap.to(beam1Ref.current, {
          strokeDashoffset: 0,
          duration: 1,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(beam1Ref.current, { opacity: 0, duration: 0.5 });
            // Animate satellite → aircraft
            gsap.set(beam2Ref.current, {
              attr: { x1: satellite.x, y1: satellite.y, x2: satellite.x, y2: satellite.y },
              opacity: 1,
              strokeDasharray: 1000,
              strokeDashoffset: 1000
            });
            gsap.to(beam2Ref.current, {
              attr: { x2: aircraft.x, y2: aircraft.y },
              duration: 1.5,
              ease: 'power2.inOut',
              onComplete: () => {
                gsap.to(beam2Ref.current, {
                  strokeDashoffset: 0,
                  duration: 1,
                  ease: 'power2.out',
                  onComplete: () => {
                    gsap.to(beam2Ref.current, { opacity: 0, duration: 0.5 });
                    // Show predicted table after 3 seconds total
                    setTimeout(() => {
                      if (onCompleteCallback) onCompleteCallback();
                    }, 3000);
                  }
                });
              }
            });
          }
        });
      }
    });
  };

  return (
  <div className="aircraft-navigation fade-in">
      {/* Left Panel: Flight selection and button */}
      <div className="sidebar">
        <h2>Flight Navigation</h2>
        <div className="selector">
          {loadingFlights ? (
            <div style={{color: '#aaa', marginBottom: '10px'}}>Loading flights...</div>
          ) : flightError ? (
            <div style={{color: 'red', marginBottom: '10px'}}>{flightError}</div>
          ) : flights.length === 0 ? (
            <div style={{color: '#aaa', marginBottom: '10px'}}>No flights available.</div>
          ) : (
            <>
              <select
                value={selectedIcao24}
                onChange={(e) => setSelectedIcao24(e.target.value)}
              >
                <option value="">Select Flight</option>
                {flights.map((f) => (
                  <option key={f.icao24} value={f.icao24}>
                    {f.callsign} ({f.icao24}) [{f.source}]
                  </option>
                ))}
              </select>
              <button
                onClick={() => fetchTrajectory(selectedIcao24)}
                disabled={!selectedIcao24}
              >
                Show Flight Path
              </button>
            </>
          )}
        </div>
        {/* Current Point Table (shown after beam animation for Show Flight Path) */}
        {showCurrentTable && flightData && flightData.flight && (
          <div className="table-container">
            <h3>Current Coordinates</h3>
            <table>
              <thead>
                <tr>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Restricted</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{flightData.flight.latitude.toFixed(5)}</td>
                  <td>{flightData.flight.longitude.toFixed(5)}</td>
                  <td>{flightData.flight.restricted}</td>
                </tr>
              </tbody>
            </table>
            <button className="redirect-btn" onClick={handlePerformSDC}>
              Perform Superdense Coding
            </button>
           
          </div>
        )}
        {/* Predicted Point Table (shown after beam animation for Superdense Coding) */}
        {showPredictedTable && flightData && flightData.last_predicted ? (
          <div className="table-container">
            <h3>Predicted Coordinates</h3>
            <table>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Restricted</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{flightData.last_predicted.step}</td>
                  <td>{flightData.last_predicted.lat.toFixed(5)}</td>
                  <td>{flightData.last_predicted.lon.toFixed(5)}</td>
                  <td>{flightData.last_predicted.restricted}</td>
                </tr>
              </tbody>
            </table>
            <button
  className="redirect-btn"
  style={{ marginTop: '10px', background: 'linear-gradient(135deg, #764ba2, #22d3ee)' }}
  onClick={() =>
    navigate('/full-simulation', {
      state: {
        predicted: flightData.last_predicted // Pass predicted coordinates
      }
    })
  }
>
  Full Simulation
</button>

          </div>
        ) : (
          showPredictedTable && (
            <div className="table-container">
              <h3>Predicted Coordinates</h3>
              <div style={{color: 'orange', margin: '10px 0'}}>No distinct prediction available. Current and predicted coordinates are the same.</div>
            </div>
          )
        )}
      </div>

      {/* Middle Panel: Map */}
      <div className="map-section">
        <MapContainer center={[20, 78]} zoom={5} className="map">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {restrictedAreas.map((area, idx) => (
            <Polygon key={idx} positions={area} color="red" fillOpacity={0.2} />
          ))}
          {flightData && (
            <>
              <RecenterMap
                lat={flightData.flight.latitude}
                lon={flightData.flight.longitude}
              />
              <Polyline
                positions={flightData.historical_path.map((p) => [p.lat, p.lon])}
                color="green"
                weight={3}
              />
              <Polyline
                positions={flightData.predicted_path.map((p) => [p.lat, p.lon])}
                color="red"
                weight={3}
                dashArray="5,10"
              />
              <Marker
                position={[flightData.flight.latitude, flightData.flight.longitude]}
              >
                <Popup>
                  {flightData.flight.callsign} ({flightData.flight.icao24})<br />
                  Source: {flightData.flight.source}
                </Popup>
              </Marker>
              <Marker
                position={[flightData.last_predicted.lat, flightData.last_predicted.lon]}
                icon={blueIcon}
              >
                <Popup>
                  Predicted Destination<br />
                  Restricted: {flightData.last_predicted.restricted}
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>

      {/* Right Panel: Images + Laser SVG with enhanced filter */}
      <div className="right-panel">
        <img ref={satelliteRef} src="https://res.cloudinary.com/dkpjimiip/image/upload/v1757147259/pngegg_esf5tj.png" alt="Satellite" className="emoji satellite" />
        <img ref={aircraftRef} src={aircraftImg} alt="Aircraft" className="emoji plane" />
        <img ref={groundRef} src={groundImg} alt="Ground Station" className="emoji ground" />
        <svg style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
          <defs>
            <filter id="beam-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            

          </defs>
          <line ref={beam1Ref} stroke="url(#beam-gradient)" strokeWidth="8" strokeLinecap="round" filter="url(#beam-glow)" opacity="0" />
          <line ref={beam2Ref} stroke="url(#beam-gradient)" strokeWidth="8" strokeLinecap="round" filter="url(#beam-glow)" opacity="0" />
        </svg>
      </div>
    </div>
  );
}
