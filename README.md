# Satellite-Ground Secure Communication Simulator

A comprehensive quantum communication simulator that demonstrates secure satellite-to-ground communication using Quantum Key Distribution (QKD) and Superdense Coding protocols.

## Features

- **Quantum Key Distribution (E91 Protocol)**: Generate secure quantum keys using entangled qubit pairs
- **Superdense Coding**: Transmit 2 classical bits using 1 quantum bit
- **End-to-End Simulation**: Complete satellite-ground communication simulation
- **Interactive UI**: Modern, responsive interface with real-time visualization
- **Security Analysis**: Eavesdropper detection and QBER calculation
- **Circuit Visualization**: Quantum circuit diagrams and measurement histograms

## Technology Stack

### Frontend
- React 19.1.1
- Vite 7.1.2
- TailwindCSS 4.1.12
- Framer Motion 12.23.12
- Recharts (for data visualization)
- React Router DOM 7.8.2

### Backend
- Python 3.x
- Flask
- Qiskit (Quantum Computing Framework)
- Matplotlib (for circuit visualization)

## Installation

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8 or higher
- pip (Python package manager)

### Backend Setup

The project uses two separate backend servers for different phases:

#### Testing Phase Backend (app.py)
- **Port**: 5000
- **Purpose**: Original superdense coding testing with local and IBM simulations
- **Endpoints**: `/api/run_simulation`, `/api/health`

#### Application Phase Backend (application.py)  
- **Port**: 5001
- **Purpose**: Satellite-ground communication simulator (QKD + Superdense Coding)
- **Endpoints**: `/api/qkd_simulation`, `/api/superdense_coding`, `/api/full_simulation`, `/api/health`

#### Quick Start (Both Backends)

1. Navigate to the backend directory:
```bash
cd superdense-backend
```

2. Install Python dependencies:
```bash
pip install flask flask-cors qiskit qiskit-aer qiskit-ibm-runtime matplotlib numpy
```

3. **Option A**: Start both backends using the batch script (Windows):
```bash
start_backends.bat
```

**Option B**: Start backends manually in separate terminals:

**Terminal 1 - Testing Phase:**
```bash
python app.py
```

**Terminal 2 - Application Phase:**
```bash
python application.py
```

The backends will run on:
- Testing Phase: `http://localhost:5000`
- Application Phase: `http://localhost:5001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd superdense-frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

### Starting the Application

1. **Start Backend**: Run the Flask server first
2. **Start Frontend**: Run the React development server
3. **Access Application**: Open `http://localhost:5173` in your browser

### Navigation Flow

1. **Landing Page** (`/`): Introduction to the simulator
2. **Navigation Page** (`/navigation`): Choose between Testing and Application phases
3. **Application Phase** (`/home`): Start the satellite-ground communication simulator
4. **QKD Simulation** (`/qkd-simulation`): Generate quantum keys using E91 protocol
5. **Superdense Coding** (`/superdense-coding`): Encode and transmit messages
6. **Full Simulation** (`/full-simulation`): Complete end-to-end simulation

### QKD Simulation

- Select number of qubit pairs (10, 50, 100)
- Toggle Eve (eavesdropper) simulation
- View generated quantum key, QBER, and measurement statistics
- Analyze Alice-Bob measurement matching

### Superdense Coding

- Enter 2-bit message (00, 01, 10, 11)
- View encryption/decryption process
- Analyze success rates and circuit diagrams
- Compare results with and without Eve

### Full Simulation

- Complete end-to-end simulation
- Timeline view of all steps
- Final output analysis
- Security performance metrics

## API Endpoints

### Backend API

- `GET /api/health`: Health check endpoint
- `POST /api/qkd_simulation`: Run QKD simulation
- `POST /api/superdense_coding`: Run superdense coding
- `POST /api/full_simulation`: Run complete simulation
- `POST /api/run_simulation`: Legacy simulation endpoint

### Request/Response Format

#### QKD Simulation
```json
{
  "num_pairs": 10,
  "simulate_eve": false
}
```

#### Superdense Coding
```json
{
  "message": "00",
  "qkd_key": "10101010",
  "simulate_eve": false
}
```

## Project Structure

```
SuperDensee/
├── superdense-backend/
│   └── app.py                 # Flask backend with quantum simulation
├── superdense-frontend/
│   ├── src/
│   │   ├── HomePage.jsx       # Main landing page
│   │   ├── QKDSimulation.jsx  # QKD simulation interface
│   │   ├── SuperdenseCoding.jsx # Superdense coding interface
│   │   ├── FullSimulation.jsx # End-to-end simulation
│   │   ├── Particles.jsx      # Background particle effects
│   │   └── App.jsx           # Main routing component
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Key Features

### Quantum Key Distribution (E91 Protocol)
- Entangled qubit pair generation
- Random measurement bases
- QBER calculation
- Eavesdropper detection

### Superdense Coding
- Bell state preparation
- Message encoding (X, Z, XZ operations)
- Quantum transmission simulation
- Success rate analysis

### Security Analysis
- Quantum Bit Error Rate (QBER) monitoring
- Eavesdropper detection
- Key security assessment
- Transmission success metrics

## Troubleshooting

### Common Issues

1. **Backend Connection Error**
   - Ensure Flask server is running on port 5000
   - Check CORS configuration
   - Verify Python dependencies are installed

2. **Frontend Build Issues**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility
   - Verify all dependencies in package.json

3. **Quantum Simulation Errors**
   - Ensure Qiskit is properly installed
   - Check Python environment
   - Verify quantum backend availability

### Development

- Backend logs are displayed in the terminal running `python app.py`
- Frontend hot-reload is enabled for development
- API endpoints can be tested using tools like Postman or curl

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Qiskit team for quantum computing framework
- React and Vite communities for frontend tools
- Quantum information theory researchers

---

**Note**: This simulator is for educational and research purposes. Real quantum communication systems require specialized hardware and security considerations.
