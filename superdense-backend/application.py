# application.py

# ====================================================
# Flask API for Satellite-to-Ground BB84 QKD + Superdense Coding
# with real satellite data integration
# ====================================================

import io
import random
import base64
import numpy as np
import logging
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import pytz  # Added for timezone conversion
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister, transpile
from qiskit_aer import AerSimulator
from qiskit.quantum_info import Statevector, DensityMatrix, partial_trace
from qiskit.visualization.bloch import Bloch

# Use a non-interactive backend for Matplotlib, suitable for servers
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# --------------------------
# Logging Configuration
# --------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ====================================================
# Helper Functions
# ====================================================

def fig_to_base64(fig):
    """Converts a Matplotlib figure to a base64 encoded string."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", facecolor='none')
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return img_str

def plot_qubit_bloch(state, qubit_index=0, title="Qubit Bloch Sphere", description=""):
    # Reduce the state to the qubit of interest (if multi-qubit state)
    reduced_dm = partial_trace(state, [i for i in range(state.num_qubits) if i != qubit_index])
    
    # Pauli matrices
    X = np.array([[0, 1], [1, 0]])
    Y = np.array([[0, -1j], [1j, 0]])
    Z = np.array([[1, 0], [0, -1]])
    
    # Compute the expectation values for X, Y, and Z for the given qubit
    bloch_vector = [
        np.real(np.trace(reduced_dm.data @ X)),  # X-component
        np.real(np.trace(reduced_dm.data @ Y)),  # Y-component
        np.real(np.trace(reduced_dm.data @ Z)),  # Z-component
    ]
    
    # Create a Bloch sphere visualization
    fig = plt.figure(figsize=(4, 4))
    ax = fig.add_subplot(111, projection='3d')
    
    # Plot Bloch vector on the Bloch sphere
    b = Bloch(axes=ax)
    b.add_vectors(bloch_vector)
    
    b.title = title
    fig.text(0.5, 0.01, description, wrap=True, horizontalalignment='center', fontsize=8)
    
    # Render the Bloch sphere
    b.render()
    
    return fig_to_base64(fig)


def complex_to_json(obj):
    """Recursively converts an object to be JSON serializable, handling complex numbers."""
    if isinstance(obj, (np.complex128, complex)):
        return {"real": obj.real, "imaginary": obj.imag}
    if isinstance(obj, np.ndarray):
        return complex_to_json(obj.tolist())
    if isinstance(obj, list):
        return [complex_to_json(item) for item in obj]
    if isinstance(obj, dict):
        return {key: complex_to_json(value) for key, value in obj.items()}
    if isinstance(obj, (np.float64, np.float32)):
        return float(obj)
    if isinstance(obj, (np.int64, np.int32)):
        return int(obj)
    return obj

# --- NEW: Function to convert Unix timestamp to local real time ---
def convert_timestamp_to_realtime(timestamp, timezone='Asia/Kolkata'):
    """Converts a Unix timestamp to a human-readable local time string."""
    try:
        # Create a timezone-aware datetime object in UTC
        dt_utc = datetime.fromtimestamp(timestamp, pytz.utc)
        # Convert it to the desired local timezone
        local_tz = pytz.timezone(timezone)
        dt_local = dt_utc.astimezone(local_tz)
        return dt_local.strftime('%Y-%m-%d %H:%M:%S %Z')
    except Exception:
        return "Invalid Timestamp"

# --- MODIFIED: Function to fetch satellite data ---
def get_satellite_message():
    """Fetches real satellite data and returns detailed information."""
    API_KEY = "483GR2-T9547D-3KK4SX-5K32"  # Replace with your N2YO API key
    SAT_ID = 25544  # ISS (International Space Station)
    LAT, LON = 16.5, 81.5 # Observer's ground station coordinates (Bhimavaram, India)
    try:
        url = f"https://api.n2yo.com/rest/v1/satellite/positions/{SAT_ID}/{LAT}/{LON}/0/1/&apiKey={API_KEY}"
        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        pos = data["positions"][0]

        lat_bit = "1" if pos["satlatitude"] >= 0 else "0"
        lon_bit = "1" if pos["satlongitude"] >= 0 else "0"
        
        # Get additional data and convert timestamp
        timestamp = pos.get("timestamp", 0)
        real_time = convert_timestamp_to_realtime(timestamp)
        eclipsed = pos.get("eclipsed", False)

        return {
            "binary_message": f"{lat_bit}{lon_bit}",
            "latitude": pos.get("satlatitude", 0.0),
            "longitude": pos.get("satlongitude", 0.0),
            "real_time": real_time,
            "eclipsed": eclipsed,
        }
    except Exception as e:
        logger.warning(f"Satellite API fetch failed: {str(e)}. Using default data.")
        return {
            "binary_message": "01",
            "latitude": 0.0,
            "longitude": 0.0,
            "real_time": "N/A",
            "eclipsed": False,
        }

# ====================================================
# E91 QKD Protocol (simplified to only return the key)
# ====================================================
def e91_qkd(num_pairs=50, backend=None, eve=False):
    if backend is None:
        backend = AerSimulator()

    key_bits = []
    mismatches, total_matches = 0, 0

    for _ in range(num_pairs):
        qc = QuantumCircuit(2, 2)

        # Create entangled pair
        qc.h(0)
        qc.cx(0, 1)

        # Choose random measurement bases for Alice & Bob
        alice_basis = random.choice(["Z", "X"])
        bob_basis = random.choice(["Z", "X"])

        if alice_basis == "X":
            qc.h(0)
        if bob_basis == "X":
            qc.h(1)

        qc.measure([0, 1], [0, 1])
        result = backend.run(qc, shots=1).result().get_counts()

        outcome = list(result.keys())[0]
        alice_bit, bob_bit = outcome[::-1]  # [0]=Alice, [1]=Bob

        if alice_basis == bob_basis:
            total_matches += 1
            if alice_bit == bob_bit:
                key_bits.append(alice_bit)
            else:
                mismatches += 1

    q_error_rate = (mismatches / total_matches) if total_matches > 0 else 1.0

    return {
        "qkd_key": "".join(key_bits),
        "qber": q_error_rate,
        "secure": q_error_rate < 0.11 and not eve
    }
# ====================================================
# Superdense Coding Protocol
# ====================================================
def superdense_coding(message: str, key_bits, eve=False, backend=None):
    if backend is None:
        backend = AerSimulator()
    if len(key_bits) < 2:
        raise ValueError("Need at least 2 QKD bits for encryption")

    encrypted = "".join([
        "1" if message[0] != key_bits[0] else "0",
        "1" if message[1] != key_bits[1] else "0"
    ])

    qc = QuantumCircuit(2, 2)
    
    qc.h(0); qc.cx(0, 1); qc.barrier()

    if encrypted == ("0", "1"): qc.x(0)
    elif encrypted == ("1", "0"): qc.z(0)
    elif encrypted == ("1", "1"): qc.z(0); qc.x(0)
    qc.barrier()
    
    viz_qc = qc.copy()
    viz_qc.remove_final_measurements(inplace=True)
    state_for_viz = Statevector.from_instruction(viz_qc)
    density = DensityMatrix(state_for_viz)

    if eve:
        qc.measure(0, 0)
        qc.barrier()

    qc.cx(0, 1); qc.h(0); qc.barrier()
    qc.measure([0, 1], [0, 1])
    
    result = backend.run(qc, shots=1024).result()
    counts = result.get_counts()

    return {
        "encrypted_message": encrypted,
        "entanglement_status": "Destroyed by Eve" if eve else "Entanglement established",
        "communication_status": "Message garbled due to Eve" if eve else "Message transmitted securely",
        "circuit": fig_to_base64(qc.draw(output="mpl")),
        "density_matrix": complex_to_json(density.data),
        "bloch_spheres": [
            plot_qubit_bloch(state_for_viz, 0, "SDC Qubit 0", f"Alice's qubit after encoding '{message}'"),
            plot_qubit_bloch(state_for_viz, 1, "SDC Qubit 1", "Bob's entangled partner qubit")
        ],
        "histogram": counts
    }

# ====================================================
# Flask App and Routes
# ====================================================
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
backend = AerSimulator()


@app.route("/qkd", methods=["POST"])
def qkd_route():
    """
    Generate a QKD key with correct length (at least as long as message bits if provided).
    """
    try:
        data = request.json
        num_qubits = int(data.get("num_qubits", 50))
        message = str(data.get("message", ""))  # optional, for length check
        required_length = len(message) if message else num_qubits

        qkd_key = ""
        qkd_result = None

        # Keep generating until key is long enough
        while len(qkd_key) < required_length:
            qkd_result = e91_qkd(num_pairs=num_qubits, backend=backend)
            qkd_key += qkd_result.get("qkd_key", "")

        # Trim key
        qkd_key = qkd_key[:required_length]
        qkd_result["qkd_key"] = qkd_key

        return jsonify({
            "qkd_key": qkd_key,
            "qber": qkd_result["qber"],
            "secure": qkd_result["secure"]
        })

    except Exception as e:
        logger.exception("QKD route failed")
        return jsonify({"error": f"QKD route failed: {str(e)}"}), 500


# --- MODIFIED: /sdc endpoint to return all satellite data ---
@app.route("/sdc", methods=["POST"])
def sdc_route():
    try:
        data = request.json
        qkd_key = data.get("qkd_key")
        sdc_eve = bool(data.get("sdc_eve", False))

        if not qkd_key or len(qkd_key) < 2:
            return jsonify({"error": "A valid QKD key of at least 2 bits is required."}), 400

        satellite_data = get_satellite_message()
        message = satellite_data["binary_message"]

        sdc_result = superdense_coding(message, qkd_key, eve=sdc_eve, backend=backend)
        
        # Combine SDC results with the full satellite data for the response
        response_data = {
            "sdc": sdc_result,
            "sat_message": satellite_data["binary_message"],
            "sat_latitude": satellite_data["latitude"],
            "sat_longitude": satellite_data["longitude"],
            "sat_real_time": satellite_data["real_time"],
            "sat_eclipsed": satellite_data["eclipsed"],
        }
        return jsonify(response_data)
    except Exception as e:
        logger.exception("SDC simulation failed")
        return jsonify({"error": f"SDC simulation failed: {str(e)}"}), 500
@app.route("/full-simulation", methods=["POST"])
def full_simulation_route():
    try:
        data = request.json
        message = data.get("message", "00")
        num_qubits = int(data.get("num_qubits", 50))
        qkd_eve = bool(data.get("qkd_eve", False))
        sdc_eve = bool(data.get("sdc_eve", False))

        # Step 1: Run QKD until key is long enough
        required_length = len(message)
        qkd_key = ""
        qkd_result = None

        while len(qkd_key) < required_length:
            qkd_result = e91_qkd(num_pairs=num_qubits, backend=backend, eve=qkd_eve)
            qkd_key += qkd_result.get("qkd_key", "")

        # Trim to exact required length
        qkd_key = qkd_key[:required_length]
        qkd_result["qkd_key"] = qkd_key


        if not qkd_key or len(qkd_key) < 2:
            return jsonify({"error": "QKD failed to generate a secure key."}), 400

        # Step 2: Run Superdense Coding using QKD key
        sdc_result = superdense_coding(message, qkd_key, eve=sdc_eve, backend=backend)

        return jsonify({
            "qkd": qkd_result,
            "sdc": sdc_result
        })
    except Exception as e:
        logger.exception("Full simulation failed")
        return jsonify({"error": f"Full simulation failed: {str(e)}"}), 500



@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "Satellite-Ground Communication Simulator Backend"})

if __name__ == "__main__":
    app.run(debug=True, port=5001)