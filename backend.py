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
from dotenv import load_dotenv
import markdown
import re
import requests
import uuid
from urllib.parse import urlparse
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

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
# Load API key from .env file or environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if not OPENAI_API_KEY or OPENAI_API_KEY == 'your_openai_api_key_here':
    logger.warning("⚠️  OPENAI_API_KEY not configured!")
    logger.warning("Please add your OpenAI API key to the .env file:")
    logger.warning("1. Open the .env file in this directory")
    logger.warning("2. Replace 'your_openai_api_key_here' with your actual API key")
    logger.warning("3. Get your API key from: https://platform.openai.com/api-keys")
    logger.warning("4. Restart the server after updating the .env file")

# Initialize OpenAI client
client = None
if OPENAI_API_KEY and OPENAI_API_KEY != 'your_openai_api_key_here':
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("✅ OpenAI client initialized successfully")
    except Exception as e:
        logger.error(f"❌ Error initializing OpenAI client: {str(e)}")
        client = None
else:
    logger.warning("⚠️  OpenAI client not initialized - API key not configured")

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
    """Convert a specific PDF page to high-quality image preserving all content"""
    try:
        doc = fitz.open(pdf_path)
        if page_num < 0 or page_num >= len(doc):
            page_num = 0  # Default to first page if invalid
        
        page = doc[page_num]
        # Convert to image with specified DPI for good quality
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

def image_to_base64(image):
    """Convert PIL Image to base64 string for OpenAI API"""
    try:
        buffer = BytesIO()
        image.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return img_base64
    except Exception as e:
        logger.error(f"Error converting image to base64: {str(e)}")
        return None

def create_context_pdf(pdf_path, current_page, context_pages=2):
    """Create a smaller PDF with current page and surrounding pages (kept for potential future use)"""
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

def build_education_prompt(message, education_context, file_context=None):
    """Build a comprehensive prompt for the AI with education context"""
    
    teacher_lang = education_context.get('teacher_language', 'english')
    student_lang = education_context.get('student_language', 'english')
    class_level = education_context.get('class_level', '6')
    class_strength = education_context.get('class_strength', '30')
    current_page = education_context.get('current_page', 1)
    total_pages = education_context.get('total_pages', 1)
    
    # Base system prompt
    system_prompt = f"""You are an AI Education Assistant helping a teacher plan lessons and create educational content for students who are mostly from under developed villages, in India, with limited access to resources, and lower socio-economic backgrounds.

EDUCATION CONTEXT:
- Teacher's Language: {teacher_lang.title()}
- Student's Language: {student_lang.title()}
- Class Level: Class {class_level}
- Number of Students: {class_strength}

GUIDELINES:
1. Provide practical, classroom-ready advice
2. Consider the class size ({class_strength} students) in your suggestions
3. Adapt content for Class {class_level} comprehension level
4. If teacher and student languages differ, provide bilingual support strategies, including key vocabulary and phrases in Student's Language
5. Focus on interactive and engaging teaching methods
6. Provide specific examples and activities pertaining to the lesson topic and the background of students
7. Consider diverse learning styles and abilities, pertaining to the environment of the students.

RESPONSE FORMAT:
- Use clear, actionable language
- Include specific classroom activities when relevant
- Suggest assessment methods
- Provide differentiation strategies for diverse learners
- Keep responses concise but comprehensive
- Main focus should be on aligning with the students' backgrounds and needs
"""

    # Add file context if available
    if file_context:
        file_info = file_context.get('info', {})
        if file_info:
            system_prompt += f"""
PDF CONTEXT:
- Currently viewing page {current_page} of {total_pages}
- Document: {file_info.get('original_name', 'Unknown')}
- The attached image shows the complete content of the current page (including text, images, diagrams, and formatting)

Please reference the PDF page content shown in the image and explain how to use this material effectively in a Class {class_level} classroom with {class_strength} students. Consider all visual elements, text, images, and layout when providing your response.
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
                            "detail": "high"  # High detail to capture all content including text and images
                        }
                    }
                ]
            })
        else:
            api_messages.append({
                "role": "user",
                "content": messages['user']
            })
        
        # Make API call with vision model for image processing
        response = client.chat.completions.create(
            model="gpt-4.1-mini",  # GPT-4 with vision capabilities for image analysis
            messages=api_messages,
            max_tokens=1500,
            temperature=0.7
        )
        
        return {
            "text": response.choices[0].message.content,
            "html": markdown.markdown(response.choices[0].message.content, extensions=['nl2br', 'codehilite'])
        }
        
    except Exception as e:
        logger.error(f"OpenAI API error: {str(e)}")
        return {"error": f"AI service error: {str(e)}"}

def detect_image_generation_request(message):
    """Detect if the user is requesting image generation"""
    image_keywords = [
        r"generate\s+an?\s+image",
        r"create\s+an?\s+image", 
        r"draw\s+an?\s+image",
        r"make\s+an?\s+image",
        r"show\s+me\s+an?\s+image",
        r"generate\s+a\s+picture",
        r"create\s+a\s+picture",
        r"draw\s+a\s+picture",
        r"make\s+a\s+picture",
        r"illustrate",
        r"visualize",
        r"sketch"
    ]
    
    message_lower = message.lower()
    
    for pattern in image_keywords:
        if re.search(pattern, message_lower):
            return True
    return False

def extract_image_description(message):
    """Extract the description of what image to generate"""
    # Remove common prefixes to get the core description
    prefixes_to_remove = [
        r"generate\s+an?\s+image\s+(of|about|showing|depicting)?\s*",
        r"create\s+an?\s+image\s+(of|about|showing|depicting)?\s*",
        r"draw\s+an?\s+image\s+(of|about|showing|depicting)?\s*",
        r"make\s+an?\s+image\s+(of|about|showing|depicting)?\s*",
        r"show\s+me\s+an?\s+image\s+(of|about|showing|depicting)?\s*",
        r"generate\s+a\s+picture\s+(of|about|showing|depicting)?\s*",
        r"create\s+a\s+picture\s+(of|about|showing|depicting)?\s*",
        r"draw\s+a\s+picture\s+(of|about|showing|depicting)?\s*",
        r"make\s+a\s+picture\s+(of|about|showing|depicting)?\s*",
        r"illustrate\s+",
        r"visualize\s+",
        r"sketch\s+"
    ]
    
    description = message
    for prefix in prefixes_to_remove:
        description = re.sub(prefix, "", description, flags=re.IGNORECASE)
    
    return description.strip()

async def download_and_save_image(image_url, description):
    """Download image from DALL-E URL and save it locally"""
    try:
        # Create unique filename
        image_id = str(uuid.uuid4())[:8]
        safe_description = re.sub(r'[^a-zA-Z0-9_-]', '_', description[:30])
        filename = f"dalle_{image_id}_{safe_description}.png"
        filepath = os.path.join(TEMP_FOLDER, filename)
        
        logger.info(f"📥 Downloading image from: {image_url}")
        logger.info(f"💾 Saving as: {filepath}")
        
        # Download the image
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()
        
        # Save the image
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        # Create local URL
        local_url = f"/temp_images/{filename}"
        logger.info(f"✅ Image saved locally: {local_url}")
        
        return {
            "local_url": local_url,
            "filename": filename,
            "filepath": filepath
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to download image: {str(e)}")
        return None

async def generate_image_with_dalle(description, education_context):
    """Generate an image using OpenAI's DALL-E API and save it locally"""
    try:
        if not client:
            return {"error": "OpenAI API key not configured"}
        
        class_level = education_context.get('class_level', '6')
        
        # Enhance the prompt for educational content
        enhanced_prompt = f"Educational illustration for Class {class_level} students: {description}. Make it colorful, clear, and age-appropriate for learning."
        
        # Limit prompt length (DALL-E has a 1000 character limit)
        if len(enhanced_prompt) > 900:
            enhanced_prompt = enhanced_prompt[:900] + "..."
        
        logger.info(f"🎨 Generating image with DALL-E: {enhanced_prompt}")
        
        response = client.images.generate(
            model="dall-e-3",
            prompt=enhanced_prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        
        image_url = response.data[0].url
        logger.info(f"✅ Image generated successfully: {image_url}")
        
        # Download and save the image locally
        local_image_info = await download_and_save_image(image_url, description)
        
        result = {
            "image_url": image_url,  # Keep original DALL-E URL for reference
            "description": description,
            "enhanced_prompt": enhanced_prompt
        }
        
        # Add local URL if download was successful
        if local_image_info:
            result["local_url"] = local_image_info["local_url"]
            result["filename"] = local_image_info["filename"]
            logger.info(f"🏠 Local image URL: {local_image_info['local_url']}")
        else:
            logger.warning("⚠️ Failed to save image locally, using original DALL-E URL")
        
        return result
        
    except Exception as e:
        logger.error(f"DALL-E API error: {str(e)}")
        return {"error": f"Image generation error: {str(e)}"}

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
    api_status = "✅ Connected" if (OPENAI_API_KEY and OPENAI_API_KEY != 'your_openai_api_key_here') else "❌ Not Configured"
    
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
        <li>✅ DALL-E 3 image generation for educational content</li>
        <li>✅ PDF page image conversion (preserves all content including images)</li>
        <li>✅ Educational content generation</li>
        <li>✅ Multi-language teaching support</li>
        <li>✅ Class-specific lesson planning</li>
        <li>✅ Interactive activity suggestions</li>
    </ul>
    
    <h2>Setup Instructions:</h2>
    <ol>
        <li>Get your OpenAI API key from <a href="https://platform.openai.com/api-keys">platform.openai.com</a></li>
        <li>Open the <code>.env</code> file in this directory</li>
        <li>Replace <code>your_openai_api_key_here</code> with your actual API key</li>
        <li>Save the file and restart this server</li>
    </ol>
    
    <h2>How It Works:</h2>
    <ul>
        <li>📝 Receives teacher questions with education context</li>
        <li>🎨 Generates educational images when requested (e.g., "Generate an image of...")</li>
        <li>📄 Converts PDF pages to high-quality images (preserving all visual content)</li>
        <li>🤖 Sends context + image to GPT-4 vision model for comprehensive analysis</li>
        <li>🎯 Returns classroom-ready teaching suggestions</li>
    </ul>
    
    <h2>Image Generation Usage:</h2>
    <ul>
        <li>🎨 Use phrases like "Generate an image of...", "Create a picture of...", "Illustrate..."</li>
        <li>📚 Images are automatically optimized for educational use and class level</li>
        <li>🎯 AI provides teaching guidance on how to use the generated images</li>
    </ul>
    """

@app.route('/api/status')
def status():
    """API status endpoint"""
    return jsonify({
        "status": "running",
        "ai_configured": bool(OPENAI_API_KEY and OPENAI_API_KEY != 'your_openai_api_key_here'),
        "ai_provider": "OpenAI",
        "model": "gpt-4o",
        "timestamp": datetime.now().isoformat(),
        "endpoints": ["/api/chat", "/api/status", "/api/test"]
    })

@app.route('/api/test')
def test():
    """Test endpoint to verify API is working"""
    return jsonify({
        "message": "AI Education Assistant Backend is running!",
        "ai_status": "configured" if (OPENAI_API_KEY and OPENAI_API_KEY != 'your_openai_api_key_here') else "not_configured",
        "ai_provider": "OpenAI",
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
        if not OPENAI_API_KEY or OPENAI_API_KEY == 'your_openai_api_key_here':
            return jsonify({
                "error": "OpenAI API key not configured. Please add your API key to the .env file and restart the server."
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
                # Convert current page to high-quality image to preserve all content
                current_page_index = education_context['current_page'] - 1  # Convert to 0-based index
                page_image = pdf_page_to_image(current_pdf_path, current_page_index, dpi=200)  # Higher DPI for better quality
                
                if page_image:
                    image_base64 = image_to_base64(page_image)
                    file_context = {
                        'info': files_info[education_context['current_pdf_index']] if files_info else {},
                        'page': education_context['current_page'],
                        'total_pages': education_context['total_pages']
                    }
                    logger.info(f"✅ Converted page {education_context['current_page']} to high-quality image for AI analysis")
                else:
                    logger.warning(f"⚠️  Failed to convert page {education_context['current_page']} to image")
                    
            except Exception as e:
                logger.error(f"Error processing PDF page: {str(e)}")
        
        # Build prompt with education context
        system_prompt, user_prompt = build_education_prompt(message, education_context, file_context)
        
        # Prepare messages for AI
        messages = {
            'system': system_prompt,
            'user': user_prompt
        }
        
        # Check if this is an image generation request
        is_image_request = detect_image_generation_request(message)
        generated_image = None
        
        if is_image_request:
            logger.info("🎨 Detected image generation request")
            image_description = extract_image_description(message)
            logger.info(f"🎨 Image description: {image_description}")
            
            try:
                generated_image = asyncio.run(generate_image_with_dalle(image_description, education_context))
                logger.info(f"🎨 Image generation result: {generated_image}")
            except Exception as e:
                logger.error(f"🎨 Image generation exception: {str(e)}")
                generated_image = {"error": f"Image generation failed: {str(e)}"}
            
            if generated_image and 'error' not in generated_image:
                # Modify the user prompt to include context about the generated image
                messages['user'] += f"\n\nI have generated an educational image for you based on: '{image_description}'. The image has been created and will be displayed to the user. Please provide educational guidance on how to use this image effectively in your Class {education_context.get('class_level', '6')} classroom with {education_context.get('class_strength', '30')} students."
        
        logger.info("🤖 Sending request to OpenAI API...")
        
        # Call OpenAI API with image context
        response = asyncio.run(call_openai_api(messages, image_base64))
        
        if 'error' in response:
            logger.error(f"AI API Error: {response['error']}")
            return jsonify(response), 500
        
        # Add generated image to response if available
        if generated_image and 'error' not in generated_image:
            response['generated_image'] = generated_image
            logger.info(f"✅ Added generated image to response: {generated_image.get('image_url', 'No URL')}")
        elif generated_image and 'error' in generated_image:
            # If image generation failed, mention it in the text response
            logger.warning(f"⚠️ Image generation failed: {generated_image['error']}")
            response['text'] += f"\n\n*Note: I attempted to generate an image for you, but encountered an issue: {generated_image['error']}*"
            response['html'] += f"<p><em>Note: I attempted to generate an image for you, but encountered an issue: {generated_image['error']}</em></p>"
        elif is_image_request:
            logger.warning("⚠️ Image generation was requested but no result was returned")
        
        logger.info("✅ Received response from OpenAI API")
        logger.info(f"📤 Final response structure: {list(response.keys())}")
        
        # Log the complete response for debugging
        if 'generated_image' in response:
            logger.info(f"🎨 Response contains generated_image: {response['generated_image']}")
        
        logger.info(f"📤 Complete response being sent: {response}")
        
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

@app.route('/temp_images/<filename>')
def temp_image_file(filename):
    """Serve temporarily saved DALL-E images"""
    try:
        return send_from_directory(TEMP_FOLDER, filename)
    except FileNotFoundError:
        logger.error(f"❌ Temp image not found: {filename}")
        return jsonify({"error": "Image not found"}), 404

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
    if OPENAI_API_KEY and OPENAI_API_KEY != 'your_openai_api_key_here':
        print(f"🤖 OpenAI API: ✅ Configured (.env file)")
        print(f"🧠 Model: GPT-4 with vision capabilities")
    else:
        print(f"🤖 OpenAI API: ❌ NOT CONFIGURED")
        print(f"⚠️  Please configure your OpenAI API key in the .env file!")
        print(f"💡 Steps to configure:")
        print(f"   1. Open the .env file in this directory")
        print(f"   2. Replace 'your_openai_api_key_here' with your actual API key")
        print(f"   3. Get your API key from: https://platform.openai.com/api-keys")
        print(f"   4. Restart this server")
    
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
    print("   ✅ Real ChatGPT integration with vision")
    print("   ✅ DALL-E 3 image generation for education")
    print("   ✅ PDF page to image conversion")
    print("   ✅ Educational content generation")
    print("   ✅ Multi-language teaching support")
    print("   ✅ Class-specific responses")
    print("   ✅ Automatic file cleanup")
    print("\n📊 Backend processes:")
    print("   📝 Teacher questions + education context")
    print("   🎨 Image generation with DALL-E 3")
    print("   📄 PDF pages → high-quality images")
    print("   🤖 AI analysis with visual context")
    print("   🎯 Classroom-ready teaching suggestions")
    print("\n💡 Required packages:")
    print("   pip install openai PyMuPDF Pillow python-dotenv markdown")
    print("\n🎨 Image Generation:")
    print("   Use: 'Generate an image of...', 'Create a picture of...', 'Illustrate...'")
    print("   Images are optimized for educational use and class level")
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
