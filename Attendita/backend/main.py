import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, db

app = Flask(__name__)
CORS(app)

# --- DYNAMIC PATH FIX ---
# This gets the absolute path of the folder containing main.py (the 'backend' folder)
current_dir = os.path.dirname(os.path.abspath(__file__))

# This correctly points to the config file by going up one level to the root
# and then into the 'config' directory.
key_path = os.path.join(current_dir, "..", "config", "serviceAccountKey.json")

# Initialize Firebase with the dynamic path
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://attendance-portal-e81f3-default-rtdb.europe-west1.firebasedatabase.app'
        })
        print("✅ Firebase connected successfully using path:", key_path)
    except Exception as e:
        print(f"❌ Error loading serviceAccountKey.json: {e}")

@app.route('/verify-attendance', methods=['POST'])
def verify_attendance():
    try:
        data = request.json
        session_code = data.get('session_code')
        student_id = data.get('student_id')

        if not session_code or not student_id:
            return jsonify({"success": False, "msg": "Missing session or student ID"}), 400

        # Reference: sessions -> [session_code] -> students -> [student_id]
        ref_path = f"sessions/{session_code}/students/{student_id}"
        student_ref = db.reference(ref_path)
        
        student_ref.update({"present": True})
        
        return jsonify({"success": True, "msg": "Attendance marked!"})
    
    except Exception as e:
        return jsonify({"success": False, "msg": str(e)}), 500

if __name__ == '__main__':
    # Running on port 5000 for your Attendita frontend to reach
    app.run(port=5000, debug=True)