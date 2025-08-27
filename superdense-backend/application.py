# ====================================================
# Flask API for Satellite-to-Ground BB84 QKD + Superdense Coding
# Fully corrected with non-GUI Matplotlib backend and accurate Bloch Spheres
# ====================================================

import io
import random
import base64
import numpy as np
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister, transpile
from qiskit_aer import AerSimulator
from qiskit.quantum_info import Statevector, DensityMatrix, partial_trace
from qiskit.visualization import plot_histogram
from qiskit.visualization.bloch import Bloch

# ---------------- Matplotlib backend fix ----------------
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

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
    img_str = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return img_str

def plot_qubit_bloch(state, qubit_index=0, title="Qubit Bloch Sphere", description=""):
    reduced_dm = partial_trace(state, [i for i in range(state.num_qubits) if i != qubit_index])
    X = np.array([[0,1],[1,0]])
    Y = np.array([[0,-1j],[1j,0]])
    Z = np.array([[1,0],[0,-1]])
    bloch_vector = [
        np.real(np.trace(reduced_dm.data @ X)),
        np.real(np.trace(reduced_dm.data @ Y)),
        np.real(np.trace(reduced_dm.data @ Z))
    ]
    fig = plt.figure()
    ax = fig.add_subplot(111, projection='3d')
    b = Bloch(axes=ax)
    b.add_vectors(bloch_vector)
    b.title = title
    fig.text(0.5, 0.01, description, wrap=True, horizontalalignment='center', fontsize=8)
    b.render()
    return fig_to_base64(fig)

# ====================================================
# BB84 QKD
# ====================================================
def bb84_qkd(num_qubits=50, backend=None, eve=False):
    if backend is None:
        backend = AerSimulator()

    alice_bits, bob_bits = [], []
    alice_bases, bob_bases = [], []
    bloch_pairs = []
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
        alice_state = Statevector.from_instruction(qc.copy())

        if b_basis == "X":
            qc.h(q[0])

        # Eve intercepts during QKD
        if eve:
            qc.measure(q[0], c[0])
            qc.reset(q[0])

        qc.measure(q[0], c[0])
        if qc_example is None:
            qc_example = qc
        result = backend.run(qc, shots=1).result()
        bob_bit = list(result.get_counts().keys())[0]
        bob_bits.append(bob_bit)

        if i < 2:
            qc_bob_viz = QuantumCircuit(1)
            if b_basis == "Z" and bob_bit == '1':
                qc_bob_viz.x(0)
            elif b_basis == "X" and bob_bit == '0':
                qc_bob_viz.h(0)
            elif b_basis == "X" and bob_bit == '1':
                qc_bob_viz.x(0)
                qc_bob_viz.h(0)
            bob_post_measurement_state = Statevector.from_instruction(qc_bob_viz)
            bloch_pairs.append({
                "alice": plot_qubit_bloch(alice_state, 0, f"Alice Qubit {i+1}", f"Alice bit '{a_bit}' basis {a_basis}"),
                "bob": plot_qubit_bloch(bob_post_measurement_state, 0, f"Bob Qubit {i+1}", f"Bob measures {bob_bit} basis {b_basis}")
            })

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
        "bloch_spheres": bloch_pairs,
        "circuit": fig_to_base64(qc_example.draw(output="mpl")),
        "secure": not eve  # Add flag for QKD security
    }

# ====================================================
# Superdense Coding with Eve effect
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

    # Encode message
    if encrypted == ("0","1"):
        qc.x(q[0])
    elif encrypted == ("1","0"):
        qc.z(q[0])
    elif encrypted == ("1","1"):
        qc.x(q[0])
        qc.z(q[0])

    # Eve intercepts during SDC
    if eve:
        qc.measure(q[0], c[0])
        qc.reset(q[0])  # Destroy entanglement

    state = Statevector.from_instruction(qc.copy())
    density = DensityMatrix(state)

    qc.cx(q[0], q[1])
    qc.h(q[0])
    qc.measure([q[1], q[0]], c)

    tqc = transpile(qc, backend)
    result = backend.run(tqc, shots=1024).result()
    counts = result.get_counts()

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

    return {
        "encrypted_message": encrypted,
        "entanglement_status": "Destroyed by Eve" if eve else "Entanglement established between qubits",
        "communication_status": "Message garbled due to Eve" if eve else "Message transmitted via entangled pair",
        "circuit": fig_to_base64(qc.draw(output="mpl")),
        "statevector": complex_to_json(state.data.tolist()),
        "density_matrix": complex_to_json(density.data.tolist()),
        "bloch_spheres": [
            plot_qubit_bloch(state, 0, "SDC Qubit 0", f"Qubit 0 after encoding {message}"),
            plot_qubit_bloch(state, 1, "SDC Qubit 1", "Qubit 1 (partner) after encoding")
        ],
        "histogram": counts
    }

# ====================================================
# Flask App
# ====================================================
app = Flask(__name__)
CORS(app)
backend = AerSimulator()

@app.route("/qkd", methods=["POST"])
def qkd_route():
    try:
        data = request.json
        num_qubits = data.get("num_qubits", 50)
        eve = data.get("eve", False)
        if num_qubits not in [10, 50, 100]:
            return jsonify({"error": "Invalid number of qubits"}), 400
        result = bb84_qkd(num_qubits=num_qubits, backend=backend, eve=eve)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"QKD simulation failed: {str(e)}"}), 500

@app.route("/sdc", methods=["POST"])
def sdc_route():
    try:
        data = request.json
        message = data.get("message")
        key = data.get("qkd_key")
        qkd_secure = data.get("qkd_secure", True)
        eve = data.get("eve", False)

        if not qkd_secure:
            return jsonify({"error": "QKD key compromised! Channel insecure. Restart key generation."}), 400
        if not message or message not in ["00","01","10","11"]:
            return jsonify({"error": "Invalid message"}), 400
        if not key:
            return jsonify({"error": "QKD key is required"}), 400

        result = superdense_coding(message, key, eve=eve, backend=backend)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Superdense coding failed: {str(e)}"}), 500

@app.route("/full-simulation", methods=["POST"])
def full_simulation():
    try:
        data = request.json
        message = data.get("message", "01")
        num_qubits = data.get("num_qubits", 50)
        qkd_eve = data.get("qkd_eve", False)
        sdc_eve = data.get("sdc_eve", False)

        qkd_result = bb84_qkd(num_qubits=num_qubits, backend=backend, eve=qkd_eve)
        key = qkd_result["qkd_key"][:2] if len(qkd_result["qkd_key"]) >= 2 else "00"

        if not qkd_result["secure"]:
            return jsonify({"error": "QKD key compromised! Restart key generation."}), 400

        sdc_result = superdense_coding(message, key, eve=sdc_eve, backend=backend)
        return jsonify({"qkd": qkd_result, "sdc": sdc_result})
    except Exception as e:
        return jsonify({"error": f"Full simulation failed: {str(e)}"}), 500

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "Satellite-Ground Communication Simulator Backend"})

# ====================================================
# Main
# ====================================================
if __name__ == "__main__":
    app.run(debug=True, port=5001)
