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

def generate_structured_responses(message, file_count=0, education_context=None):
    """Generate structured JSON responses for the new frontend format"""
    
    # Extract education context for personalized responses
    teacher_lang = education_context.get('teacher_language', 'english') if education_context else 'english'
    student_lang = education_context.get('student_language', 'english') if education_context else 'english'
    class_level = education_context.get('class_level', '6') if education_context else '6'
    class_strength = education_context.get('class_strength', '30') if education_context else '30'
    current_page = education_context.get('current_page', 1) if education_context else 1
    total_pages = education_context.get('total_pages', 1) if education_context else 1
    
    # Sample educational images
    sample_images = [
        "https://picsum.photos/id/1/300/200",
        "https://picsum.photos/id/2/300/200", 
        "https://picsum.photos/id/3/300/200",
        "https://picsum.photos/id/4/300/200",
        "https://picsum.photos/id/5/300/200"
    ]
    
    # Determine response type based on message content
    message_lower = message.lower()
    
    if 'error' in message_lower or 'fail' in message_lower:
        # Return error response for testing
        return {
            "error": "Simulated error for testing purposes"
        }
    
    elif 'lesson' in message_lower or 'teach' in message_lower or 'classroom' in message_lower:
        # Return lesson planning structured response
        return {
            "structured_content": [
                {
                    "heading": "📚 Lesson Overview",
                    "text": f"This lesson is designed for Class {class_level} students ({class_strength} total) based on your query: '{message}'. The content draws from page {current_page} of {total_pages} from the uploaded materials.",
                    "id": "lesson_overview"
                },
                {
                    "heading": "🎯 Learning Objectives",
                    "text": f"By the end of this lesson, students will be able to understand the key concepts presented and apply them in practical scenarios. The objectives are tailored for {class_strength} students working collaboratively.",
                    "id": "learning_objectives"
                },
                {
                    "heading": "📖 Content Breakdown",
                    "text": f"The main content from page {current_page} has been analyzed and broken down into digestible segments suitable for Class {class_level} comprehension level.",
                    "id": "content_breakdown"
                },
                {
                    "heading": "🎓 Teaching Strategies", 
                    "text": f"Interactive activities and group work recommendations for {class_strength} students, including differentiated instruction techniques and assessment methods.",
                    "id": "teaching_strategies"
                },
                {
                    "heading": "💡 Additional Resources",
                    "text": "Supplementary materials and follow-up activities to reinforce learning and provide extended practice opportunities.",
                    "id": "additional_resources"
                }
            ]
        }
    
    elif 'language' in message_lower or student_lang != 'english' or teacher_lang != 'english':
        # Return multilingual support structured response
        return {
            "structured_content": [
                {
                    "heading": "🌐 Language Bridge",
                    "text": f"Bridging communication between {teacher_lang} (teacher) and {student_lang} (student) for Class {class_level} topics.",
                    "id": "language_bridge"
                },
                {
                    "heading": "📝 Key Vocabulary",
                    "text": f"Essential terms and concepts translated and explained in both {teacher_lang} and {student_lang} for better comprehension.",
                    "id": "key_vocabulary"
                },
                {
                    "heading": "🗣️ Cultural Context",
                    "text": f"Adapting the content for {student_lang}-speaking students while maintaining educational effectiveness.",
                    "id": "cultural_context"
                },
                {
                    "heading": "💬 Communication Tips",
                    "text": f"Strategies for effective multilingual instruction with {class_strength} diverse learners.",
                    "id": "communication_tips"
                }
            ]
        }
    
    elif 'image' in message_lower or 'generate' in message_lower or 'chart' in message_lower or 'visual' in message_lower:
        # Return structured response with visual aid
        return {
            "structured_content": [
                {
                    "heading": "🎨 Visual Learning Aid",
                    "text": f"A visual representation has been generated to support your teaching of '{message}' for Class {class_level} students.",
                    "id": "visual_aid"
                },
                {
                    "heading": "📊 Content Analysis",
                    "text": f"Analysis of the visual elements and how they relate to the learning objectives for {class_strength} students.",
                    "id": "content_analysis"
                },
                {
                    "heading": "🔍 Usage Guidelines",
                    "text": f"Best practices for incorporating this visual aid into your Class {class_level} lesson plan.",
                    "id": "usage_guidelines"
                }
            ],
            "image_url": random.choice(sample_images)
        }
    
    else:
        # Return general educational analysis structured response
        return {
            "structured_content": [
                {
                    "heading": "🔍 Educational Analysis",
                    "text": f"Analysis of your message '{message}' for Class {class_level} students ({class_strength} total). Based on page {current_page} of {total_pages} from uploaded documents.",
                    "id": "educational_analysis"
                },
                {
                    "heading": "📚 Content Summary", 
                    "text": f"Key points extracted from page {current_page} that are relevant to your query and suitable for Class {class_level} comprehension level.",
                    "id": "content_summary"
                },
                {
                    "heading": "🎯 Recommended Activities",
                    "text": f"Suggested classroom activities for {class_strength} students to reinforce the concepts and promote active learning.",
                    "id": "recommended_activities"
                },
                {
                    "heading": "📋 Assessment Ideas",
                    "text": f"Evaluation strategies and assessment methods appropriate for Class {class_level} students to measure understanding.",
                    "id": "assessment_ideas"
                },
                {
                    "heading": "🌟 Enhancement Opportunities",
                    "text": f"Ways to extend and enrich the learning experience beyond the basic curriculum requirements.",
                    "id": "enhancement_opportunities"
                }
            ]
        }

# Keep the old function for backward compatibility during transition
def generate_sample_responses(message, file_count=0, education_context=None):
    """Legacy function - redirects to new structured response format"""
    return generate_structured_responses(message, file_count, education_context)

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
        response = generate_structured_responses(message, len(uploaded_files), education_context)
        
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

@app.route('/api/chat/follow-up', methods=['POST', 'OPTIONS'])
def chat_follow_up():
    """Endpoint for handling follow-up questions on specific content boxes"""
    # Handle preflight requests
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    try:
        # Get JSON data for follow-up requests
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        message = data.get('message', '').strip()
        box_id = data.get('box_id', '')
        box_heading = data.get('box_heading', '')
        box_text = data.get('box_text', '')
        
        if not message or not box_id:
            return jsonify({"error": "Message and box_id are required"}), 400
        
        # Extract education context
        education_context = data.get('education_context', {})
        
        # Log the follow-up request
        print(f"\n{'='*50}")
        print(f"FOLLOW-UP REQUEST")
        print(f"{'='*50}")
        print(f"Original Box ID: {box_id}")
        print(f"Original Heading: {box_heading}")
        print(f"New Question: {message}")
        print(f"{'='*50}\n")
        
        # Simulate processing delay
        processing_delay = random.uniform(0.3, 1.0)
        print(f"Processing follow-up request... ({processing_delay:.1f}s)")
        time.sleep(processing_delay)
        
        # Generate contextual response based on the original box content
        new_text = generate_follow_up_response(message, box_id, box_heading, box_text, education_context)
        
        # Return just the updated text for the specific box
        response = {
            "updated_text": new_text,
            "box_id": box_id
        }
        
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

def generate_follow_up_response(message, box_id, box_heading, box_text, education_context):
    """Generate follow-up response for a specific content box"""
    
    class_level = education_context.get('class_level', '6')
    class_strength = education_context.get('class_strength', '30')
    
    # Generate contextual response based on the box and question
    follow_up_responses = {
        "lesson_overview": [
            f"Building on the lesson overview, here's a deeper dive into '{message}' for your Class {class_level} students: This expands the foundational concepts with more specific examples and practical applications.",
            f"Regarding '{message}' in the lesson overview context: For {class_strength} students, consider breaking this down into smaller, manageable segments with interactive checkpoints.",
            f"Your follow-up question '{message}' about the lesson overview suggests we should focus on differentiated approaches for your Class {class_level} students."
        ],
        "learning_objectives": [
            f"Expanding on the learning objectives with your question '{message}': We can create more specific, measurable outcomes for Class {class_level} students.",
            f"Based on your follow-up '{message}', here are additional learning objectives tailored for {class_strength} students working in collaborative groups.",
            f"Your question '{message}' about learning objectives helps us refine the expected outcomes and assessment criteria for this lesson."
        ],
        "content_breakdown": [
            f"Diving deeper into the content with your question '{message}': Here's a more detailed analysis suitable for Class {class_level} comprehension level.",
            f"Your follow-up '{message}' about content breakdown allows us to explore specific aspects with enhanced clarity for {class_strength} students.",
            f"Building on the content breakdown, '{message}' opens up opportunities for extended learning and deeper exploration."
        ],
        "teaching_strategies": [
            f"Regarding teaching strategies and your question '{message}': Here are additional methods specifically designed for {class_strength} Class {class_level} students.",
            f"Your follow-up '{message}' about teaching strategies suggests we should explore more interactive and engaging approaches.",
            f"Building on teaching strategies with '{message}': Consider incorporating technology and collaborative learning techniques."
        ],
        "additional_resources": [
            f"Expanding additional resources based on your question '{message}': Here are supplementary materials that directly address your specific needs.",
            f"Your follow-up '{message}' about resources helps identify the most relevant and useful materials for Class {class_level}.",
            f"Regarding '{message}' and additional resources: These enhanced materials will provide better support for diverse learning styles."
        ]
    }
    
    # Default responses for other box types
    default_responses = [
        f"Thank you for your follow-up question '{message}' about {box_heading}. Here's additional insight tailored for your Class {class_level} students with {class_strength} total enrollment.",
        f"Building on {box_heading}, your question '{message}' allows us to explore this topic more thoroughly with specific applications for your classroom.",
        f"Your follow-up '{message}' regarding {box_heading} opens up new possibilities for enhanced learning experiences with your {class_strength} students."
    ]
    
    # Select appropriate response based on box_id
    if box_id in follow_up_responses:
        return random.choice(follow_up_responses[box_id])
    else:
        return random.choice(default_responses)

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
