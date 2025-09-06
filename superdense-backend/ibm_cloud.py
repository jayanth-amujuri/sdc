# application.py
# ====================================================
# Flask API for Superdense Coding of Latitude, Longitude, and Restricted Status
# with real-time progress updates via SSE
# ====================================================

import time
from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from qiskit import QuantumRegister, ClassicalRegister, QuantumCircuit
from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2 as Sampler
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
import json

# -----------------------
# Flask Setup
# -----------------------
app = Flask(__name__)
CORS(app)  # allow frontend access

# -----------------------
# Utility Functions
# -----------------------
def text_to_bits(text: str) -> str:
    return ''.join(f"{b:08b}" for b in text.encode('utf-8'))

def bits_to_text(bits: str) -> str:
    bits_trimmed = bits[:(len(bits) // 8) * 8]
    if not bits_trimmed:
        return ""
    bytes_list = [int(bits_trimmed[i:i+8], 2) for i in range(0, len(bits_trimmed), 8)]
    return bytes(bytes_list).decode('utf-8', errors='replace')

def sdc_circuit_for_2bits(msg2: str):
    qr = QuantumRegister(2, 'q')
    cr = ClassicalRegister(2, 'c')
    qc = QuantumCircuit(qr, cr, name=f"SDC {msg2}")

    # Entangle
    qc.h(0)
    qc.cx(0, 1)

    # Alice encoding
    if msg2 == '01':
        qc.z(0)
    elif msg2 == '10':
        qc.x(0)
    elif msg2 == '11':
        qc.z(0)
        qc.x(0)

    # Bob decode
    qc.cx(0, 1)
    qc.h(0)
    qc.measure(qr, cr)
    return qc

# -----------------------
# IBM Quantum Service Setup
# -----------------------
IBM_API_TOKEN = "G8nlBsI-xAK0AFVXgQNRZ6QDFZM82y-pk9fsoxLCEhfC"  # replace with your IBM API token
SERVICE_INSTANCE = None

service = QiskitRuntimeService(
    channel="ibm_cloud",
    token=IBM_API_TOKEN,
    instance=SERVICE_INSTANCE
)

backend = service.least_busy(simulator=False, operational=True)
pm = generate_preset_pass_manager(backend=backend, optimization_level=1)
sampler = Sampler(backend)

# -----------------------
# SSE Helper
# -----------------------
def stream_sdc(message_text, blocks):
    decoded_bits = ""
    round_summaries = []
    first_two_circuits = []

    for i, block in enumerate(blocks):
        qc = sdc_circuit_for_2bits(block)
        if i < 2:
            first_two_circuits.append(str(qc.draw(output='text')))

        isa_circ = pm.run(qc)
        job = sampler.run([isa_circ], shots=1024)
        res = job.result()
        pub = res[0]
        counts = getattr(pub.data, "c").get_counts()
        measured = max(counts, key=counts.get)

        decoded_bits += measured
        round_summary = {
            "round": i + 1,
            "sent": block,
            "measured": measured,
            "counts": counts
        }
        round_summaries.append(round_summary)

        # Send progress update
        progress_data = {
            "round": i + 1,
            "sent": block,
            "measured": measured,
            "counts": counts,
            "message": f"Round {i+1}/{len(blocks)} completed"
        }
        yield f"data: {json.dumps(progress_data)}\n\n"

        time.sleep(0.1)

    # Final result
    decoded_bits = decoded_bits[:len(text_to_bits(message_text))]
    decrypted_text = bits_to_text(decoded_bits)
    success = decrypted_text == message_text

    final_result = {
        "original_text": message_text,
        "decoded_text": decrypted_text,
        "decoded_bits": decoded_bits,
        "success": success,
        "first_two_circuits": first_two_circuits,
        "round_summaries": round_summaries,
        "completed": True
    }
    yield f"data: {json.dumps(final_result)}\n\n"

# -----------------------
# SSE Route (GET for EventSource)
# -----------------------
@app.route("/sdc/send-stream", methods=["GET"])
def sdc_send_stream():
    try:
        latitude = request.args.get("latitude", "33.89729")
        longitude = request.args.get("longitude", "74.24314")
        restricted_status = request.args.get("restricted_status", "0")

        message_text = f"{latitude},{longitude},{restricted_status}"
        plaintext_bits = text_to_bits(message_text)
        blocks = [plaintext_bits[i:i+2].ljust(2, '0') for i in range(0, len(plaintext_bits), 2)]

        return Response(stream_sdc(message_text, blocks), mimetype="text/event-stream")

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------
# Run Flask
# -----------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=True)
