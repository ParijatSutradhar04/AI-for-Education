# Backend Integration Guide

## How the Frontend Sends Data

The frontend now sends the user's prompt and uploaded PDFs to your backend via a POST request to `/api/chat`.

### Request Format

**Endpoint:** `POST /api/chat`
**Content-Type:** `multipart/form-data`

**Form Data:**
- `message`: The user's text prompt (string)
- `file_0`, `file_1`, etc.: Uploaded PDF files (if any)

### Example Request Data

```javascript
// What gets sent to your backend:
FormData {
    message: "What is this document about?",
    file_0: [PDF File Object],
    file_1: [PDF File Object] // if multiple files uploaded
}
```

## Backend Response Format

Your backend should return a JSON response with any combination of these fields:

```javascript
{
    "text": "Your AI response text here",           // Optional: Text response
    "image_url": "path/to/generated/image.jpg",  // Optional: Generated image URL
    "checklist": {                               // Optional: Analysis checklist
        "Document structure is valid": true,
        "Contains required sections": true,
        "Grammar check passed": false,
        "Citations are properly formatted": true
    }
}
```

## Example Backend Implementations

### Python Flask Example

```python
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        # Get the user's message
        message = request.form.get('message')
        
        # Get uploaded files
        uploaded_files = []
        for key in request.files:
            if key.startswith('file_'):
                file = request.files[key]
                if file and file.filename.endswith('.pdf'):
                    # Save the file
                    filepath = os.path.join('uploads', file.filename)
                    file.save(filepath)
                    uploaded_files.append(filepath)
        
        # Process with your RAG pipeline
        response_text = process_with_rag(message, uploaded_files)
        
        # Return response
        return jsonify({
            "text": response_text
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def process_with_rag(message, files):
    # Your RAG processing logic here
    # 1. Extract text from PDFs
    # 2. Create embeddings
    # 3. Query your vector database
    # 4. Generate response with LLM
    return "Processed response based on uploaded documents..."

if __name__ == '__main__':
    app.run(debug=True)
```

### Node.js Express Example

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/api/chat', upload.any(), async (req, res) => {
    try {
        const message = req.body.message;
        const uploadedFiles = req.files;
        
        console.log('Received message:', message);
        console.log('Uploaded files:', uploadedFiles.map(f => f.originalname));
        
        // Process with your RAG pipeline
        const responseText = await processWithRAG(message, uploadedFiles);
        
        res.json({
            text: responseText
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

async function processWithRAG(message, files) {
    // Your RAG processing logic here
    return `Processed your message: "${message}" with ${files.length} files`;
}

app.listen(3000, () => {
    console.log('Backend server running on port 3000');
});
```

### FastAPI Example

```python
from fastapi import FastAPI, File, UploadFile, Form
from typing import List, Optional
import json

app = FastAPI()

@app.post("/api/chat")
async def chat(
    message: str = Form(...),
    files: List[UploadFile] = File(None)
):
    try:
        # Process uploaded files
        file_paths = []
        if files:
            for file in files:
                if file.content_type == "application/pdf":
                    content = await file.read()
                    # Save or process the file
                    file_paths.append(file.filename)
        
        # Process with your RAG pipeline
        response_text = await process_with_rag(message, file_paths)
        
        return {
            "text": response_text
        }
        
    except Exception as e:
        return {"error": str(e)}

async def process_with_rag(message: str, files: List[str]):
    # Your RAG processing logic here
    return f"Processed message: {message} with {len(files)} files"
```

## Frontend Configuration

### Step 1: Update the Backend URL

In `script.js`, change this line to match your backend:

```javascript
// Line ~350 in script.js
const response = await fetch('/api/chat', {
```

Change to your actual backend URL:
```javascript
const response = await fetch('http://localhost:3000/api/chat', {
// or
const response = await fetch('https://your-backend-domain.com/api/chat', {
```

### Step 2: Enable Real Backend Mode

In `script.js`, set the simulation flag to false:

```javascript
// Line ~7 in script.js
this.useSimulation = false; // Set to false for real backend
```

### Step 3: Add Authentication (if needed)

If your backend requires authentication, uncomment and modify the headers:

```javascript
const response = await fetch('/api/chat', {
    method: 'POST',
    body: formData,
    headers: {
        'Authorization': 'Bearer ' + yourAuthToken
    }
});
```

## Testing the Integration

1. **Start your backend server**
2. **Set `useSimulation = false` in the frontend**
3. **Open browser developer tools (F12)**
4. **Upload a PDF and send a message**
5. **Check the console for:**
   - "Sending to backend:" log with message and file count
   - "Backend response:" log with the response
   - Any error messages

## Debugging Tips

### Common Issues:

1. **CORS Errors**: Add CORS headers to your backend
2. **File Upload Limits**: Check your backend's file size limits
3. **Network Errors**: Verify the backend URL is correct
4. **Authentication**: Ensure auth tokens are properly set

### Backend CORS Setup:

**Flask:**
```python
from flask_cors import CORS
CORS(app)
```

**Express:**
```javascript
const cors = require('cors');
app.use(cors());
```

**FastAPI:**
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["*"])
```

## Response Examples

### Text Only Response:
```json
{
    "text": "Based on the uploaded document, this appears to be a research paper about machine learning algorithms..."
}
```

### Text + Image Response:
```json
{
    "text": "I've generated a visualization of the data from your document.",
    "image_url": "https://your-backend.com/generated/chart_123.png"
}
```

### Text + Checklist Response:
```json
{
    "text": "Here's my analysis of your document:",
    "checklist": {
        "Document follows academic format": true,
        "References are properly cited": true,
        "Contains statistical analysis": false,
        "Conclusion matches findings": true
    }
}
```

### All Response Types:
```json
{
    "text": "Complete analysis finished!",
    "image_url": "https://your-backend.com/analysis/result.png",
    "checklist": {
        "Analysis complete": true,
        "Visualization generated": true,
        "Report ready": true
    }
}
```
