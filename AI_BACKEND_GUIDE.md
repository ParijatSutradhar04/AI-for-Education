# AI Education Assistant Backend Guide

## Overview

This project now has two backend options:

1. **`test_backend.py`** - Simple test backend with mock responses
2. **`backend.py`** - Real AI backend using OpenAI's ChatGPT API

## 🤖 Real AI Backend (`backend.py`)

### Features
- **Real ChatGPT Integration**: Uses OpenAI's GPT-4 with vision capabilities
- **PDF Context Processing**: Extracts current page as image and sends to AI
- **Educational Context**: Considers class level, languages, student count
- **Smart Prompting**: Builds education-specific prompts for better responses
- **File Management**: Automatic cleanup of uploaded files and temp images

### Setup Requirements

#### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 2. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Copy the key (starts with `sk-...`)

#### 3. Configure Environment Variables
1. Open the `.env` file in the project directory
2. Replace `your_openai_api_key_here` with your actual API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
3. Save the file

**Note**: The `.env` file keeps your API key secure and prevents it from being committed to version control.

#### 4. Start the Backend
```bash
python backend.py
```

Or use the setup script:
```bash
setup_backend.bat
```

Or use the start script:
```bash
start_ai_backend.bat
```

### How It Works

1. **Receives Request**: Teacher sends message + PDF + education context
2. **Processes PDF**: Extracts current page as high-quality image
3. **Builds Context**: Creates education-specific prompt with:
   - Teacher's language
   - Student's language  
   - Class level and size
   - Current PDF page content
4. **AI Analysis**: Sends context + image to GPT-4 for analysis
5. **Returns Response**: Classroom-ready teaching suggestions

### API Endpoints

- `POST /api/chat` - Main AI chat endpoint
- `GET /api/status` - Check server and AI status
- `GET /api/test` - Test endpoint
- `GET /` - Backend information page

### Education Context Processing

The AI receives and considers:
- **Class Level**: Adapts complexity for Class 1-10
- **Student Count**: Suggests activities for class size (10-50 students)
- **Languages**: Bilingual support when teacher/student languages differ
- **PDF Content**: Current page image for visual context
- **Page Context**: Current page number and total pages

### Example AI Responses

**Input**: "How can I teach fractions to my students?" (Class 6, 30 students, page 15 of math PDF)

**AI Output**: Detailed response including:
- Age-appropriate fraction concepts for Class 6
- Interactive activities for 30 students
- Visual aids using the PDF content
- Assessment strategies
- Differentiation for diverse learners

## 🧪 Test Backend (`test_backend.py`)

### Features
- **Mock Responses**: Simulated AI responses for testing
- **No API Keys**: Works without external services
- **Educational Context**: Still processes education settings
- **File Upload**: Handles PDF uploads (stores but doesn't process)
- **Testing Modes**: Different response types based on keywords

### Use Cases
- Frontend development and testing
- Demo purposes when API key is not available
- Development without API costs

### Testing Keywords
- `"lesson"` → Lesson planning responses
- `"image"` → Text + image responses  
- `"language"` → Multilingual support responses
- `"error"` → Error handling testing

## 💡 Usage Tips

### Quick Start Options

**Option 1: Simple Launcher**
```bash
start_app.bat
```
- Choose between AI backend (1) or Test backend (2)
- Prompts for OpenAI API key if needed
- Starts both backend and frontend

**Option 2: Advanced Launcher**
```bash
start_advanced.bat
```
- All features of simple launcher plus:
- Remembers your last choice
- Auto-installs AI dependencies
- Setup wizard for API key
- Permanent API key storage option

**Option 3: Individual Scripts**
```bash
# AI Backend only
start_ai_backend.bat

# Test Backend only
python test_backend.py

# Frontend only
python start_frontend.py
```

### For Development
1. Start with `test_backend.py` for frontend development
2. Switch to `backend.py` when ready for real AI responses
3. Both backends use the same API endpoints (`/api/chat`)
4. Use `start_advanced.bat` for the most convenient experience

### For Production
1. Use `backend.py` with a valid OpenAI API key
2. Set up proper environment variables
3. Consider rate limiting and cost monitoring

### Frontend Configuration
The frontend automatically works with both backends. Make sure:
- Backend URL is set correctly in `script.js`
- Both backends run on `http://localhost:5000` by default

## 🔧 Troubleshooting

### Common Issues

**"OpenAI API key not configured"**
- Set the `OPENAI_API_KEY` environment variable
- Restart the backend after setting the key

**"Error converting PDF page to image"**
- Install PyMuPDF: `pip install PyMuPDF`
- Check if PDF file is corrupted

**"AI service error"**
- Check your OpenAI API key is valid
- Verify you have API credits available
- Check internet connection

**CORS errors**
- Both backends have CORS enabled for local development
- Make sure frontend and backend ports match

### File Structure
```
AI_for_Education/
├── backend.py              # Real AI backend
├── test_backend.py         # Test backend  
├── requirements_backend.txt # Python dependencies
├── setup_backend.bat       # Setup script
├── start_ai_backend.bat    # Start AI backend
├── uploads/                # PDF upload folder
├── temp_images/            # Temporary image files
├── script.js               # Frontend JavaScript
├── index.html              # Frontend HTML
└── styles.css              # Frontend CSS
```

## 🎯 Next Steps

1. **Set up OpenAI API key** following the setup guide
2. **Test with simple questions** to verify AI integration
3. **Upload PDFs** and test page context processing
4. **Try different education contexts** (languages, class levels)
5. **Monitor API usage** and costs on OpenAI dashboard

## 💰 Cost Considerations

- GPT-4 with vision is more expensive than GPT-3.5
- Each request with image costs more than text-only
- Monitor usage on [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- Consider implementing rate limiting for production use

## 🔒 Security Notes

- Keep your OpenAI API key secure
- Don't commit API keys to version control
- Use environment variables in production
- Implement proper error handling for production use
