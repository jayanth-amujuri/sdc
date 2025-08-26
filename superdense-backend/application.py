# ====================================================
# Flask API for Satellite-to-Ground BB84 QKD + Superdense Coding
# ====================================================
import io
import random
import base64
import numpy as np
import matplotlib.pyplot as plt
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister, transpile
from qiskit_aer import AerSimulator
from qiskit.quantum_info import Statevector, DensityMatrix, partial_trace
from qiskit.visualization import plot_histogram
from qiskit.visualization.bloch import Bloch

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ====================================================
# Helper Functions
# ====================================================
def fig_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")

def plot_qubit_bloch(state, qubit_index=0, title="Qubit Bloch Sphere"):
    reduced_dm = partial_trace(state, [i for i in range(state.num_qubits) if i != qubit_index])
    bloch_vector = [
        np.real(np.trace(reduced_dm.data @ np.array([[0,1],[1,0]]))),
        np.real(np.trace(reduced_dm.data @ np.array([[0,-1j],[1j,0]]))),
        np.real(np.trace(reduced_dm.data @ np.array([[1,0],[0,-1]])))
    ]
    fig = plt.figure()
    ax = fig.add_subplot(111, projection="3d")
    b = Bloch(axes=ax)
    b.add_vectors(bloch_vector)
    b.title = title
    b.show()
    return fig_to_base64(fig)

# ====================================================
# BB84 QKD
# ====================================================
def bb84_qkd(num_qubits=50, backend=None, eve=False):
    if backend is None:
        backend = AerSimulator()

    alice_bits, bob_bits = [], []
    alice_bases, bob_bases = [], []
    bloch_states = []
    qc_example = None

    for i in range(num_qubits):
        a_bit = random.choice([0, 1])
        a_basis = random.choice(["Z", "X"])
        b_basis = random.choice(["Z", "X"])
        alice_bits.append(str(a_bit))
        alice_bases.append(a_basis)
        bob_bases.append(b_basis)

        q = QuantumRegister(1, "q")
        c = ClassicalRegister(1, "c")
        qc = QuantumCircuit(q, c)

        if a_bit == 1:
            qc.x(q[0])
        if a_basis == "X":
            qc.h(q[0])

        qc_no_measure = qc.copy()
        state = Statevector.from_instruction(qc_no_measure)
        bloch_states.append(state)

        if eve:
            eve_reg = ClassicalRegister(1, "eve")
            qc.add_register(eve_reg)
            qc.measure(q[0], eve_reg[0])
            qc.reset(q[0])

        if b_basis == "X":
            qc.h(q[0])
        qc.measure(q[0], c[0])

        if qc_example is None:
            qc_example = qc

        result = backend.run(qc, shots=1).result()
        bob_bit = list(result.get_counts().keys())[0]
        bob_bits.append(bob_bit)

    # Sifting
    key_bits, sifted_bits = [], []
    mismatches, total_matches = 0, 0
    for a_b, b_b, a_bit, b_bit in zip(alice_bases, bob_bases, alice_bits, bob_bits):
        if a_b == b_b:
            total_matches += 1
            sifted_bits.append((a_bit, b_bit))
            if a_bit == b_bit:
                key_bits.append(a_bit)
            else:
                mismatches += 1

    q_error_rate = (mismatches / total_matches) if total_matches > 0 else 1.0

    return {
        "qkd_key": "".join(key_bits),
        "qber": q_error_rate,
        "sifted_bits": sifted_bits,
        "alice_bits": alice_bits,
        "bob_bits": bob_bits,
        "alice_bases": alice_bases,
        "bob_bases": bob_bases,
        "bloch_spheres": [plot_qubit_bloch(state, 0, f"BB84 Qubit {i}") for i, state in enumerate(bloch_states[:5])],
        "circuit": fig_to_base64(qc_example.draw(output="mpl"))
    }

# ====================================================
# Superdense Coding
# ====================================================
def superdense_coding(message: str, key_bits, eve=False, backend=None):
    if backend is None:
        backend = AerSimulator()
    if len(key_bits) < 2:
        raise ValueError("Need at least 2 QKD bits")

    encrypted = (
        "1" if message[0] != key_bits[0] else "0",
        "1" if message[1] != key_bits[1] else "0"
    )

    q = QuantumRegister(2, "q")
    c = ClassicalRegister(2, "c")
    qc = QuantumCircuit(q, c)

    qc.h(q[0])
    qc.cx(q[0], q[1])

    if encrypted == ("0","1"):
        qc.x(q[0])
    elif encrypted == ("1","0"):
        qc.z(q[0])
    elif encrypted == ("1","1"):
        qc.x(q[0]); qc.z(q[0])

    qc_no_measure = qc.copy()
    state = Statevector.from_instruction(qc_no_measure)
    density = DensityMatrix(state)

    if eve:
        eve_reg = ClassicalRegister(1, "eve")
        qc.add_register(eve_reg)
        qc.measure(q[0], eve_reg[0])
        qc.reset(q[0])

    qc.cx(q[0], q[1])
    qc.h(q[0])
    qc.measure([q[1], q[0]], c)

    tqc = transpile(qc, backend)
    result = backend.run(tqc, shots=1024).result()
    counts = result.get_counts()

    # Convert complex numbers to JSON-serializable format
    def complex_to_json(obj):
        if isinstance(obj, complex):
            return {"real": float(obj.real), "imaginary": float(obj.imag)}
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, list):
            return [complex_to_json(item) for item in obj]
        elif isinstance(obj, dict):
            return {key: complex_to_json(value) for key, value in obj.items()}
        else:
            return obj

    # Convert statevector and density matrix to JSON-serializable format
    statevector_json = complex_to_json(state.data.tolist())
    density_matrix_json = complex_to_json(density.data.tolist())

    return {
        "encrypted_message": encrypted,
        "entanglement_status": "Entanglement established between qubits",
        "communication_status": "Message transmitted via entangled pair",
        "circuit": fig_to_base64(qc.draw(output="mpl")),
        "statevector": statevector_json,
        "density_matrix": density_matrix_json,
        "bloch_spheres": [plot_qubit_bloch(state, i, f"SDC Qubit {i}") for i in range(2)],
        "histogram": counts
    }

# ====================================================
# Flask App
# ====================================================
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
backend = AerSimulator()

@app.route("/qkd", methods=["POST"])
def qkd_route():
    try:
        logger.info("Received QKD request")
        data = request.json
        if not data:
            logger.error("No JSON data provided")
            return jsonify({"error": "No JSON data provided"}), 400
        
        num_qubits = data.get("num_qubits", 50)
        eve = data.get("eve", False)
        
        logger.info(f"QKD parameters: num_qubits={num_qubits}, eve={eve}")
        
        if num_qubits not in [10, 50, 100]:
            logger.error(f"Invalid number of qubits: {num_qubits}")
            return jsonify({"error": "Invalid number of qubits. Must be 10, 50, or 100"}), 400
        
        result = bb84_qkd(num_qubits=num_qubits, backend=backend, eve=eve)
        logger.info("QKD simulation completed successfully")
        return jsonify(result)
    except Exception as e:
        logger.error(f"QKD simulation failed: {str(e)}")
        return jsonify({"error": f"QKD simulation failed: {str(e)}"}), 500

@app.route("/sdc", methods=["POST"])
def sdc_route():
    try:
        logger.info("Received SDC request")
        data = request.json
        if not data:
            logger.error("No JSON data provided")
            return jsonify({"error": "No JSON data provided"}), 400
        
        message = data.get("message")
        key = data.get("qkd_key")
        eve = data.get("eve", False)
        
        logger.info(f"SDC parameters: message={message}, key_length={len(key) if key else 0}, eve={eve}")
        
        if not message or message not in ["00", "01", "10", "11"]:
            logger.error(f"Invalid message: {message}")
            return jsonify({"error": "Invalid message. Must be one of: 00, 01, 10, 11"}), 400
        
        if not key:
            logger.error("QKD key is required")
            return jsonify({"error": "QKD key is required"}), 400
        
        result = superdense_coding(message, key, eve=eve, backend=backend)
        logger.info("SDC simulation completed successfully")
        return jsonify(result)
    except ValueError as e:
        logger.error(f"SDC ValueError: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"SDC simulation failed: {str(e)}")
        return jsonify({"error": f"Superdense coding failed: {str(e)}"}), 500

@app.route("/full-simulation", methods=["POST"])
def full_simulation():
    try:
        logger.info("Received full simulation request")
        data = request.json
        if not data:
            logger.error("No JSON data provided")
            return jsonify({"error": "No JSON data provided"}), 400
        
        message = data.get("message", "01")
        num_qubits = data.get("num_qubits", 50)
        
        logger.info(f"Full simulation parameters: message={message}, num_qubits={num_qubits}")
        
        if message not in ["00", "01", "10", "11"]:
            logger.error(f"Invalid message: {message}")
            return jsonify({"error": "Invalid message. Must be one of: 00, 01, 10, 11"}), 400
        
        if num_qubits not in [10, 50, 100]:
            logger.error(f"Invalid number of qubits: {num_qubits}")
            return jsonify({"error": "Invalid number of qubits. Must be 10, 50, or 100"}), 400

        logger.info("Starting QKD simulation...")
        qkd_result = bb84_qkd(num_qubits=num_qubits, backend=backend, eve=False)
        key = qkd_result["qkd_key"][:2] if len(qkd_result["qkd_key"]) >= 2 else "00"
        logger.info(f"QKD completed, using key: {key}")

        logger.info("Starting SDC simulation...")
        sdc_result = superdense_coding(message, key, eve=False, backend=backend)
        logger.info("Full simulation completed successfully")

        return jsonify({
            "qkd": qkd_result,
            "sdc": sdc_result
        })
    except Exception as e:
        logger.error(f"Full simulation failed: {str(e)}")
        return jsonify({"error": f"Full simulation failed: {str(e)}"}), 500

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Satellite-Ground Communication Simulator Backend (Application Phase)"
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

# ====================================================
# Main
# ====================================================
if __name__ == "__main__":
    app.run(debug=True, port=5001)
