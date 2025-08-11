# AI Education Assistant

This is a complete AI-powered education assistant with both frontend and backend components. The application provides an intelligent interface for teachers to interact with educational content using ChatGPT API integration.

## 🚀 Quick Start

### 1. Setup
```bash
# Run the setup script
setup.bat
```

### 2. Configure API Key
1. Open the `.env` file in the project directory
2. Replace `your_openai_api_key_here` with your actual OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
3. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

### 3. Start the Application
```bash
# Run the application
start_app.bat
```

Choose between:
- **AI Backend** (Real ChatGPT - requires API key)
- **Test Backend** (Mock responses - no API key needed)

## Features

### 🔄 Two-Panel Layout
- **Left Panel**: Document upload, image display, and analysis results
- **Right Panel**: Chat interface for user interactions

### 📁 Document Upload
- Drag & drop PDF file upload
- Multiple file support
- File size display and management
- Remove uploaded files functionality

### 💬 Chat Interface
- Real-time chat UI similar to ChatGPT
- Message history preservation
- Auto-resizing text input
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Typing indicators and timestamps

### 🖼️ Image Display
- Dynamic image display area in left panel
- Support for generated images from backend
- Responsive image container

### ✅ Analysis Results (Checklist)
- Dynamic checklist display with true/false indicators
- Visual checkmarks (✓) and crosses (✗)
- Smooth animations and hover effects

### 🎨 Modern UI/UX
- Gradient backgrounds and smooth animations
- Responsive design for mobile and desktop
- Loading overlays and notifications
- Font Awesome icons integration

## File Structure

```
AI_for_Education/
├── index.html          # Main HTML structure
├── styles.css          # Complete CSS styling
├── script.js           # JavaScript functionality
└── README.md          # This documentation
```

## Getting Started

1. **Open the application**:
   - Simply open `index.html` in a web browser
   - Or use a local server for better development experience

2. **Upload PDFs**:
   - Drag and drop PDF files into the left panel
   - Or click "Choose Files" button
   - Files will be displayed with options to remove them

3. **Chat with the AI**:
   - Type messages in the chat input area
   - Press Enter to send messages
   - View responses in the chat history

## Backend Integration

The frontend is designed to easily integrate with your backend API. Here's how to connect it:

### API Endpoint Structure

The JavaScript includes a `sendToBackend()` method that expects:

```javascript
// POST /api/chat
{
    message: "user message",
    files: [uploaded PDF files]
}
```

### Expected Backend Response Format

```javascript
{
    text: "AI response text",           // Optional
    image_url: "path/to/image.jpg",    // Optional
    checklist: {                        // Optional
        "Item 1": true,
        "Item 2": false,
        "Item 3": true
    }
}
```

### Integration Steps

1. **Update API endpoint**:
   ```javascript
   // In script.js, line ~280
   const response = await fetch('/api/chat', {
       method: 'POST',
       body: formData
   });
   ```
   Replace `/api/chat` with your actual backend endpoint.

2. **Enable real backend calls**:
   ```javascript
   // In script.js, replace simulateBackendResponse() call with:
   const response = await this.sendToBackend(message, this.uploadedFiles);
   this.handleBackendResponse(response);
   ```

3. **Handle authentication** (if needed):
   Add headers to the fetch request:
   ```javascript
   const response = await fetch('/api/chat', {
       method: 'POST',
       headers: {
           'Authorization': 'Bearer ' + yourToken
       },
       body: formData
   });
   ```

## Customization

### Colors and Themes
- Primary gradient: `#667eea` to `#764ba2`
- Success color: `#28a745`
- Error color: `#dc3545`
- Background: `#f8f9fa`

### Adding New Response Types
To add new response types from your backend:

1. Add handling in `handleBackendResponse()` method
2. Create corresponding display methods
3. Add UI sections in HTML if needed

### Example: Adding Audio Response
```javascript
// In handleBackendResponse method
if (response.audio_url) {
    this.displayAudio(response.audio_url);
}

// New method
displayAudio(audioUrl) {
    // Add audio player to left panel
}
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Responsive design included

## Development Tips

1. **Testing without backend**:
   - The UI includes simulation modes for development
   - Test different response types using keywords:
     - "image" or "generate" → Shows image response
     - "analysis" or "check" → Shows checklist response
     - Other messages → Shows text response

2. **Debugging**:
   - Open browser dev tools to see console logs
   - Check network tab when integrating with backend
   - Use the notification system for user feedback

3. **Performance**:
   - Large files are handled with progress indicators
   - Chat history is stored in memory (consider persistence for production)
   - Images are lazy-loaded

## Production Considerations

1. **Security**:
   - Implement proper file type validation on backend
   - Add file size limits
   - Sanitize user inputs

2. **Performance**:
   - Implement pagination for chat history
   - Add image compression for large generated images
   - Consider WebSocket for real-time communication

3. **Accessibility**:
   - ARIA labels are included
   - Keyboard navigation support
   - Screen reader compatibility

## Future Enhancements

- [ ] Voice input/output support
- [ ] Multi-language support
- [ ] Dark/light theme toggle
- [ ] Export chat history
- [ ] Advanced file preview
- [ ] Real-time collaboration features

---

This frontend is ready for immediate use and can be easily integrated with your RAG pipeline backend. The modular design allows for easy customization and extension as your requirements evolve.
