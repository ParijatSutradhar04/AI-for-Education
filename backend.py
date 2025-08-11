#!/usr/bin/env python3
"""
AI Education Assistant Backend
Real backend implementation using OpenAI's ChatGPT API with PDF context
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import time
import atexit
import signal
import sys
import glob
from datetime import datetime
from werkzeug.utils import secure_filename
import openai
from openai import OpenAI
import fitz  # PyMuPDF for PDF processing
import base64
from io import BytesIO
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS for all routes with specific configuration
CORS(app, 
     origins=['http://localhost:5598', 'http://127.0.0.1:5598', 'http://localhost:5599', 'http://127.0.0.1:5599', 'http://localhost:*', 'http://127.0.0.1:*'],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     supports_credentials=False)

# Configuration
UPLOAD_FOLDER = 'uploads'
TEMP_FOLDER = 'temp_images'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Create necessary directories
for folder in [UPLOAD_FOLDER, TEMP_FOLDER]:
    os.makedirs(folder, exist_ok=True)

# OpenAI Configuration
# You need to set your OpenAI API key as an environment variable
# Set OPENAI_API_KEY in your environment or replace with your key
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if not OPENAI_API_KEY:
    logger.warning("⚠️  OPENAI_API_KEY not found in environment variables!")
    logger.warning("Please set your OpenAI API key:")
    logger.warning("Windows: set OPENAI_API_KEY=your_api_key_here")
    logger.warning("Linux/Mac: export OPENAI_API_KEY=your_api_key_here")

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

def cleanup_files():
    """Delete all files from uploads and temp directories"""
    try:
        folders_to_clean = [UPLOAD_FOLDER, TEMP_FOLDER]
        total_deleted = 0
        
        print(f"\n{'='*60}")
        print("🧹 CLEANING UP FILES")
        print(f"{'='*60}")
        
        for folder in folders_to_clean:
            if os.path.exists(folder):
                files = glob.glob(os.path.join(folder, "*"))
                if files:
                    print(f"📁 Cleaning {folder}/ ({len(files)} files)")
                    for file_path in files:
                        try:
                            os.remove(file_path)
                            filename = os.path.basename(file_path)
                            print(f"   ✅ Deleted: {filename}")
                            total_deleted += 1
                        except Exception as e:
                            filename = os.path.basename(file_path)
                            print(f"   ❌ Failed to delete {filename}: {str(e)}")
                else:
                    print(f"📁 {folder}/ is already empty")
        
        print(f"\n🗑️  Successfully deleted {total_deleted} file(s)")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {str(e)}")

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    print(f"\n\n🛑 Received shutdown signal ({signum})")
    cleanup_files()
    print("👋 AI Education Assistant Backend stopped gracefully")
    sys.exit(0)

# Register cleanup function to run when the program exits
atexit.register(cleanup_files)

# Register signal handlers for graceful shutdown
signal.signal(signal.SIGINT, signal_handler)   # Ctrl+C
signal.signal(signal.SIGTERM, signal_handler)  # Termination signal

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def pdf_page_to_image(pdf_path, page_num, dpi=150):
    """Convert a specific PDF page to image"""
    try:
        doc = fitz.open(pdf_path)
        if page_num < 0 or page_num >= len(doc):
            page_num = 0  # Default to first page if invalid
        
        page = doc[page_num]
        # Convert to image with specified DPI
        mat = fitz.Matrix(dpi/72, dpi/72)  # 72 is default DPI
        pix = page.get_pixmap(matrix=mat)
        
        # Convert to PIL Image
        img_data = pix.tobytes("png")
        img = Image.open(BytesIO(img_data))
        
        doc.close()
        return img
    except Exception as e:
        logger.error(f"Error converting PDF page to image: {str(e)}")
        return None

def create_context_pdf(pdf_path, current_page, context_pages=2):
    """Create a smaller PDF with current page and surrounding pages"""
    try:
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        
        # Calculate page range (current page ± context_pages)
        start_page = max(0, current_page - context_pages)
        end_page = min(total_pages - 1, current_page + context_pages)
        
        # Create new PDF with selected pages
        new_doc = fitz.open()
        for page_num in range(start_page, end_page + 1):
            new_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)
        
        # Save to temp file
        timestamp = int(time.time())
        temp_pdf_path = os.path.join(TEMP_FOLDER, f"context_{timestamp}.pdf")
        new_doc.save(temp_pdf_path)
        
        new_doc.close()
        doc.close()
        
        return temp_pdf_path, start_page, end_page
    except Exception as e:
        logger.error(f"Error creating context PDF: {str(e)}")
        return None, None, None

def image_to_base64(image):
    """Convert PIL Image to base64 string"""
    try:
        buffer = BytesIO()
        image.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return img_base64
    except Exception as e:
        logger.error(f"Error converting image to base64: {str(e)}")
        return None

def build_education_prompt(message, education_context, file_context=None):
    """Build a comprehensive prompt for the AI with education context"""
    
    teacher_lang = education_context.get('teacher_language', 'english')
    student_lang = education_context.get('student_language', 'english')
    class_level = education_context.get('class_level', '6')
    class_strength = education_context.get('class_strength', '30')
    current_page = education_context.get('current_page', 1)
    total_pages = education_context.get('total_pages', 1)
    
    # Base system prompt
    system_prompt = f"""You are an AI Education Assistant helping a teacher plan lessons and create educational content.

EDUCATION CONTEXT:
- Teacher's Language: {teacher_lang.title()}
- Student's Language: {student_lang.title()}
- Class Level: Class {class_level}
- Number of Students: {class_strength}

GUIDELINES:
1. Provide practical, classroom-ready advice
2. Consider the class size ({class_strength} students) in your suggestions
3. Adapt content for Class {class_level} comprehension level
4. If teacher and student languages differ, provide bilingual support strategies
5. Focus on interactive and engaging teaching methods
6. Provide specific examples and activities
7. Consider diverse learning styles and abilities

RESPONSE FORMAT:
- Use clear, actionable language
- Include specific classroom activities when relevant
- Suggest assessment methods
- Provide differentiation strategies for diverse learners
- Keep responses concise but comprehensive
"""

    # Add file context if available
    if file_context:
        file_info = file_context.get('info', {})
        if file_info:
            system_prompt += f"""
PDF CONTEXT:
- Currently viewing page {current_page} of {total_pages}
- Document: {file_info.get('original_name', 'Unknown')}
- The attached image shows the current page content

Please reference the PDF content in your response and explain how to use this material effectively in a Class {class_level} classroom with {class_strength} students.
"""

    # User message with context
    user_prompt = f"""Teacher's Question: {message}

Please provide educational guidance considering:
- Class {class_level} students ({class_strength} in class)
- Teacher instruction in {teacher_lang.title()}
- Students learning in {student_lang.title()}
"""

    if file_context:
        user_prompt += f"\n- Based on page {current_page} of the uploaded document"

    return system_prompt, user_prompt

async def call_openai_api(messages, image_base64=None):
    """Make API call to OpenAI with optional image context"""
    try:
        if not client:
            return {"error": "OpenAI API key not configured"}
        
        # Prepare messages for API
        api_messages = []
        
        # Add system message
        api_messages.append({
            "role": "system",
            "content": messages['system']
        })
        
        # Add user message with optional image
        if image_base64:
            api_messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": messages['user']},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_base64}",
                            "detail": "high"
                        }
                    }
                ]
            })
        else:
            api_messages.append({
                "role": "user",
                "content": messages['user']
            })
        
        # Make API call
        response = client.chat.completions.create(
            model="gpt-4o",  # Use GPT-4 with vision capabilities
            messages=api_messages,
            max_tokens=1500,
            temperature=0.7
        )
        
        return {
            "text": response.choices[0].message.content
        }
        
    except Exception as e:
        logger.error(f"OpenAI API error: {str(e)}")
        return {"error": f"AI service error: {str(e)}"}

def log_request(message, files_info=None, education_context=None):
    """Log incoming requests for debugging"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    logger.info(f"\n{'='*60}")
    logger.info(f"[{timestamp}] NEW AI REQUEST")
    logger.info(f"Message: {message}")
    if files_info:
        logger.info(f"Files uploaded: {len(files_info)}")
        for i, file_info in enumerate(files_info):
            logger.info(f"  File {i}: {file_info}")
    if education_context:
        logger.info(f"Education Context:")
        for key, value in education_context.items():
            logger.info(f"  {key}: {value}")
    logger.info(f"{'='*60}\n")

@app.route('/')
def home():
    """Simple home page to verify server is running"""
    api_status = "✅ Connected" if OPENAI_API_KEY else "❌ Not Configured"
    
    return f"""
    <h1>🎓 AI Education Assistant Backend</h1>
    <p>Real backend server with ChatGPT API integration!</p>
    <h2>API Status: {api_status}</h2>
    
    <h2>Available Endpoints:</h2>
    <ul>
        <li><strong>POST /api/chat</strong> - Main chat endpoint with AI responses</li>
        <li><strong>GET /api/status</strong> - Server status</li>
        <li><strong>GET /api/test</strong> - Test endpoint</li>
    </ul>
    
    <h2>AI Features:</h2>
    <ul>
        <li>✅ OpenAI GPT-4 with vision capabilities</li>
        <li>✅ PDF page context processing</li>
        <li>✅ Educational content generation</li>
        <li>✅ Multi-language teaching support</li>
        <li>✅ Class-specific lesson planning</li>
        <li>✅ Interactive activity suggestions</li>
    </ul>
    
    <h2>Setup Instructions:</h2>
    <ol>
        <li>Get your OpenAI API key from <a href="https://platform.openai.com/api-keys">platform.openai.com</a></li>
        <li>Set environment variable: <code>set OPENAI_API_KEY=your_key_here</code></li>
        <li>Install required packages: <code>pip install openai PyMuPDF Pillow</code></li>
        <li>Restart this server</li>
    </ol>
    
    <h2>How It Works:</h2>
    <ul>
        <li>📝 Receives teacher questions with education context</li>
        <li>📄 Processes PDF files and extracts current page as image</li>
        <li>🤖 Sends context + image to GPT-4 for educational analysis</li>
        <li>🎯 Returns classroom-ready teaching suggestions</li>
    </ul>
    """

@app.route('/api/status')
def status():
    """API status endpoint"""
    return jsonify({
        "status": "running",
        "ai_configured": bool(OPENAI_API_KEY),
        "timestamp": datetime.now().isoformat(),
        "endpoints": ["/api/chat", "/api/status", "/api/test"]
    })

@app.route('/api/test')
def test():
    """Test endpoint to verify API is working"""
    return jsonify({
        "message": "AI Education Assistant Backend is running!",
        "ai_status": "configured" if OPENAI_API_KEY else "not_configured",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    """Main chat endpoint that handles messages and generates AI responses"""
    # Handle preflight requests
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
        
    try:
        # Check if OpenAI is configured
        if not OPENAI_API_KEY:
            return jsonify({
                "error": "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
            }), 500
        
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
        current_pdf_path = None
        
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
                        file_info = {
                            "original_name": file.filename,
                            "saved_as": unique_filename,
                            "size": file_size,
                            "path": filepath
                        }
                        files_info.append(file_info)
                        
                        # Set current PDF for context (use current_pdf_index if multiple files)
                        if len(uploaded_files) - 1 == education_context['current_pdf_index']:
                            current_pdf_path = filepath
                    else:
                        return jsonify({"error": f"File type not allowed. Only PDF files are supported."}), 400
        
        # Log the request for debugging
        log_request(message, files_info, education_context)
        
        # Process PDF context if available
        file_context = None
        image_base64 = None
        
        if current_pdf_path and os.path.exists(current_pdf_path):
            try:
                # Convert current page to image
                current_page_index = education_context['current_page'] - 1  # Convert to 0-based index
                page_image = pdf_page_to_image(current_pdf_path, current_page_index)
                
                if page_image:
                    image_base64 = image_to_base64(page_image)
                    file_context = {
                        'info': files_info[education_context['current_pdf_index']] if files_info else {},
                        'page': education_context['current_page'],
                        'total_pages': education_context['total_pages']
                    }
                    logger.info(f"✅ Extracted page {education_context['current_page']} as image for AI context")
                else:
                    logger.warning(f"⚠️  Failed to extract page {education_context['current_page']} as image")
                    
            except Exception as e:
                logger.error(f"Error processing PDF context: {str(e)}")
        
        # Build prompt with education context
        system_prompt, user_prompt = build_education_prompt(message, education_context, file_context)
        
        # Prepare messages for AI
        messages = {
            'system': system_prompt,
            'user': user_prompt
        }
        
        logger.info("🤖 Sending request to OpenAI API...")
        
        # Call OpenAI API
        import asyncio
        response = asyncio.run(call_openai_api(messages, image_base64))
        
        if 'error' in response:
            logger.error(f"AI API Error: {response['error']}")
            return jsonify(response), 500
        
        logger.info("✅ Received response from OpenAI API")
        
        # Ensure proper JSON response with correct headers
        json_response = jsonify(response)
        json_response.headers['Content-Type'] = 'application/json'
        json_response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        json_response.headers['Pragma'] = 'no-cache'
        json_response.headers['Expires'] = '0'
        
        return json_response
        
    except Exception as e:
        error_msg = f"Server error: {str(e)}"
        logger.error(f"ERROR: {error_msg}")
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
    print("🎓 AI EDUCATION ASSISTANT BACKEND STARTING")
    print("="*60)
    print(f"📁 Upload folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"📁 Temp folder: {os.path.abspath(TEMP_FOLDER)}")
    print(f"📏 Max file size: {MAX_FILE_SIZE // (1024*1024)}MB")
    print(f"📋 Allowed extensions: {ALLOWED_EXTENSIONS}")
    
    # Check OpenAI configuration
    if OPENAI_API_KEY:
        print(f"🤖 OpenAI API: ✅ Configured")
        print(f"🧠 Model: GPT-4 with vision capabilities")
    else:
        print(f"🤖 OpenAI API: ❌ NOT CONFIGURED")
        print(f"⚠️  Please set OPENAI_API_KEY environment variable!")
        print(f"💡 Get your API key from: https://platform.openai.com/api-keys")
        print(f"🔧 Set it with: set OPENAI_API_KEY=your_key_here")
    
    # Clean up any existing files from previous sessions
    print(f"\n🧹 Cleaning up previous session files...")
    cleanup_files()
    
    print("🌐 Server will be available at:")
    print("   http://localhost:5000")
    print("   http://127.0.0.1:5000")
    print("\n📡 API Endpoints:")
    print("   POST http://localhost:5000/api/chat")
    print("   GET  http://localhost:5000/api/status")
    print("   GET  http://localhost:5000/api/test")
    print("\n🎯 AI Features:")
    print("   ✅ Real ChatGPT integration")
    print("   ✅ PDF page image extraction")
    print("   ✅ Educational context processing")
    print("   ✅ Multi-language teaching support")
    print("   ✅ Class-specific responses")
    print("   ✅ Automatic file cleanup")
    print("\n📊 Backend processes:")
    print("   📝 Teacher questions + education context")
    print("   📄 PDF files → current page images")
    print("   🤖 AI analysis with visual context")
    print("   🎯 Classroom-ready teaching suggestions")
    print("\n💡 Required packages:")
    print("   pip install openai PyMuPDF Pillow")
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
        cleanup_files()
        print("👋 AI Education Assistant Backend stopped gracefully")
    except Exception as e:
        print(f"\n\n💥 Server error: {str(e)}")
        cleanup_files()
        print("👋 Backend stopped due to error")
