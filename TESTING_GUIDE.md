# 🧪 Backend Integration Testing Guide

This guide will help you test the integration between your frontend and the test backend.

## 🚀 Quick Start

### Step 1: Setup Backend
1. **Run setup** (only needed once):
   ```cmd
   setup.bat
   ```
   This will:
   - Check if Python is installed
   - Create virtual environment (.venv) if it doesn't exist
   - Activate the virtual environment
   - Install required dependencies
   
   Or manually:
   ```cmd
   python -m venv .venv
   .venv\Scripts\activate.bat
   pip install -r requirements.txt
   ```

2. **Start the backend server**:
   ```cmd
   run_backend.bat
   ```
   Or manually:
   ```cmd
   .venv\Scripts\activate.bat
   python test_backend.py
   ```

3. **Verify backend is running**:
   - Open http://localhost:5000 in browser
   - You should see "AI Chatbot Test Backend" page

### Step 2: Test Frontend
1. **Open the frontend**:
   - Open `index.html` in your browser
   - Or use a local server for better testing

2. **Open browser developer tools** (F12):
   - Go to Console tab to see debug logs
   - Go to Network tab to see API requests

## 🧪 Test Scenarios

### 1. **Basic Text Response**
- **Type**: "Hello, how are you?"
- **Expected**: Text response from backend
- **Check**: Console shows request/response logs

### 2. **Image Generation Response**
- **Type**: "generate an image" or "show me a chart"
- **Expected**: Text response + image displayed in left panel
- **Check**: Image appears in left panel

### 3. **Analysis/Checklist Response**
- **Type**: "analyze the document" or "check the format"
- **Expected**: Text response + checklist in left panel
- **Check**: Checklist with ✓/✗ symbols appears

### 4. **Complete Response (All Types)**
- **Type**: "give me everything" or "complete analysis"
- **Expected**: Text + image + checklist
- **Check**: All three response types appear

### 5. **Error Testing**
- **Type**: "error" or "fail"
- **Expected**: Error message displayed
- **Check**: Error notification appears

### 6. **PDF Upload Testing**
- **Upload**: Any PDF file (drag & drop or click)
- **Expected**: File appears in uploaded files list
- **Check**: Console shows file details

### 7. **PDF + Message Integration**
- **Do**: Upload PDF, then send message
- **Expected**: Backend receives both message and file
- **Check**: Console shows file count in request

## 🔍 Debugging Checklist

### Frontend Debug Info (Browser Console)
Look for these logs:
```
Files selected via input: [{name: "document.pdf", type: "application/pdf", size: 1234567}]
Sending to backend: {message: "test", fileCount: 1, endpoint: "http://localhost:5000/api/chat"}
Added file 0: document.pdf (1234567 bytes)
Backend response: {text: "response text"}
```

### Backend Debug Info (Terminal)
Look for these logs:
```
============================================================
[2025-08-02 10:30:45] NEW REQUEST
Message: test message
Files uploaded: 1
  File 0: {'original_name': 'document.pdf', 'saved_as': '1234567890_document.pdf', 'size': 1234567, 'path': 'uploads/1234567890_document.pdf'}
============================================================

Simulating processing... (2.1s)
Generated response: {
  "text": "I've analyzed your message..."
}
```

## ❌ Common Issues & Solutions

### 1. **CORS Error**
**Error**: "Access to fetch at 'http://localhost:5000/api/chat' from origin 'null' has been blocked by CORS policy"
**Solution**: Backend includes CORS headers, but if you still see this:
- Use a local server instead of opening HTML directly
- Or start Python server: `python -m http.server 8000`

### 2. **Connection Refused**
**Error**: "Failed to fetch"
**Solution**: 
- Make sure backend is running (`python test_backend.py`)
- Check if port 5000 is available
- Verify URL is `http://localhost:5000/api/chat`

### 3. **File Upload Not Working**
**Error**: No files being sent to backend
**Solution**:
- Check browser console for file selection logs
- Ensure PDF file type is correct
- Check file size (max 10MB)

### 4. **No Response from Backend**
**Error**: Loading never stops
**Solution**:
- Check backend terminal for errors
- Verify JSON response format
- Check if backend port is correct

## 📊 Expected API Behavior

### Request Format
```
POST http://localhost:5000/api/chat
Content-Type: multipart/form-data

Form Data:
- message: "user message text"
- file_0: [PDF File] (if uploaded)
- file_1: [PDF File] (if multiple files)
```

### Response Format
```json
{
  "text": "AI response text",
  "image_url": "https://example.com/image.jpg",
  "checklist": {
    "Item 1": true,
    "Item 2": false
  }
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

## 🎯 Success Criteria

✅ **Integration Working** if you see:
1. Frontend sends requests to backend
2. Backend receives and logs requests
3. Backend returns appropriate responses
4. Frontend displays responses correctly
5. File uploads work properly
6. Error handling works

## 🔧 Advanced Testing

### Test Different File Types
- Try uploading non-PDF files (should show error)
- Upload large files >10MB (should show error)
- Upload multiple PDFs (should all appear)

### Test Network Issues
- Stop backend while frontend is running
- Send message (should show connection error)
- Restart backend and try again

### Test Response Types
- Modify `test_backend.py` to return custom responses
- Test with real data instead of placeholder responses
- Add authentication testing if needed

## 📝 Next Steps

Once this test backend works:
1. Replace with your actual RAG pipeline backend
2. Update the endpoint URL in `script.js`
3. Modify response format if needed
4. Add authentication if required
5. Deploy to production environment

## 🆘 Need Help?

If you encounter issues:
1. Check both browser console and backend terminal
2. Verify all files are in the correct location
3. Ensure Python dependencies are installed
4. Try the manual setup steps
5. Test each component separately (backend, frontend, file upload)
