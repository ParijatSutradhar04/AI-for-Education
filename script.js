class ChatbotUI {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.chatHistory = [];
        this.uploadedFilesList = []; // Array to store uploaded file objects
        // Set to false to use real backend, true for simulation
        this.useSimulation = false; // Change this to toggle between simulation and real backend
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.pdfInput = document.getElementById('pdfInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.uploadedFilesContainer = document.getElementById('uploadedFiles'); // DOM element for file display
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.imageSection = document.getElementById('imageSection');
        this.generatedImage = document.getElementById('generatedImage');
        this.checklistSection = document.getElementById('checklistSection');
        this.checklistContainer = document.getElementById('checklistContainer');
    }

    setupEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // Enter key in textarea
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        // PDF upload events
        this.pdfInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.uploadArea.addEventListener('click', () => this.pdfInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        this.messageInput.value = '';
        this.autoResizeTextarea();

        // Show loading
        this.showLoading();

        try {
            if (this.useSimulation) {
                // Use simulation for testing
                this.simulateBackendResponse(message);
            } else {
                // Send actual request to backend with message and uploaded files
                const response = await this.sendToBackend(message, this.uploadedFilesList);
                this.handleBackendResponse(response);
                this.hideLoading();
            }
        } catch (error) {
            console.error('Error sending message to backend:', error);
            this.addMessage('Sorry, there was an error processing your request. Please try again.', 'bot');
            this.showNotification('Failed to connect to backend', 'error');
            this.hideLoading();
        }
    }

    addMessage(content, sender, timestamp = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `<p>${content}</p>`;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = timestamp || this.getCurrentTime();

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        // Store in chat history
        this.chatHistory.push({
            content,
            sender,
            timestamp: timestamp || this.getCurrentTime()
        });
    }

    simulateBackendResponse(userMessage) {
        // Simulate different types of responses based on user input
        setTimeout(() => {
            this.hideLoading();

            // Simulate different response types
            if (userMessage.toLowerCase().includes('image') || userMessage.toLowerCase().includes('generate')) {
                this.handleImageResponse();
            } else if (userMessage.toLowerCase().includes('analysis') || userMessage.toLowerCase().includes('check')) {
                this.handleChecklistResponse();
            } else {
                this.handleTextResponse(userMessage);
            }
        }, 2000); // Simulate network delay
    }

    handleTextResponse(userMessage) {
        const responses = [
            "I understand your question about the uploaded document. Based on the content, here's what I found...",
            "That's an interesting question! Let me analyze the document and provide you with relevant information.",
            "I've processed your request. Here are the key insights from the document related to your query:",
            "Based on the PDF content you uploaded, I can help you with that. Here's my analysis..."
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        this.addMessage(randomResponse, 'bot');
    }

    handleImageResponse() {
        // Simulate image generation response
        const imageUrl = 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/IIT_Kharagpur_Logo.svg/300px-IIT_Kharagpur_Logo.svg.png';
        this.displayImage(imageUrl);
        this.addMessage('I\'ve generated an image based on your request. You can see it in the left panel.', 'bot');
    }

    handleChecklistResponse() {
        // Simulate checklist response
        const sampleChecklist = {
            'Document structure is valid': true,
            'Contains required sections': true,
            'Grammar and spelling check': false,
            'Citations are properly formatted': true,
            'Images have proper captions': false,
            'Bibliography is complete': true
        };

        this.displayChecklist(sampleChecklist);
        this.addMessage('I\'ve completed the analysis of your document. Check the results in the left panel.', 'bot');
    }

    displayImage(imageUrl) {
        this.generatedImage.src = imageUrl;
        this.imageSection.style.display = 'block';
    }

    displayChecklist(checklist) {
        this.checklistContainer.innerHTML = '';
        
        Object.entries(checklist).forEach(([item, status]) => {
            const checklistItem = document.createElement('div');
            checklistItem.className = 'checklist-item';

            const icon = document.createElement('div');
            icon.className = `checklist-icon ${status}`;
            icon.innerHTML = status ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';

            const text = document.createElement('div');
            text.className = 'checklist-text';
            text.textContent = item;

            checklistItem.appendChild(icon);
            checklistItem.appendChild(text);
            this.checklistContainer.appendChild(checklistItem);
        });

        this.checklistSection.style.display = 'block';
    }

    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        console.log('Files selected via input:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
        this.processFiles(files);
    }

    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        this.uploadArea.style.background = '#e8ecff';
        this.uploadArea.style.borderColor = '#764ba2';
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        this.uploadArea.style.background = '#f8f9ff';
        this.uploadArea.style.borderColor = '#667eea';
    }

    handleFileDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        this.uploadArea.style.background = '#f8f9ff';
        this.uploadArea.style.borderColor = '#667eea';
        
        const allFiles = Array.from(event.dataTransfer.files);
        console.log('Files dropped:', allFiles.map(f => ({ name: f.name, type: f.type, size: f.size })));
        
        const files = allFiles.filter(file => file.type === 'application/pdf');
        
        if (files.length > 0) {
            this.processFiles(files);
        } else {
            this.showNotification('Please upload only PDF files', 'error');
        }
    }

    processFiles(files) {
        files.forEach(file => {
            if (file.type === 'application/pdf') {
                // Check for duplicates
                const isDuplicate = this.uploadedFilesList.some(existingFile => 
                    existingFile.name === file.name && existingFile.size === file.size
                );
                
                if (isDuplicate) {
                    this.showNotification(`File "${file.name}" is already uploaded`, 'warning');
                    return;
                }

                // Check file size (limit to 10MB)
                const maxSize = 10 * 1024 * 1024; // 10MB
                if (file.size > maxSize) {
                    this.showNotification(`File "${file.name}" is too large. Maximum size is 10MB.`, 'error');
                    return;
                }

                this.uploadedFilesList.push(file);
                this.displayUploadedFile(file);
            } else {
                this.showNotification('Only PDF files are supported', 'error');
            }
        });
    }

    displayUploadedFile(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';

        const fileIcon = document.createElement('i');
        fileIcon.className = 'fas fa-file-pdf';

        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = file.name;

        const fileSize = document.createElement('span');
        fileSize.className = 'file-size';
        fileSize.textContent = this.formatFileSize(file.size);

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-file';
        removeButton.innerHTML = '<i class="fas fa-trash"></i>';
        removeButton.onclick = () => this.removeFile(file, fileItem);

        fileInfo.appendChild(fileIcon);
        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileSize);

        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeButton);

        this.uploadedFilesContainer.appendChild(fileItem);

        // Simulate file processing
        this.showNotification(`Successfully uploaded: ${file.name}`, 'success');
    }

    removeFile(file, fileElement) {
        const index = this.uploadedFilesList.indexOf(file);
        if (index > -1) {
            this.uploadedFilesList.splice(index, 1);
        }
        fileElement.remove();
        this.showNotification(`Removed: ${file.name}`, 'info');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showLoading() {
        this.loadingOverlay.style.display = 'flex';
        this.sendButton.disabled = true;
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
        this.sendButton.disabled = false;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-size: 14px;
            z-index: 1001;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        notification.style.background = colors[type] || colors.info;

        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Method to integrate with backend API
    async sendToBackend(message, files = []) {
        try {
            const formData = new FormData();
            formData.append('message', message);
            
            // Add each uploaded file to the form data
            files.forEach((file, index) => {
                formData.append(`file_${index}`, file);
                console.log(`Added file ${index}: ${file.name} (${file.size} bytes)`);
            });

            console.log('Sending to backend:', {
                message: message,
                fileCount: files.length,
                endpoint: 'http://localhost:5000/api/chat'
            });

            // Replace with your actual backend endpoint
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                body: formData,
                // Add headers if needed for authentication
                // headers: {
                //     'Authorization': 'Bearer ' + yourAuthToken
                // }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Backend response:', data);
            return data;
        } catch (error) {
            console.error('Backend API error:', error);
            return { error: 'Failed to connect to backend: ' + error.message };
        }
    }

    // Method to handle actual backend responses
    handleBackendResponse(response) {
        if (response.error) {
            this.addMessage('Sorry, there was an error processing your request.', 'bot');
            this.showNotification(response.error, 'error');
            return;
        }

        // Handle text response
        if (response.text) {
            this.addMessage(response.text, 'bot');
        }

        // Handle image response
        if (response.image_url) {
            this.displayImage(response.image_url);
        }

        // Handle checklist response
        if (response.checklist) {
            this.displayChecklist(response.checklist);
        }
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChatbotUI();
});
