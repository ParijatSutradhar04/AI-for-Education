#!/usr/bin/env python3
"""
Test Backend for AI Chatbot with RAG Pipeline
This is a Flask backend for testing the frontend integration.
It provides sample responses and debugging capabilities.
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import time
import random
import atexit
import signal
import sys
import glob
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
# Enable CORS for all routes with specific configuration
CORS(app, 
     origins=['http://localhost:5598', 'http://127.0.0.1:5598', 'http://localhost:5599', 'http://127.0.0.1:5599', 'http://localhost:*', 'http://127.0.0.1:*'],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     supports_credentials=False)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def cleanup_uploads():
    """Delete all PDF files from the uploads directory"""
    try:
        pdf_files = glob.glob(os.path.join(UPLOAD_FOLDER, "*.pdf"))
        deleted_count = 0
        
        print(f"\n{'='*60}")
        print("🧹 CLEANING UP UPLOADED FILES")
        print(f"{'='*60}")
        
        if pdf_files:
            print(f"📄 Found {len(pdf_files)} PDF file(s) to delete:")
            for pdf_file in pdf_files:
                try:
                    os.remove(pdf_file)
                    filename = os.path.basename(pdf_file)
                    print(f"   ✅ Deleted: {filename}")
                    deleted_count += 1
                except Exception as e:
                    filename = os.path.basename(pdf_file)
                    print(f"   ❌ Failed to delete {filename}: {str(e)}")
            
            print(f"\n🗑️  Successfully deleted {deleted_count} PDF file(s)")
        else:
            print("📭 No PDF files found to delete")
        
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {str(e)}")

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    print(f"\n\n🛑 Received shutdown signal ({signum})")
    cleanup_uploads()
    print("👋 Backend server stopped gracefully")
    sys.exit(0)

# Register cleanup function to run when the program exits
atexit.register(cleanup_uploads)

# Register signal handlers for graceful shutdown
signal.signal(signal.SIGINT, signal_handler)   # Ctrl+C
signal.signal(signal.SIGTERM, signal_handler)  # Termination signal

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def log_request(message, files_info=None, education_context=None):
    """Log incoming requests for debugging"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n{'='*60}")
    print(f"[{timestamp}] NEW REQUEST")
    print(f"Message: {message}")
    if files_info:
        print(f"Files uploaded: {len(files_info)}")
        for i, file_info in enumerate(files_info):
            print(f"  File {i}: {file_info}")
    if education_context:
        print(f"Education Context:")
        for key, value in education_context.items():
            print(f"  {key}: {value}")
    print(f"{'='*60}\n")

def generate_sample_responses(message, file_count=0, education_context=None):
    """Generate different types of sample responses based on message content and education context"""
    
    # Extract education context for personalized responses
    teacher_lang = education_context.get('teacher_language', 'english') if education_context else 'english'
    student_lang = education_context.get('student_language', 'english') if education_context else 'english'
    class_level = education_context.get('class_level', '6') if education_context else '6'
    class_strength = education_context.get('class_strength', '30') if education_context else '30'
    current_page = education_context.get('current_page', 1) if education_context else 1
    total_pages = education_context.get('total_pages', 1) if education_context else 1
    
    # Enhanced text responses with education context
    text_responses = [
        f"I've analyzed your message: '{message}' for Class {class_level} students ({class_strength} students). Based on page {current_page} of {total_pages} from the {file_count} document(s), here's my educational analysis...",
        f"For your Class {class_level} lesson planning, considering {class_strength} students and your question '{message}': The content on page {current_page} suggests these teaching strategies...",
        f"Educational Insight: Your query '{message}' has been processed for Class {class_level}. From page {current_page} of the uploaded materials, I recommend these classroom activities for {class_strength} students...",
        f"Teaching Recommendation: Based on '{message}' and page {current_page} content, here's how to adapt this for Class {class_level} with {class_strength} students...",
        f"Curriculum Analysis: For Class {class_level} students, your question '{message}' relates to page {current_page}. Here are {class_strength}-student-friendly explanations..."
    ]
    
    # Language-specific responses
    if teacher_lang != 'english' or student_lang != 'english':
        text_responses.extend([
            f"Multi-language Support: I can help explain this concept in {student_lang} for your students while we discuss in {teacher_lang}.",
            f"Language Bridge: Since you teach in {teacher_lang} and students learn in {student_lang}, here's a bilingual approach to '{message}'...",
            f"Cultural Context: Adapting '{message}' for {student_lang}-speaking Class {class_level} students with {teacher_lang} instruction..."
        ])
    
    # Sample educational images
    sample_images = [
        "https://picsum.photos/id/1/200/300",
        "https://picsum.photos/id/2/200/300",
        "https://picsum.photos/id/3/200/300",
        "https://picsum.photos/id/4/200/300",
        "https://picsum.photos/id/5/200/300"
    ]
    
    # Determine response type based on message content
    message_lower = message.lower()
    
    if 'image' in message_lower or 'generate' in message_lower or 'chart' in message_lower or 'visual' in message_lower:
        # Return text + image response
        return {
            "text": random.choice(text_responses),
            "image_url": random.choice(sample_images)
        }
    
    elif 'error' in message_lower or 'fail' in message_lower:
        # Return error response for testing
        return {
            "error": "Simulated error for testing purposes"
        }
    
    elif 'lesson' in message_lower or 'teach' in message_lower or 'classroom' in message_lower:
        # Return education-focused response
        return {
            "text": f"🎓 Lesson Planning Suggestion: For Class {class_level} with {class_strength} students, here's how to teach '{message}' using page {current_page} content. Consider interactive activities, group work, and differentiated instruction based on the material provided."
        }
    
    elif 'language' in message_lower or student_lang != 'english' or teacher_lang != 'english':
        # Return multilingual support response
        return {
            "text": f"🌐 Multilingual Support: I can help bridge the language gap between {teacher_lang} (teacher) and {student_lang} (students) for this Class {class_level} topic. The content on page {current_page} can be adapted for bilingual instruction."
        }
    
    else:
        # Return text-only response
        return {
            "text": random.choice(text_responses)
        }

@app.route('/')
def home():
    """Simple home page to verify server is running"""
    return """
    <h1>🎓 AI Education Assistant Test Backend</h1>
    <p>Backend server is running successfully!</p>
    <h2>Available Endpoints:</h2>
    <ul>
        <li><strong>POST /api/chat</strong> - Main chat endpoint with education context</li>
        <li><strong>GET /api/status</strong> - Server status</li>
        <li><strong>GET /api/test</strong> - Test endpoint</li>
    </ul>
    <h2>Education Features:</h2>
    <ul>
        <li>✅ Multi-language support (Teacher/Student languages)</li>
        <li>✅ Class level and strength tracking</li>
        <li>✅ PDF page context awareness</li>
        <li>✅ Educational content generation</li>
        <li>✅ Lesson planning assistance</li>
    </ul>
    <h2>Test Commands:</h2>
    <ul>
        <li>Type <strong>"image"</strong> or <strong>"generate"</strong> for educational visual aids</li>
        <li>Type <strong>"analysis"</strong> or <strong>"assessment"</strong> for educational checklists</li>
        <li>Type <strong>"lesson"</strong> or <strong>"teach"</strong> for lesson planning help</li>
        <li>Type <strong>"language"</strong> for multilingual support</li>
        <li>Type <strong>"everything"</strong> for all response types</li>
        <li>Type <strong>"error"</strong> to test error handling</li>
    </ul>
    <h2>Backend Receives:</h2>
    <ul>
        <li>📝 User message</li>
        <li>📄 PDF files</li>
        <li>🌍 Teacher & Student languages</li>
        <li>🎯 Class level & strength</li>
        <li>📖 Current PDF page & total pages</li>
    </ul>
    """

@app.route('/api/status')
def status():
    """API status endpoint"""
    return jsonify({
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "endpoints": ["/api/chat", "/api/status", "/api/test"]
    })

@app.route('/api/test')
def test():
    """Test endpoint to verify API is working"""
    return jsonify({
        "message": "Test endpoint working!",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    """Main chat endpoint that handles messages and file uploads"""
    # Handle preflight requests
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
        
    try:
        # Get the message from form data
        message = request.form.get('message', '').strip()
        
        if not message:
            return jsonify({"error": "No message provided"}), 400
        
        # Extract education context from form data
        education_context = {
            'teacher_language': request.form.get('teacher_language', 'english'),
            'student_language': request.form.get('student_language', 'english'),
            'class_level': request.form.get('class_level', '6'),
            'class_strength': request.form.get('class_strength', '30'),
            'current_page': int(request.form.get('current_page', 1)),
            'total_pages': int(request.form.get('total_pages', 1)),
            'current_pdf_index': int(request.form.get('current_pdf_index', 0))
        }
        
        # Process uploaded files
        uploaded_files = []
        files_info = []
        
        for key in request.files:
            if key.startswith('file_'):
                file = request.files[key]
                if file and file.filename:
                    if allowed_file(file.filename):
                        # Secure the filename
                        filename = secure_filename(file.filename)
                        timestamp = int(time.time())
                        unique_filename = f"{timestamp}_{filename}"
                        filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
                        
                        # Check file size
                        file.seek(0, os.SEEK_END)
                        file_size = file.tell()
                        file.seek(0)
                        
                        if file_size > MAX_FILE_SIZE:
                            return jsonify({"error": f"File {filename} is too large. Maximum size is 10MB."}), 400
                        
                        # Save the file
                        file.save(filepath)
                        uploaded_files.append(filepath)
                        files_info.append({
                            "original_name": file.filename,
                            "saved_as": unique_filename,
                            "size": file_size,
                            "path": filepath
                        })
                    else:
                        return jsonify({"error": f"File type not allowed. Only PDF files are supported."}), 400
        
        # Log the request for debugging
        log_request(message, files_info, education_context)
        
        # Simulate processing delay
        processing_delay = random.uniform(0.5, 1.5)
        print(f"Processing request... ({processing_delay:.1f}s)")
        time.sleep(processing_delay)
        
        # Generate response based on message content and education context
        response = generate_sample_responses(message, len(uploaded_files), education_context)
        
        # Ensure proper JSON response with correct headers
        json_response = jsonify(response)
        json_response.headers['Content-Type'] = 'application/json'
        json_response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        json_response.headers['Pragma'] = 'no-cache'
        json_response.headers['Expires'] = '0'
        
        return json_response
        
    except Exception as e:
        error_msg = f"Server error: {str(e)}"
        print(f"ERROR: {error_msg}")
        return jsonify({"error": error_msg}), 500

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files (for testing purposes)"""
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({"error": "File too large. Maximum size is 10MB."}), 413

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(e):
    """Handle 500 errors"""
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🎓 AI EDUCATION ASSISTANT TEST BACKEND STARTING")
    print("="*60)
    print(f"📁 Upload folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"📏 Max file size: {MAX_FILE_SIZE // (1024*1024)}MB")
    print(f"📋 Allowed extensions: {ALLOWED_EXTENSIONS}")
    
    # Clean up any existing PDF files from previous sessions
    print(f"\n🧹 Cleaning up previous session files...")
    cleanup_uploads()
    
    print("🌐 Server will be available at:")
    print("   http://localhost:5000")
    print("   http://127.0.0.1:5000")
    print("\n📡 API Endpoints:")
    print("   POST http://localhost:5000/api/chat")
    print("   GET  http://localhost:5000/api/status")
    print("   GET  http://localhost:5000/api/test")
    print("\n🎯 Education Features:")
    print("   ✅ Multi-language support")
    print("   ✅ Class level & strength tracking")
    print("   ✅ PDF page context awareness")
    print("   ✅ Educational content generation")
    print("   ✅ Automatic file cleanup on server stop")
    print("\n🧪 Test Commands (type these in the frontend):")
    print("   'lesson' or 'teach' → Lesson planning help")
    print("   'language' → Multilingual support")
    print("   'image' or 'generate' → Educational visual aids")
    print("   'analysis' or 'assessment' → Educational checklists")
    print("   'everything' → All response types")
    print("   'error' → Test error handling")
    print("\n📊 Backend receives & processes:")
    print("   📝 User messages + 📄 PDF files")
    print("   🌍 Teacher/Student languages")
    print("   🎯 Class level & strength")
    print("   📖 Current PDF page context")
    print("\n💡 Note: Uploaded PDFs will be automatically deleted when server stops")
    print("\n" + "="*60)
    
    try:
        # Run the Flask development server
        app.run(
            host='0.0.0.0',  # Allow external connections
            port=5000,
            debug=True,      # Enable debug mode
            threaded=True    # Handle multiple requests
        )
    except KeyboardInterrupt:
        print(f"\n\n🛑 Server interrupted by user")
        cleanup_uploads()
        print("👋 Backend server stopped gracefully")
    except Exception as e:
        print(f"\n\n💥 Server error: {str(e)}")
        cleanup_uploads()
        print("👋 Backend server stopped due to error")
