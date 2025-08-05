class EducationAssistantUI {
    constructor() {
        // Initialize simplified logging for production
        this.initializePersistentLogging();
        this.persistentLog('=== EDUCATION ASSISTANT UI STARTING ===');
        
        // Define backend URL
        this.BACKEND_URL = 'http://localhost:5000';
        this.persistentLog(`Backend URL set to: ${this.BACKEND_URL}`);
        
        this.initializeElements();
        this.setupEventListeners();
        this.chatHistory = [];
        this.uploadedFilesList = [];
        this.currentPdfData = [];
        this.currentPdfIndex = 0;
        this.currentPage = 1;
        this.totalPages = 1;
        this.canvasItems = [];
        this.currentZoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 3.0;
        this.zoomStep = 0.25;
        // Set to false to use real backend, true for simulation
        this.useSimulation = false;
        this.sendingMessage = false; // Prevent multiple simultaneous requests
        
        this.persistentLog('Education Assistant UI initialized successfully');
    }

    // Simplified debug logging for production
    initializePersistentLogging() {
        // Debug overlay disabled for production
        console.log('Debug logging initialized in simple mode');
    }
    
    persistentLog(message, type = 'log') {
        // Simple console logging for production
        if (type === 'error') {
            console.error(`[UI] ${message}`);
        } else {
            console.log(`[UI] ${message}`);
        }
    }
    
    // DEBUG OVERLAY METHODS - COMMENTED OUT FOR PRODUCTION
    /*
    loadLogs() {
        try {
            const storedLogs = localStorage.getItem(this.logKey);
            this.logs = storedLogs ? JSON.parse(storedLogs) : [];
        } catch (error) {
            this.logs = [];
        }
    }
    
    saveLogs() {
        try {
            localStorage.setItem(this.logKey, JSON.stringify(this.logs));
        } catch (error) {
            // localStorage might be full or disabled
        }
    }
    
    createLogPanel() {
        // Debug overlay disabled for production
    }
    
    updateLogPanel() {
        // Debug overlay disabled for production
    }
    
    clearLogs() {
        // Debug overlay disabled for production
    }
    */

    initializeElements() {
        // Chat elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        
        // PDF elements
        this.pdfInput = document.getElementById('pdfInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.pdfPreviewSection = document.getElementById('pdfPreviewSection');
        this.noPdfMessage = document.getElementById('noPdfMessage');
        this.pdfSelector = document.getElementById('pdfSelector');
        this.pdfCanvas = document.getElementById('pdfCanvas');
        this.currentPageSpan = document.getElementById('currentPage');
        this.totalPagesSpan = document.getElementById('totalPages');
        this.prevPageBtn = document.getElementById('prevPage');
        this.nextPageBtn = document.getElementById('nextPage');
        
        // Zoom elements
        this.zoomInBtn = document.getElementById('zoomIn');
        this.zoomOutBtn = document.getElementById('zoomOut');
        this.fitToWidthBtn = document.getElementById('fitToWidth');
        this.zoomInfo = document.getElementById('zoomInfo');
        
        // Canvas elements
        this.canvasContent = document.getElementById('canvasContent');
        this.downloadCanvasBtn = document.getElementById('downloadCanvasBtn');
        
        // Debug: Check if download button was found
        if (this.downloadCanvasBtn) {
            console.log('Download canvas button found successfully');
            this.persistentLog('Download canvas button found successfully');
        } else {
            console.error('Download canvas button NOT found!');
            this.persistentLog('Download canvas button NOT found!', 'error');
        }
        
        // Form elements
        this.teacherLanguage = document.getElementById('teacherLanguage');
        this.studentLanguage = document.getElementById('studentLanguage');
        this.classLevel = document.getElementById('classLevel');
        this.classStrength = document.getElementById('classStrength');
        
        // Other elements
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    setupEventListeners() {
    // Chat functionality - simplified and cleaned up event handling
        this.sendButton.addEventListener('click', (e) => {
            this.persistentLog('Send button clicked');
            // No need to preventDefault since button is type="button"
            // e.preventDefault();
            e.stopPropagation();
            this.sendMessage();
        });
        
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                this.persistentLog('Enter key pressed in message input');
                e.preventDefault();
                e.stopPropagation();
                this.sendMessage();
            }
        });
        
        this.messageInput.addEventListener('input', () => this.autoResizeTextarea());

        // PDF upload events
        this.pdfInput.addEventListener('change', (e) => {
            this.persistentLog('File input change event triggered');
            e.stopPropagation();
            this.handleFileUpload(e);
        });
        
        // Prevent any form submission behavior on the file input
        this.pdfInput.addEventListener('submit', (e) => {
            this.persistentLog('PREVENTING SUBMIT on file input', 'error');
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        this.uploadArea.addEventListener('click', (e) => {
            this.persistentLog('Upload area clicked');
            e.preventDefault();
            e.stopPropagation();
            
            // Try multiple approaches to trigger the file dialog
            try {
                this.persistentLog('Method 1: Direct click()');
                this.pdfInput.click();
                
                // Fallback: programmatic click
                setTimeout(() => {
                    this.persistentLog('Method 2: Dispatching click event');
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: false,
                        cancelable: true
                    });
                    this.pdfInput.dispatchEvent(clickEvent);
                }, 100);
                
            } catch (error) {
                this.persistentLog(`Error triggering file dialog: ${error.message}`, 'error');
            }
        });
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));

        // PDF navigation
        this.pdfSelector.addEventListener('change', (e) => this.switchPdf(e.target.value));
        this.prevPageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.previousPage();
        });
        this.nextPageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.nextPage();
        });

        // Zoom controls
        this.zoomInBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.zoomIn();
        });
        this.zoomOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.zoomOut();
        });
        this.fitToWidthBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.fitToWidth();
        });

        // Canvas functionality
        this.downloadCanvasBtn.addEventListener('click', (e) => {
            console.log('Download canvas button clicked!');
            this.persistentLog('Download canvas button clicked');
            console.log('Canvas items count:', this.canvasItems.length);
            this.persistentLog(`Canvas items count: ${this.canvasItems.length}`);
            e.preventDefault();
            e.stopPropagation();
            this.downloadCanvasPdf();
        });
    }

    // Add a test method to create sample canvas items for testing
    addTestCanvasItem() {
        const testItem = {
            id: Date.now(),
            question: "This is a test question",
            response: "This is a test response for debugging the download feature.",
            timestamp: this.getCurrentTime()
        };
        this.canvasItems.push(testItem);
        this.renderCanvas();
        this.showNotification('Test item added to canvas', 'info');
        console.log('Test canvas item added');
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        try {
            // Prevent multiple simultaneous requests
            if (this.sendingMessage) {
                this.persistentLog('Message sending already in progress, ignoring duplicate request');
                return;
            }
            
            this.sendingMessage = true;
            
            const message = this.messageInput.value.trim();
            if (!message) {
                this.sendingMessage = false;
                return;
            }

            this.persistentLog('=== SEND MESSAGE START ===');
            this.persistentLog(`Sending message: ${message}`);
            this.persistentLog(`Current files: ${this.uploadedFilesList.length}`);

            // Add user message to chat
            this.addMessage(message, 'user');
            
            // Clear input
            this.messageInput.value = '';
            this.autoResizeTextarea();

            // Show loading
            this.showLoading();

            if (this.useSimulation) {
                this.persistentLog('Using simulation mode');
                this.simulateBackendResponse(message);
                this.hideLoading();
            } else {
                this.persistentLog('Using real backend');
                const payload = this.buildPayload(message);
                this.persistentLog('Payload built successfully');
                
                const response = await this.sendToBackend(payload);
                this.persistentLog('Backend response received');
                
                this.handleBackendResponse(response, message);
                this.persistentLog('Response handled successfully');
                
                this.hideLoading();
            }
            
            this.persistentLog('=== SEND MESSAGE END ===');
            this.sendingMessage = false;
            
        } catch (error) {
            this.persistentLog('=== ERROR IN SEND MESSAGE ===', 'error');
            this.persistentLog(`Error sending message to backend: ${error.message}`, 'error');
            this.addMessage('Sorry, there was an error processing your request. Please try again.', 'bot');
            this.showNotification('Failed to connect to backend', 'error');
            this.hideLoading();
            this.sendingMessage = false;
        }
    }

    buildPayload(message) {
        const formData = new FormData();
        
        // Add message
        formData.append('message', message);
        
        // Add uploaded files
        console.log('Building payload with files:', this.uploadedFilesList.length);
        this.uploadedFilesList.forEach((file, index) => {
            console.log(`Adding file ${index}:`, file.name, file.size);
            formData.append(`file_${index}`, file);
        });
        
        // Add current PDF page
        formData.append('current_page', this.currentPage.toString());
        formData.append('total_pages', this.totalPages.toString());
        formData.append('current_pdf_index', this.currentPdfIndex.toString());
        
        // Add dropdown values
        formData.append('teacher_language', this.teacherLanguage.value);
        formData.append('student_language', this.studentLanguage.value);
        formData.append('class_level', this.classLevel.value);
        formData.append('class_strength', this.classStrength.value);

        console.log('Payload being sent:', {
            message: message,
            fileCount: this.uploadedFilesList.length,
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            teacherLanguage: this.teacherLanguage.value,
            studentLanguage: this.studentLanguage.value,
            classLevel: this.classLevel.value,
            classStrength: this.classStrength.value
        });

        return formData;
    }

    addMessage(content, sender, timestamp = null, imageUrl = null, originalQuestion = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Add text content
        const textDiv = document.createElement('p');
        textDiv.textContent = content;
        contentDiv.appendChild(textDiv);
        
        // Add image if provided
        if (imageUrl) {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'message-image';
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = 'AI Generated Image';
            imageDiv.appendChild(img);
            contentDiv.appendChild(imageDiv);
        }
        
        // Add "Add to Canvas" button for bot messages
        if (sender === 'bot') {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            
            const addToCanvasBtn = document.createElement('button');
            addToCanvasBtn.className = 'add-to-canvas-btn';
            addToCanvasBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Notes';
            addToCanvasBtn.onclick = () => this.addToCanvas(content, imageUrl, originalQuestion);
            
            actionsDiv.appendChild(addToCanvasBtn);
            contentDiv.appendChild(actionsDiv);
        }

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
            timestamp: timestamp || this.getCurrentTime(),
            imageUrl,
            originalQuestion
        });
    }

    addToCanvas(response, imageUrl = null, question = null) {
        const canvasItem = {
            id: Date.now(),
            question: question || this.getLastUserMessage(),
            response: response,
            imageUrl: imageUrl,
            timestamp: this.getCurrentTime()
        };

        this.canvasItems.push(canvasItem);
        this.renderCanvas();
        this.showNotification('Added to notes!', 'success');
    }

    getLastUserMessage() {
        for (let i = this.chatHistory.length - 1; i >= 0; i--) {
            if (this.chatHistory[i].sender === 'user') {
                return this.chatHistory[i].content;
            }
        }
        return 'Question not found';
    }

    renderCanvas() {
        if (this.canvasItems.length === 0) {
            this.canvasContent.innerHTML = `
                <div class="canvas-placeholder">
                    <i class="fas fa-sticky-note"></i>
                    <p>AI responses will appear here when you add them</p>
                    <small>Click "Add to Notes" button next to AI responses in the chat</small>
                </div>
            `;
            return;
        }

        this.canvasContent.innerHTML = '';
        
        this.canvasItems.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'canvas-item';
            
            itemDiv.innerHTML = `
                <div class="canvas-item-header">
                    <span>Note ${index + 1} - ${item.timestamp}</span>
                    <button class="canvas-remove-btn" onclick="educationAssistant.removeFromCanvas(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="canvas-item-question">
                    <strong>Q:</strong> ${item.question}
                </div>
                <div class="canvas-item-response">
                    <strong>A:</strong> ${item.response}
                </div>
                ${item.imageUrl ? `
                    <div class="canvas-item-image">
                        <img src="${item.imageUrl}" alt="AI Generated Image">
                    </div>
                ` : ''}
            `;
            
            this.canvasContent.appendChild(itemDiv);
        });
    }

    removeFromCanvas(itemId) {
        this.canvasItems = this.canvasItems.filter(item => item.id !== itemId);
        this.renderCanvas();
        this.showNotification('Removed from notes', 'info');
    }

    async downloadCanvasPdf() {
        console.log('=== DOWNLOAD CANVAS PDF START ===');
        this.persistentLog('Download canvas PDF button clicked');
        
        if (this.canvasItems.length === 0) {
            console.log('No canvas items to download');
            this.showNotification('No notes to download', 'warning');
            return;
        }

        console.log(`Canvas items to download: ${this.canvasItems.length}`);
        this.persistentLog(`Canvas items: ${this.canvasItems.length}`);

        try {
            // Check if jsPDF is available
            console.log('Checking jsPDF availability...');
            console.log('window.jspdf:', window.jspdf);
            console.log('typeof window.jspdf:', typeof window.jspdf);
            
            if (typeof window.jspdf === 'undefined') {
                console.error('jsPDF library not loaded');
                this.persistentLog('jsPDF library not loaded', 'error');
                this.showNotification('PDF library not available, downloading as HTML instead', 'warning');
                this.downloadAsHtml();
                return;
            }

            console.log('jsPDF available, proceeding with PDF generation...');
            const { jsPDF } = window.jspdf;
            console.log('jsPDF constructor:', jsPDF);
            
            const pdf = new jsPDF();
            console.log('PDF object created successfully');
            
            let yPosition = 20;
            const pageHeight = pdf.internal.pageSize.height;
            const margin = 20;
            const maxWidth = 170;

            console.log(`Page height: ${pageHeight}, margin: ${margin}, maxWidth: ${maxWidth}`);

            // Add title
            pdf.setFontSize(16);
            pdf.setFont(undefined, 'bold');
            pdf.text('AI Education Assistant - Notes', margin, yPosition);
            yPosition += 25;
            console.log('Title added to PDF');

            this.canvasItems.forEach((item, index) => {
                console.log(`Processing item ${index + 1}/${this.canvasItems.length}`);
                
                // Check if we need a new page (leave room for content)
                if (yPosition > pageHeight - 60) {
                    pdf.addPage();
                    yPosition = 20;
                    console.log('Added new page');
                }

                // Note header
                pdf.setFontSize(12);
                pdf.setFont(undefined, 'bold');
                pdf.text(`Note ${index + 1} - ${item.timestamp}`, margin, yPosition);
                yPosition += 15;

                // Question
                pdf.setFontSize(10);
                pdf.setFont(undefined, 'bold');
                const questionText = `Q: ${item.question}`;
                const questionLines = pdf.splitTextToSize(questionText, maxWidth);
                pdf.text(questionLines, margin, yPosition);
                yPosition += questionLines.length * 6 + 5;

                // Answer
                pdf.setFont(undefined, 'normal');
                const responseText = `A: ${item.response}`;
                const responseLines = pdf.splitTextToSize(responseText, maxWidth);
                
                // Check if response will fit on current page
                if (yPosition + responseLines.length * 6 > pageHeight - 20) {
                    pdf.addPage();
                    yPosition = 20;
                    console.log('Added new page for response');
                }
                
                pdf.text(responseLines, margin, yPosition);
                yPosition += responseLines.length * 6 + 20;
            });

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `ai-education-notes-${timestamp}.pdf`;
            
            console.log(`Saving PDF as: ${filename}`);
            pdf.save(filename);
            console.log('PDF save() method called');
            
            this.showNotification('PDF downloaded successfully!', 'success');
            this.persistentLog('PDF download completed successfully');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.persistentLog(`Error generating PDF: ${error.message}`, 'error');
            this.showNotification('Error generating PDF, downloading as HTML instead', 'warning');
            this.downloadAsHtml();
        }
        
        console.log('=== DOWNLOAD CANVAS PDF END ===');
    }

    downloadAsHtml() {
        const timestamp = new Date().toISOString().slice(0, 10);
        
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>AI Education Assistant - Notes - ${timestamp}</title>
                <meta charset="UTF-8">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 40px; 
                        line-height: 1.6;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                        border-bottom: 2px solid #667eea;
                        padding-bottom: 20px;
                    }
                    .note { 
                        margin-bottom: 30px; 
                        padding: 20px; 
                        border-left: 4px solid #667eea; 
                        background: #f8f9ff;
                        border-radius: 5px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    }
                    .question { 
                        background: #e3f2fd; 
                        padding: 15px; 
                        margin-bottom: 15px; 
                        border-radius: 5px;
                        font-weight: bold;
                    }
                    .response { 
                        line-height: 1.8;
                        padding: 10px;
                    }
                    .timestamp { 
                        font-size: 12px; 
                        color: #666; 
                        margin-bottom: 15px;
                        font-style: italic;
                    }
                    .note-number {
                        color: #667eea;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎓 AI Education Assistant - Notes</h1>
                    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                </div>
        `;

        this.canvasItems.forEach((item, index) => {
            htmlContent += `
                <div class="note">
                    <div class="timestamp"><span class="note-number">Note ${index + 1}</span> - ${item.timestamp}</div>
                    <div class="question">📝 <strong>Question:</strong> ${this.escapeHtml(item.question)}</div>
                    <div class="response">💡 <strong>Answer:</strong> ${this.escapeHtml(item.response)}</div>
                </div>
            `;
        });

        htmlContent += `
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-education-notes-${timestamp}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Notes downloaded as HTML!', 'success');
    }
    
    // Helper function to escape HTML characters
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // PDF handling methods
    handleFileUpload(event) {
        try {
            this.persistentLog('handleFileUpload called');
            const files = Array.from(event.target.files);
            this.persistentLog(`Files selected via input: ${files.length} files`);
            console.log('Files details:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
            
            this.processFiles(files);
            
            // Clear the input to allow re-uploading the same file
            event.target.value = '';
            this.persistentLog('File input cleared successfully');
        } catch (error) {
            this.persistentLog(`Error in handleFileUpload: ${error.message}`, 'error');
            console.error('File upload error:', error);
        }
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

    async processFiles(files) {
        for (const file of files) {
            if (file.type === 'application/pdf') {
                // Check for duplicates
                const isDuplicate = this.uploadedFilesList.some(existingFile => 
                    existingFile.name === file.name && existingFile.size === file.size
                );
                
                if (isDuplicate) {
                    this.showNotification(`File "${file.name}" is already uploaded`, 'warning');
                    continue;
                }

                // Check file size (limit to 10MB)
                const maxSize = 10 * 1024 * 1024;
                if (file.size > maxSize) {
                    this.showNotification(`File "${file.name}" is too large. Maximum size is 10MB.`, 'error');
                    continue;
                }

                this.uploadedFilesList.push(file);
                this.persistentLog(`File added to uploadedFilesList: ${file.name}`);
                
                // Load PDF preview now that backend connectivity is fixed
                await this.loadPdfPreview(file);
                this.persistentLog('PDF preview loaded successfully');
                
                this.showNotification(`Successfully uploaded: ${file.name}`, 'success');
            } else {
                this.showNotification('Only PDF files are supported', 'error');
            }
        }
        
        // Update selector and show preview
        this.updatePdfSelector();
        this.showPdfPreview();
        this.persistentLog('PDF selector and preview updated successfully');
    }

    async loadPdfPreview(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            
            this.currentPdfData.push({
                file: file,
                pdf: pdf,
                name: file.name
            });
            
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showNotification(`Error loading PDF: ${file.name}`, 'error');
        }
    }

    updatePdfSelector() {
        this.pdfSelector.innerHTML = '';
        this.currentPdfData.forEach((pdfData, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = pdfData.name;
            this.pdfSelector.appendChild(option);
        });
    }

    showPdfPreview() {
        console.log('showPdfPreview called, PDF data length:', this.currentPdfData.length);
        
        if (this.currentPdfData.length > 0) {
            console.log('Showing PDF preview');
            this.pdfPreviewSection.style.display = 'flex';
            this.noPdfMessage.style.display = 'none';
            this.currentPdfIndex = 0;
            this.currentPage = 1;
            this.renderPdfPage();
        } else {
            console.log('No PDFs to show, showing no-PDF message');
            this.pdfPreviewSection.style.display = 'none';
            this.noPdfMessage.style.display = 'flex';
        }
    }

    switchPdf(index) {
        this.currentPdfIndex = parseInt(index);
        this.currentPage = 1;
        this.currentZoom = 1.0;
        this.renderPdfPage();
    }

    async renderPdfPage() {
        if (!this.currentPdfData[this.currentPdfIndex]) return;

        const pdfData = this.currentPdfData[this.currentPdfIndex];
        this.totalPages = pdfData.pdf.numPages;
        
        this.currentPageSpan.textContent = this.currentPage;
        this.totalPagesSpan.textContent = this.totalPages;
        this.updateZoomInfo();
        
        this.prevPageBtn.disabled = this.currentPage <= 1;
        this.nextPageBtn.disabled = this.currentPage >= this.totalPages;

        try {
            const page = await pdfData.pdf.getPage(this.currentPage);
            const viewport = page.getViewport({ scale: this.currentZoom });
            
            this.pdfCanvas.width = viewport.width;
            this.pdfCanvas.height = viewport.height;
            
            const renderContext = {
                canvasContext: this.pdfCanvas.getContext('2d'),
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            this.updateZoomControls();
        } catch (error) {
            console.error('Error rendering PDF page:', error);
        }
    }

    zoomIn() {
        if (this.currentZoom < this.maxZoom) {
            this.currentZoom = Math.min(this.currentZoom + this.zoomStep, this.maxZoom);
            this.renderPdfPage();
        }
    }

    zoomOut() {
        if (this.currentZoom > this.minZoom) {
            this.currentZoom = Math.max(this.currentZoom - this.zoomStep, this.minZoom);
            this.renderPdfPage();
        }
    }

    async fitToWidth() {
        if (!this.currentPdfData[this.currentPdfIndex]) return;

        try {
            const pdfData = this.currentPdfData[this.currentPdfIndex];
            const page = await pdfData.pdf.getPage(this.currentPage);
            const viewport = page.getViewport({ scale: 1 });
            
            // Calculate scale to fit width (account for margins and scrollbar)
            const containerWidth = this.pdfCanvas.parentElement.parentElement.clientWidth - 40;
            const scale = containerWidth / viewport.width;
            
            this.currentZoom = Math.min(Math.max(scale, this.minZoom), this.maxZoom);
            this.renderPdfPage();
        } catch (error) {
            console.error('Error fitting to width:', error);
        }
    }

    updateZoomInfo() {
        this.zoomInfo.textContent = Math.round(this.currentZoom * 100) + '%';
    }

    updateZoomControls() {
        this.zoomInBtn.disabled = this.currentZoom >= this.maxZoom;
        this.zoomOutBtn.disabled = this.currentZoom <= this.minZoom;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderPdfPage();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderPdfPage();
        }
    }

    // Backend communication methods
    simulateBackendResponse(userMessage) {
        setTimeout(() => {
            this.hideLoading();
            
            if (userMessage.toLowerCase().includes('image') || userMessage.toLowerCase().includes('generate')) {
                this.handleImageResponse(userMessage);
            } else {
                this.handleTextResponse(userMessage);
            }
        }, 2000);
    }

    handleTextResponse(userMessage) {
        const responses = [
            "Based on the uploaded documents and your class settings, here's my analysis for your students...",
            "I've reviewed the content considering your language preferences and class level. Here are my suggestions...",
            "For your class configuration, I recommend the following approach to this topic...",
            "Given the PDF content and your teaching requirements, here's what I found..."
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        this.addMessage(randomResponse, 'bot', null, null, userMessage);
    }

    handleImageResponse(userMessage) {
        const imageUrl = 'https://via.placeholder.com/400x300/667eea/ffffff?text=Generated+Educational+Content';
        const response = "I've created a visual aid for your lesson. This should help explain the concept to your students.";
        this.addMessage(response, 'bot', null, imageUrl, userMessage);
    }

    async sendToBackend(formData) {
        try {
            this.persistentLog('=== BACKEND REQUEST START ===');
            this.persistentLog('FormData contents:');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    this.persistentLog(`${key}: File - ${value.name} (${value.size} bytes)`);
                } else {
                    this.persistentLog(`${key}: ${value}`);
                }
            }

            this.persistentLog('About to send fetch request...');
            this.persistentLog(`Request URL: ${this.BACKEND_URL}/api/chat`);
            
            // Simplify fetch to match working test files
            const response = await fetch(`${this.BACKEND_URL}/api/chat`, {
                method: 'POST',
                body: formData
            });

            this.persistentLog('Fetch request completed successfully');
            this.persistentLog(`Response status: ${response.status}`);
            this.persistentLog(`Response ok: ${response.ok}`);

            if (!response.ok) {
                const errorText = await response.text();
                this.persistentLog(`Response error: ${errorText}`, 'error');
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            // CRITICAL: Parse response very carefully to prevent navigation
            this.persistentLog('About to parse JSON response (critical moment)');
            let data;
            try {
                const responseText = await response.text();
                this.persistentLog('Response text received, parsing JSON...');
                data = JSON.parse(responseText);
                this.persistentLog('JSON parsed successfully');
            } catch (parseError) {
                this.persistentLog(`JSON parse error: ${parseError.message}`, 'error');
                throw new Error('Invalid JSON response from server');
            }
            
            this.persistentLog('Backend response parsed successfully');
            this.persistentLog(`Response data: ${JSON.stringify(data)}`);
            this.persistentLog('=== BACKEND REQUEST END ===');
            return data;
            
        } catch (error) {
            this.persistentLog('=== BACKEND REQUEST ERROR ===', 'error');
            this.persistentLog(`Backend API error: ${error.message}`, 'error');
            
            // Handle different types of errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                return { error: 'Cannot connect to backend server. Please check if the server is running.' };
            }
            
            return { error: 'Failed to connect to backend: ' + error.message };
        }
    }

    handleBackendResponse(response, originalQuestion) {
        console.log('Handling backend response:', response);
        
        if (response.error) {
            console.error('Backend returned error:', response.error);
            this.addMessage('Sorry, there was an error processing your request.', 'bot');
            this.showNotification(response.error, 'error');
            return;
        }

        if (response.text) {
            console.log('Adding text response:', response.text);
            this.addMessage(response.text, 'bot', null, response.image_url || null, originalQuestion);
        }
        
        console.log('Files after response:', this.uploadedFilesList.length);
        console.log('PDF data after response:', this.currentPdfData.length);
    }

    // Utility methods
    showLoading() {
        this.loadingOverlay.style.display = 'flex';
        this.sendButton.disabled = true;
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
        this.sendButton.disabled = false;
    }

    showNotification(message, type = 'info') {
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

        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        notification.style.background = colors[type] || colors.info;

        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

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
}

// Initialize the application
let educationAssistant;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Education Assistant');
    educationAssistant = new EducationAssistantUI();
    
    // Add global error handling
    window.addEventListener('error', (e) => {
        console.error('Global error caught:', e.error);
        console.error('Error message:', e.message);
        console.error('Error filename:', e.filename);
        console.error('Error line:', e.lineno);
    });
    
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        e.preventDefault(); // Prevent the default browser behavior
    });
    
    // Enhanced navigation prevention with more aggressive blocking
    document.addEventListener('submit', (e) => {
        educationAssistant.persistentLog('FORM SUBMISSION DETECTED - PREVENTING:', 'error');
        educationAssistant.persistentLog(`Form element: ${e.target.tagName} ${e.target.id || e.target.className}`, 'error');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    }, true);
    
    // Only prevent actual form submissions, not button clicks
    document.addEventListener('click', (e) => {
        // Exclude our debug buttons from any prevention
        if (e.target.id === 'debugToggleBtn' || 
            e.target.id === 'debugClearBtn' || 
            e.target.id === 'debugLogPanel' ||
            e.target.closest('#debugLogPanel') ||
            e.target.innerHTML.includes('🐛') || 
            e.target.innerHTML.includes('🗑️')) {
            educationAssistant.persistentLog(`Debug button clicked: ${e.target.id || e.target.innerHTML}`);
            return; // Allow debug button clicks
        }
        
        // Allow "Add to Notes" buttons to work
        if (e.target.classList.contains('add-to-canvas-btn') || 
            e.target.closest('.add-to-canvas-btn')) {
            educationAssistant.persistentLog('Add to Notes button clicked - allowing');
            return; // Allow add to canvas button clicks
        }
        
        // Allow the download canvas button to work
        if (e.target.id === 'downloadCanvasBtn' || 
            e.target.closest('#downloadCanvasBtn') ||
            e.target.classList.contains('download-btn') ||
            e.target.closest('.download-btn')) {
            educationAssistant.persistentLog('Download canvas button clicked - allowing');
            return; // Allow download button clicks
        }
        
        // Allow the send button to work normally
        if (e.target.tagName === 'BUTTON' && e.target.id === 'sendButton') {
            educationAssistant.persistentLog('Send button click allowed to proceed normally');
            return; // Allow send button clicks
        }
        
        // Only prevent actual submit type buttons, not our functional buttons
        if (e.target.type === 'submit' && 
            e.target.id !== 'sendButton' && 
            e.target.id !== 'downloadCanvasBtn') {
            educationAssistant.persistentLog('SUBMIT BUTTON CLICKED - PREVENTING', 'error');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }
    }, true);
    
    // Note: Commenting out beforeunload to prevent navigation interference
    /*
    window.addEventListener('beforeunload', (e) => {
        console.log('Before unload event triggered');
        // Only show warning if user has uploaded files and we're not intentionally navigating
        if (educationAssistant && educationAssistant.uploadedFilesList.length > 0) {
            console.log('Warning user about navigation with uploaded files');
        }
    });
    */
    
    console.log('Education Assistant initialized successfully');
    
    // Add page visibility monitoring to detect navigation
    document.addEventListener('visibilitychange', () => {
        if (educationAssistant) {
            educationAssistant.persistentLog(`Page visibility changed: ${document.hidden ? 'hidden' : 'visible'}`);
        }
    });
    
    // Monitor page unload without preventing it
    window.addEventListener('pagehide', (e) => {
        if (educationAssistant) {
            educationAssistant.persistentLog('Page hide event triggered');
        }
    });
    
    window.addEventListener('pageshow', (e) => {
        if (educationAssistant) {
            educationAssistant.persistentLog('Page show event triggered');
        }
    });
});
