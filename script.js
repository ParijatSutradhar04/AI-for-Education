class EducationAssistantUI {
    constructor() {
        // Initialize persistent logging first
        this.initializePersistentLogging();
        this.persistentLog('=== EDUCATION ASSISTANT UI STARTING ===');
        
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
        
        this.persistentLog('Education Assistant UI initialized successfully');
    }

    initializePersistentLogging() {
        // Create a persistent logging system that survives page refreshes
        this.logKey = 'educationAssistant_logs';
        this.maxLogs = 100; // Keep last 100 log entries
        
        // Load existing logs
        this.loadLogs();
        
        // Create visible log panel
        this.createLogPanel();
    }
    
    persistentLog(message, type = 'log') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            message,
            type
        };
        
        // Store in memory
        if (!this.logs) this.logs = [];
        this.logs.push(logEntry);
        
        // Keep only recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        
        // Store in localStorage
        this.saveLogs();
        
        // Display in console
        const formattedMessage = `[${timestamp}] ${message}`;
        if (type === 'error') {
            console.error(formattedMessage);
        } else {
            console.log(formattedMessage);
        }
        
        // Update log panel
        this.updateLogPanel();
    }
    
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
        // Create a floating log panel for debugging
        this.logPanel = document.createElement('div');
        this.logPanel.id = 'debugLogPanel';
        this.logPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 450px;
            height: 200px;
            background: rgba(0, 0, 0, 0.95);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            padding: 15px;
            border-radius: 8px;
            z-index: 10000;
            overflow-y: auto;
            display: block;
            border: 2px solid #00ff00;
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
            backdrop-filter: blur(5px);
        `;
        
        // Add header to the log panel
        const header = document.createElement('div');
        header.innerHTML = '🐛 DEBUG LOGS - Application Activity Monitor';
        header.style.cssText = `
            color: #ffff00;
            font-weight: bold;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #333;
            text-align: center;
        `;
        this.logPanel.appendChild(header);
        
        // Create content area
        this.logContent = document.createElement('div');
        this.logContent.id = 'logContent';
        this.logPanel.appendChild(this.logContent);
        
        // Add toggle button
        this.logToggle = document.createElement('button');
        this.logToggle.innerHTML = '🐛 DEBUG LOGS';
        this.logToggle.title = 'Toggle Debug Logs - Click to see application logs';
        this.logToggle.id = 'debugToggleBtn';
        this.logToggle.style.cssText = `
            position: fixed;
            bottom: 220px;
            right: 10px;
            padding: 8px 15px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            border: 2px solid #00ff00;
            border-radius: 8px;
            cursor: pointer;
            z-index: 10001;
            font-size: 12px;
            font-family: monospace;
            font-weight: bold;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
            transition: all 0.2s ease;
        `;
        
        this.logToggle.onmouseover = () => {
            this.logToggle.style.background = 'rgba(0, 255, 0, 0.2)';
            this.logToggle.style.transform = 'scale(1.05)';
        };
        
        this.logToggle.onmouseout = () => {
            this.logToggle.style.background = 'rgba(0, 0, 0, 0.9)';
            this.logToggle.style.transform = 'scale(1.0)';
        };
        
        this.logToggle.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isVisible = this.logPanel.style.display !== 'none';
            this.logPanel.style.display = isVisible ? 'none' : 'block';
            this.logToggle.innerHTML = isVisible ? '🐛 DEBUG LOGS' : '🐛 HIDE LOGS';
            this.persistentLog(`Debug panel ${isVisible ? 'hidden' : 'shown'}`);
        };
        
        // Add clear button
        this.clearLogBtn = document.createElement('button');
        this.clearLogBtn.innerHTML = '🗑️ CLEAR';
        this.clearLogBtn.title = 'Clear Debug Logs';
        this.clearLogBtn.id = 'debugClearBtn';
        this.clearLogBtn.style.cssText = `
            position: fixed;
            bottom: 220px;
            right: 150px;
            padding: 8px 12px;
            background: rgba(0, 0, 0, 0.9);
            color: #ff4444;
            border: 2px solid #ff4444;
            border-radius: 8px;
            cursor: pointer;
            z-index: 10001;
            font-size: 10px;
            font-family: monospace;
            font-weight: bold;
            transition: all 0.2s ease;
        `;
        
        this.clearLogBtn.onmouseover = () => {
            this.clearLogBtn.style.background = 'rgba(255, 68, 68, 0.2)';
        };
        
        this.clearLogBtn.onmouseout = () => {
            this.clearLogBtn.style.background = 'rgba(0, 0, 0, 0.9)';
        };
        
        this.clearLogBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.clearLogs();
        };
        
        document.body.appendChild(this.logPanel);
        document.body.appendChild(this.logToggle);
        document.body.appendChild(this.clearLogBtn);
        
        this.updateLogPanel();
    }
    
    updateLogPanel() {
        if (!this.logContent || !this.logs) return;
        
        const logHtml = this.logs.slice(-25).map(log => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            const color = log.type === 'error' ? '#ff4444' : '#00ff00';
            return `<div style="color: ${color}; margin-bottom: 3px; padding: 2px; border-left: 2px solid ${color}; padding-left: 8px;">[${time}] ${log.message}</div>`;
        }).join('');
        
        this.logContent.innerHTML = logHtml;
        this.logPanel.scrollTop = this.logPanel.scrollHeight;
    }
    
    clearLogs() {
        this.logs = [];
        this.saveLogs();
        this.updateLogPanel();
        this.persistentLog('Debug logs cleared');
    }

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
            e.preventDefault();
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
            e.preventDefault();
            this.downloadCanvasPdf();
        });
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        try {
            const message = this.messageInput.value.trim();
            if (!message) return;

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
            
        } catch (error) {
            this.persistentLog('=== ERROR IN SEND MESSAGE ===', 'error');
            this.persistentLog(`Error sending message to backend: ${error.message}`, 'error');
            this.addMessage('Sorry, there was an error processing your request. Please try again.', 'bot');
            this.showNotification('Failed to connect to backend', 'error');
            this.hideLoading();
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
        if (this.canvasItems.length === 0) {
            this.showNotification('No notes to download', 'warning');
            return;
        }

        try {
            const { jsPDF } = window.jspdf || {};
            if (!jsPDF) {
                // Fallback: download as HTML
                this.downloadAsHtml();
                return;
            }

            const pdf = new jsPDF();
            let yPosition = 20;

            // Add title
            pdf.setFontSize(16);
            pdf.text('AI Education Assistant - Notes', 20, yPosition);
            yPosition += 20;

            this.canvasItems.forEach((item, index) => {
                // Check if we need a new page
                if (yPosition > 250) {
                    pdf.addPage();
                    yPosition = 20;
                }

                pdf.setFontSize(12);
                pdf.text(`Note ${index + 1} - ${item.timestamp}`, 20, yPosition);
                yPosition += 15;

                pdf.setFontSize(10);
                const questionLines = pdf.splitTextToSize(`Q: ${item.question}`, 170);
                pdf.text(questionLines, 20, yPosition);
                yPosition += questionLines.length * 5 + 5;

                const responseLines = pdf.splitTextToSize(`A: ${item.response}`, 170);
                pdf.text(responseLines, 20, yPosition);
                yPosition += responseLines.length * 5 + 15;
            });

            pdf.save('ai-education-notes.pdf');
            this.showNotification('PDF downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.downloadAsHtml();
        }
    }

    downloadAsHtml() {
        let htmlContent = `
            <html>
            <head>
                <title>AI Education Assistant - Notes</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .note { margin-bottom: 30px; padding: 20px; border-left: 4px solid #667eea; background: #f8f9ff; }
                    .question { background: #e3f2fd; padding: 10px; margin-bottom: 10px; border-radius: 5px; }
                    .response { line-height: 1.6; }
                    .timestamp { font-size: 12px; color: #666; margin-bottom: 10px; }
                </style>
            </head>
            <body>
                <h1>AI Education Assistant - Notes</h1>
        `;

        this.canvasItems.forEach((item, index) => {
            htmlContent += `
                <div class="note">
                    <div class="timestamp">Note ${index + 1} - ${item.timestamp}</div>
                    <div class="question"><strong>Q:</strong> ${item.question}</div>
                    <div class="response"><strong>A:</strong> ${item.response}</div>
                </div>
            `;
        });

        htmlContent += '</body></html>';

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-education-notes.html';
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Notes downloaded as HTML!', 'success');
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
                await this.loadPdfPreview(file);
                this.showNotification(`Successfully uploaded: ${file.name}`, 'success');
            } else {
                this.showNotification('Only PDF files are supported', 'error');
            }
        }
        
        this.updatePdfSelector();
        this.showPdfPreview();
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

            // Test basic connectivity first
            this.persistentLog('Testing basic connectivity to backend...');
            try {
                const testResponse = await fetch('http://localhost:5000/', {
                    method: 'GET'
                });
                this.persistentLog(`Basic connectivity test: ${testResponse.status} ${testResponse.statusText}`);
            } catch (testError) {
                this.persistentLog(`Basic connectivity failed: ${testError.message}`, 'error');
                return { error: 'Cannot connect to backend server' };
            }

            this.persistentLog('About to send fetch request...');
            this.persistentLog(`Request URL: http://localhost:5000/api/chat`);
            
            const response = await fetch('http://localhost:5000/api/chat', {
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

            const data = await response.json();
            this.persistentLog('Backend response parsed successfully');
            this.persistentLog(`Response data: ${JSON.stringify(data)}`);
            this.persistentLog('=== BACKEND REQUEST END ===');
            return data;
            
        } catch (error) {
            this.persistentLog('=== BACKEND REQUEST ERROR ===', 'error');
            this.persistentLog(`Backend API error: ${error.message}`, 'error');
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
    
    // Prevent any clicks on buttons that might submit forms
    document.addEventListener('click', (e) => {
        // Exclude our debug buttons from prevention
        if (e.target.id === 'debugToggleBtn' || 
            e.target.id === 'debugClearBtn' || 
            e.target.id === 'debugLogPanel' ||
            e.target.closest('#debugLogPanel') ||
            e.target.innerHTML.includes('🐛') || 
            e.target.innerHTML.includes('🗑️')) {
            educationAssistant.persistentLog(`Debug button clicked: ${e.target.id || e.target.innerHTML}`);
            return; // Allow debug button clicks
        }
        
        if (e.target.type === 'submit') {
            educationAssistant.persistentLog('SUBMIT BUTTON CLICKED - PREVENTING', 'error');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }
        
        // Prevent any navigation on buttons
        if (e.target.tagName === 'BUTTON' && e.target.id === 'sendButton') {
            educationAssistant.persistentLog('Send button click detected in document listener', 'error');
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
