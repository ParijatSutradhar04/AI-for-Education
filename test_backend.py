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
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def log_request(message, files_info=None):
    """Log incoming requests for debugging"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n{'='*60}")
    print(f"[{timestamp}] NEW REQUEST")
    print(f"Message: {message}")
    if files_info:
        print(f"Files uploaded: {len(files_info)}")
        for i, file_info in enumerate(files_info):
            print(f"  File {i}: {file_info}")
    print(f"{'='*60}\n")

def generate_sample_responses(message, file_count=0):
    """Generate different types of sample responses based on message content"""
    
    # Sample text responses
    text_responses = [
        f"I've analyzed your message: '{message}'. Based on the {file_count} document(s) you uploaded, here's my analysis...",
        f"Thank you for your question about '{message}'. From the uploaded PDFs, I can provide the following insights...",
        f"Your query '{message}' has been processed. The documents contain relevant information that I've summarized below...",
        f"Based on your request '{message}' and the {file_count} file(s) provided, here are the key findings..."
    ]
    
    # Image URLs for testing (using placeholder images)
    sample_images = [
        "https://via.placeholder.com/400x300/667eea/ffffff?text=Generated+Chart",
        "https://via.placeholder.com/400x300/28a745/ffffff?text=Analysis+Result",
        "https://via.placeholder.com/400x300/dc3545/ffffff?text=Data+Visualization",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/300px-Cat03.jpg"
    ]
    
    # Sample checklists
    sample_checklists = [
        {
            'Document structure is valid': True,
            'Contains required sections': True,
            'Grammar and spelling check': random.choice([True, False]),
            'Citations are properly formatted': True,
            'Images have proper captions': random.choice([True, False]),
            'Bibliography is complete': True,
            'Page numbering is correct': True,
            'Font consistency maintained': random.choice([True, False])
        },
        {
            'PDF is readable': True,
            'Text extraction successful': True,
            'Contains tables': random.choice([True, False]),
            'Has embedded images': random.choice([True, False]),
            'Multiple pages detected': True,
            'Metadata available': random.choice([True, False])
        },
        {
            'Security analysis passed': True,
            'No malicious content found': True,
            'File integrity verified': True,
            'Encoding is supported': True,
            'File size acceptable': True,
            'Format compliance check': random.choice([True, False])
        }
    ]
    
    # Determine response type based on message content
    message_lower = message.lower()
    
    if 'image' in message_lower or 'generate' in message_lower or 'chart' in message_lower:
        # Return text + image response
        return {
            "text": random.choice(text_responses),
            "image_url": random.choice(sample_images)
        }
    
    elif 'analysis' in message_lower or 'check' in message_lower or 'validate' in message_lower:
        # Return text + checklist response
        return {
            "text": random.choice(text_responses),
            "checklist": random.choice(sample_checklists)
        }
    
    elif 'everything' in message_lower or 'all' in message_lower or 'complete' in message_lower:
        # Return all response types
        return {
            "text": random.choice(text_responses),
            "image_url": random.choice(sample_images),
            "checklist": random.choice(sample_checklists)
        }
    
    elif 'error' in message_lower or 'fail' in message_lower:
        # Return error response for testing
        return {
            "error": "Simulated error for testing purposes"
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
    <h1>AI Chatbot Test Backend</h1>
    <p>Backend server is running successfully!</p>
    <h2>Available Endpoints:</h2>
    <ul>
        <li><strong>POST /api/chat</strong> - Main chat endpoint</li>
        <li><strong>GET /api/status</strong> - Server status</li>
        <li><strong>GET /api/test</strong> - Test endpoint</li>
    </ul>
    <h2>Test Commands:</h2>
    <ul>
        <li>Type "image" or "generate" for image responses</li>
        <li>Type "analysis" or "check" for checklist responses</li>
        <li>Type "everything" for all response types</li>
        <li>Type "error" to test error handling</li>
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

@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint that handles messages and file uploads"""
    try:
        # Get the message from form data
        message = request.form.get('message', '').strip()
        
        if not message:
            return jsonify({"error": "No message provided"}), 400
        
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
        log_request(message, files_info)
        
        # Simulate processing delay
        processing_delay = random.uniform(1, 3)  # 1-3 seconds
        print(f"Simulating processing... ({processing_delay:.1f}s)")
        time.sleep(processing_delay)
        
        # Generate response based on message content
        response = generate_sample_responses(message, len(uploaded_files))
        
        # Log the response
        print(f"Generated response: {json.dumps(response, indent=2)}")
        
        return jsonify(response)
        
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
    print("🚀 AI CHATBOT TEST BACKEND STARTING")
    print("="*60)
    print(f"📁 Upload folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"📏 Max file size: {MAX_FILE_SIZE // (1024*1024)}MB")
    print(f"📋 Allowed extensions: {ALLOWED_EXTENSIONS}")
    print("\n🌐 Server will be available at:")
    print("   http://localhost:5000")
    print("   http://127.0.0.1:5000")
    print("\n📡 API Endpoints:")
    print("   POST http://localhost:5000/api/chat")
    print("   GET  http://localhost:5000/api/status")
    print("   GET  http://localhost:5000/api/test")
    print("\n🧪 Test Commands (type these in the frontend):")
    print("   'image' or 'generate' → Image response")
    print("   'analysis' or 'check' → Checklist response")
    print("   'everything' → All response types")
    print("   'error' → Test error handling")
    print("\n" + "="*60)
    
    # Run the Flask development server
    app.run(
        host='0.0.0.0',  # Allow external connections
        port=5000,
        debug=True,      # Enable debug mode
        threaded=True    # Handle multiple requests
    )
