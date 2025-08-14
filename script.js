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
        
        // Mobile form elements
        this.mobileTeacherLanguage = document.getElementById('mobileTeacherLanguage');
        this.mobileStudentLanguage = document.getElementById('mobileStudentLanguage');
        this.mobileClassLevel = document.getElementById('mobileClassLevel');
        this.mobileClassStrength = document.getElementById('mobileClassStrength');
        
        // Mobile navigation elements
        this.mobileNav = document.getElementById('mobileNav');
        this.mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
        this.panels = {
            pdfPanel: document.getElementById('pdfPanel'),
            notesPanel: document.getElementById('notesPanel'),
            chatPanel: document.getElementById('chatPanel')
        };
        
        // Mobile settings elements
        this.mobileSettingsToggle = document.getElementById('mobileSettingsToggle');
        this.settingsOverlay = document.getElementById('settingsOverlay');
        this.settingsClose = document.getElementById('settingsClose');
        this.mobileUploadArea = document.getElementById('mobileUploadArea');
        
        // Other elements
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        // Initialize mobile navigation
        this.initializeMobileNavigation();
        this.initializeMobileSettings();
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

    // Mobile Navigation Methods
    initializeMobileNavigation() {
        if (!this.mobileNavBtns || this.mobileNavBtns.length === 0) return;
        
        this.mobileNavBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const panelId = btn.getAttribute('data-panel');
                this.switchToPanel(panelId);
                
                // Update active button
                this.mobileNavBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }
    
    switchToPanel(panelId) {
        // Hide all panels
        Object.values(this.panels).forEach(panel => {
            if (panel) panel.classList.remove('active');
        });
        
        // Show selected panel
        if (this.panels[panelId]) {
            this.panels[panelId].classList.add('active');
        }
        
        this.persistentLog(`Switched to panel: ${panelId}`);
    }
    
    // Mobile Settings Methods
    initializeMobileSettings() {
        if (!this.mobileSettingsToggle || !this.settingsOverlay) return;
        
        // Settings toggle button
        this.mobileSettingsToggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.openMobileSettings();
        });
        
        // Settings close button
        this.settingsClose.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeMobileSettings();
        });
        
        // Close on overlay click
        this.settingsOverlay.addEventListener('click', (e) => {
            if (e.target === this.settingsOverlay) {
                this.closeMobileSettings();
            }
        });
        
        // Handle escape key to close settings
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.settingsOverlay.classList.contains('active')) {
                this.closeMobileSettings();
            }
        });
        
        // Mobile upload area
        this.mobileUploadArea.addEventListener('click', (e) => {
            e.preventDefault();
            this.triggerFileUpload();
        });
        
        // Sync mobile and desktop form values
        this.syncFormValues();
        this.setupFormSync();
    }
    
    openMobileSettings() {
        this.settingsOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.persistentLog('Mobile settings opened');
    }
    
    closeMobileSettings() {
        this.settingsOverlay.classList.remove('active');
        document.body.style.overflow = '';
        this.persistentLog('Mobile settings closed');
    }
    
    triggerFileUpload() {
        this.persistentLog('Triggering file upload from mobile');
        try {
            this.pdfInput.click();
        } catch (error) {
            this.persistentLog(`Error triggering file upload: ${error.message}`, 'error');
        }
    }
    
    syncFormValues() {
        // Sync from desktop to mobile on load
        if (this.teacherLanguage && this.mobileTeacherLanguage) {
            this.mobileTeacherLanguage.value = this.teacherLanguage.value;
        }
        if (this.studentLanguage && this.mobileStudentLanguage) {
            this.mobileStudentLanguage.value = this.studentLanguage.value;
        }
        if (this.classLevel && this.mobileClassLevel) {
            this.mobileClassLevel.value = this.classLevel.value;
        }
        if (this.classStrength && this.mobileClassStrength) {
            this.mobileClassStrength.value = this.classStrength.value;
        }
    }
    
    setupFormSync() {
        // Sync desktop to mobile
        if (this.teacherLanguage && this.mobileTeacherLanguage) {
            this.teacherLanguage.addEventListener('change', () => {
                this.mobileTeacherLanguage.value = this.teacherLanguage.value;
            });
        }
        if (this.studentLanguage && this.mobileStudentLanguage) {
            this.studentLanguage.addEventListener('change', () => {
                this.mobileStudentLanguage.value = this.studentLanguage.value;
            });
        }
        if (this.classLevel && this.mobileClassLevel) {
            this.classLevel.addEventListener('change', () => {
                this.mobileClassLevel.value = this.classLevel.value;
            });
        }
        if (this.classStrength && this.mobileClassStrength) {
            this.classStrength.addEventListener('change', () => {
                this.mobileClassStrength.value = this.classStrength.value;
            });
        }
        
        // Sync mobile to desktop
        if (this.mobileTeacherLanguage && this.teacherLanguage) {
            this.mobileTeacherLanguage.addEventListener('change', () => {
                this.teacherLanguage.value = this.mobileTeacherLanguage.value;
            });
        }
        if (this.mobileStudentLanguage && this.studentLanguage) {
            this.mobileStudentLanguage.addEventListener('change', () => {
                this.studentLanguage.value = this.mobileStudentLanguage.value;
            });
        }
        if (this.mobileClassLevel && this.classLevel) {
            this.mobileClassLevel.addEventListener('change', () => {
                this.classLevel.value = this.mobileClassLevel.value;
            });
        }
        if (this.mobileClassStrength && this.classStrength) {
            this.mobileClassStrength.addEventListener('change', () => {
                this.classStrength.value = this.mobileClassStrength.value;
            });
        }
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
        
        // Add dropdown values - use mobile values if available, desktop otherwise
        const teacherLang = (this.mobileTeacherLanguage?.value) || this.teacherLanguage.value;
        const studentLang = (this.mobileStudentLanguage?.value) || this.studentLanguage.value;
        const classLvl = (this.mobileClassLevel?.value) || this.classLevel.value;
        const classStr = (this.mobileClassStrength?.value) || this.classStrength.value;
        
        formData.append('teacher_language', teacherLang);
        formData.append('student_language', studentLang);
        formData.append('class_level', classLvl);
        formData.append('class_strength', classStr);

        console.log('Payload being sent:', {
            message: message,
            fileCount: this.uploadedFilesList.length,
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            teacherLanguage: teacherLang,
            studentLanguage: studentLang,
            classLevel: classLvl,
            classStrength: classStr
        });

        return formData;
    }

    addMessage(content, sender, timestamp = null, imageUrl = null, originalQuestion = null, isHtml = false, plainText = null, imageData = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Add text content - use innerHTML for HTML content, textContent for plain text
        const textDiv = document.createElement('p');
        if (isHtml) {
            textDiv.innerHTML = content;
        } else {
            textDiv.textContent = content;
        }
        contentDiv.appendChild(textDiv);
        
        // Add image if provided
        if (imageUrl) {
            console.log('🎨 Adding image to message:', imageUrl);
            console.log('🎨 Image data:', imageData);
            this.persistentLog(`🎨 CREATING IMAGE ELEMENT: ${imageUrl}`);
            
            const imageDiv = document.createElement('div');
            imageDiv.className = 'message-image';
            
            // Add image description if available
            if (imageData && imageData.description) {
                const imageCaption = document.createElement('div');
                imageCaption.className = 'image-caption';
                imageCaption.innerHTML = `<strong>Generated Image:</strong> ${imageData.description}`;
                imageCaption.style.cssText = 'font-size: 0.9em; color: #666; margin-bottom: 8px; font-style: italic;';
                imageDiv.appendChild(imageCaption);
            }
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = imageData ? `Generated: ${imageData.description}` : 'AI Generated Image';
            img.style.cssText = 'max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.15); cursor: pointer;';
            
            console.log('🖼️ Image element created with src:', img.src);
            this.persistentLog(`🖼️ IMAGE ELEMENT CREATED: ${img.src}`);
            
            // Add error handling for image loading
            img.onload = () => {
                console.log('✅ Image loaded successfully:', imageUrl);
                chatApp.persistentLog(`✅ Image loaded successfully: ${imageUrl}`);
            };
            img.onerror = (error) => {
                console.error('❌ Image failed to load:', imageUrl);
                console.error('Error details:', error);
                console.error('Image naturalWidth:', img.naturalWidth);
                console.error('Image naturalHeight:', img.naturalHeight);
                console.error('Image complete:', img.complete);
                
                // Log more details for debugging
                chatApp.persistentLog(`❌ IMAGE LOAD FAILED: ${imageUrl}`);
                chatApp.persistentLog(`Error type: ${error.type || 'unknown'}`);
                chatApp.persistentLog(`Image complete: ${img.complete}`);
                chatApp.persistentLog(`Natural dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
                
                // Try to determine the error type
                const errorMessage = img.complete && img.naturalHeight === 0 ? 
                    'Image URL is invalid or unreachable (possibly CORS issue)' : 
                    'Image failed to load (network or server issue)';
                
                img.style.display = 'none';
                const errorDiv = document.createElement('div');
                errorDiv.innerHTML = `❌ ${errorMessage}<br><small>URL: ${imageUrl}</small>`;
                errorDiv.style.cssText = 'color: #dc3545; font-style: italic; padding: 10px; border: 1px dashed #dc3545; border-radius: 4px; font-size: 12px; word-break: break-all;';
                imageDiv.appendChild(errorDiv);
            };
            
            // Add click handler to view full size
            img.addEventListener('click', () => {
                this.showImageModal(imageUrl, imageData);
            });
            
            imageDiv.appendChild(img);
            contentDiv.appendChild(imageDiv);
            console.log('✅ Image div appended to content. Image div HTML:', imageDiv.outerHTML);
            this.persistentLog('✅ IMAGE DIV APPENDED TO CONTENT');
            this.persistentLog(`Image div classes: ${imageDiv.className}`);
            this.persistentLog(`Content div children count: ${contentDiv.children.length}`);
        } else {
            console.log('❌ No imageUrl provided to addMessage function');
            this.persistentLog('❌ NO IMAGE URL PROVIDED TO addMessage');
        }
        
        // Add "Add to Canvas" button for bot messages
        if (sender === 'bot') {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            
            const addToCanvasBtn = document.createElement('button');
            addToCanvasBtn.className = 'add-to-canvas-btn';
            addToCanvasBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Notes';
            // Use plain text for PDF, but content for display
            const textForPdf = plainText || content;
            addToCanvasBtn.onclick = () => this.addToCanvas(content, imageUrl, originalQuestion, textForPdf, imageData);
            
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
            imageData, // Store full image data
            originalQuestion
        });
        
        console.log('✅ Message added to chat history with imageUrl:', imageUrl);
    }

    // Utility function to convert HTML to plain text
    htmlToPlainText(html) {
        // Create a temporary div element
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        // Get text content and clean up extra whitespace
        return tempDiv.textContent || tempDiv.innerText || '';
    }

    addToCanvas(response, imageUrl = null, question = null, plainTextResponse = null, imageData = null) {
        const canvasItem = {
            id: Date.now(),
            question: question || this.getLastUserMessage(),
            response: response, // HTML version for display
            plainTextResponse: plainTextResponse || response, // Plain text version for PDF
            imageUrl: imageUrl,
            imageData: imageData, // Store full image data including description
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
            
            // Create header
            const headerDiv = document.createElement('div');
            headerDiv.className = 'canvas-item-header';
            headerDiv.innerHTML = `
                <span>Note ${index + 1} - ${item.timestamp}</span>
                <button class="canvas-remove-btn" onclick="educationAssistant.removeFromCanvas(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            // Create question div
            const questionDiv = document.createElement('div');
            questionDiv.className = 'canvas-item-question';
            questionDiv.innerHTML = `<strong>Q:</strong> ${item.question}`;
            
            // Create response div with HTML content
            const responseDiv = document.createElement('div');
            responseDiv.className = 'canvas-item-response';
            const responseContent = document.createElement('div');
            responseContent.innerHTML = `<strong>A:</strong> ${item.response}`;
            responseDiv.appendChild(responseContent);
            
            // Add components to item
            itemDiv.appendChild(headerDiv);
            itemDiv.appendChild(questionDiv);
            itemDiv.appendChild(responseDiv);
            
            // Add image if present
            if (item.imageUrl) {
                const imageDiv = document.createElement('div');
                imageDiv.className = 'canvas-item-image';
                
                // Add image description if available
                let imageHTML = '';
                if (item.imageData && item.imageData.description) {
                    imageHTML += `<div class="image-description" style="font-size: 0.9em; color: #666; margin-bottom: 8px; font-style: italic;"><strong>Generated Image:</strong> ${item.imageData.description}</div>`;
                }
                
                imageHTML += `<img src="${item.imageUrl}" alt="${item.imageData && item.imageData.description ? `Generated: ${item.imageData.description}` : 'AI Generated Image'}" style="max-width: 100%; height: auto; border-radius: 6px; cursor: pointer;" onclick="educationAssistant.showImageModal('${item.imageUrl}', ${item.imageData ? JSON.stringify(item.imageData).replace(/"/g, '&quot;') : 'null'})">`;
                
                imageDiv.innerHTML = imageHTML;
                itemDiv.appendChild(imageDiv);
            }
            
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

        // Show loading notification
        this.showNotification('Generating formatted PDF...', 'info');

        try {
            // Try HTML2Canvas + jsPDF approach for formatted output
            await this.downloadFormattedPdf();
        } catch (error) {
            console.error('Formatted PDF generation failed, falling back to text PDF:', error);
            this.persistentLog(`Formatted PDF failed: ${error.message}`, 'error');
            this.showNotification('Formatted PDF failed, using text version...', 'warning');
            
            // Fallback to text-based PDF
            await this.downloadTextPdf();
        }
    }

    async downloadFormattedPdf() {
        console.log('=== FORMATTED PDF GENERATION START ===');
        
        // Check if required libraries are available
        if (typeof window.html2canvas === 'undefined') {
            throw new Error('html2canvas library not loaded');
        }
        
        if (typeof window.jspdf === 'undefined') {
            throw new Error('jsPDF library not loaded');
        }

        const { jsPDF } = window.jspdf;
        
        // Create a temporary container with the formatted content
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: 800px;
            background: white;
            padding: 40px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
        `;
        
        // Add title
        const titleDiv = document.createElement('div');
        titleDiv.innerHTML = `
            <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px; font-size: 24px;">
                🎓 AI Education Assistant - Notes
            </h1>
            <hr style="border: none; border-top: 2px solid #e9ecef; margin-bottom: 30px;">
        `;
        tempContainer.appendChild(titleDiv);
        
        // Add each canvas item with formatting
        this.canvasItems.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = `
                margin-bottom: 40px;
                page-break-inside: avoid;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 20px;
                background: #f8f9fa;
            `;
            
            // Note header
            const headerDiv = document.createElement('div');
            headerDiv.innerHTML = `
                <h2 style="color: #495057; font-size: 16px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 1px solid #dee2e6;">
                    📝 Note ${index + 1} - ${item.timestamp}
                </h2>
            `;
            
            // Question
            const questionDiv = document.createElement('div');
            questionDiv.innerHTML = `
                <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #2196f3;">
                    <strong style="color: #1565c0;">Q:</strong> ${item.question}
                </div>
            `;
            
            // Answer with HTML formatting
            const answerDiv = document.createElement('div');
            answerDiv.innerHTML = `
                <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #4caf50;">
                    <strong style="color: #2e7d32;">A:</strong> ${item.response}
                </div>
            `;
            
            itemDiv.appendChild(headerDiv);
            itemDiv.appendChild(questionDiv);
            itemDiv.appendChild(answerDiv);
            
            // Add image if present
            if (item.imageUrl) {
                const imageDiv = document.createElement('div');
                let imageHTML = '';
                
                // Add image description if available
                if (item.imageData && item.imageData.description) {
                    imageHTML += `
                        <div style="margin-top: 15px; text-align: center; font-size: 14px; color: #666; font-style: italic; margin-bottom: 8px;">
                            <strong>Generated Image:</strong> ${item.imageData.description}
                        </div>
                    `;
                }
                
                imageHTML += `
                    <div style="margin-top: 15px; text-align: center;">
                        <img src="${item.imageUrl}" style="max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="${item.imageData && item.imageData.description ? `Generated: ${item.imageData.description}` : 'AI Generated Image'}">
                    </div>
                `;
                
                imageDiv.innerHTML = imageHTML;
                itemDiv.appendChild(imageDiv);
            }
            
            tempContainer.appendChild(itemDiv);
        });
        
        // Add footer
        const footerDiv = document.createElement('div');
        footerDiv.innerHTML = `
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0 20px 0;">
            <p style="text-align: center; color: #6c757d; font-size: 12px; margin: 0;">
                Generated on ${new Date().toLocaleString()} | AI Education Assistant
            </p>
        `;
        tempContainer.appendChild(footerDiv);
        
        // Add to DOM temporarily
        document.body.appendChild(tempContainer);
        
        try {
            console.log('Capturing HTML content with html2canvas...');
            
            // Capture the container as canvas
            const canvas = await html2canvas(tempContainer, {
                scale: 2, // Higher resolution
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                height: tempContainer.scrollHeight,
                width: tempContainer.scrollWidth
            });
            
            console.log('HTML captured, generating PDF...');
            
            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            
            // Calculate dimensions
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth - 20; // 10mm margin on each side
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let yPosition = 10; // Start position
            
            if (imgHeight <= pdfHeight - 20) {
                // Fits on one page
                pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
            } else {
                // Split across multiple pages
                const pageHeight = pdfHeight - 20; // Account for margins
                let remainingHeight = imgHeight;
                let sourceY = 0;
                
                while (remainingHeight > 0) {
                    const currentPageHeight = Math.min(pageHeight, remainingHeight);
                    const sourceHeight = (currentPageHeight * canvas.height) / imgHeight;
                    
                    // Create a temporary canvas for this page section
                    const pageCanvas = document.createElement('canvas');
                    pageCanvas.width = canvas.width;
                    pageCanvas.height = sourceHeight;
                    
                    const pageCtx = pageCanvas.getContext('2d');
                    pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
                    
                    const pageImgData = pageCanvas.toDataURL('image/png');
                    pdf.addImage(pageImgData, 'PNG', 10, 10, imgWidth, currentPageHeight);
                    
                    remainingHeight -= currentPageHeight;
                    sourceY += sourceHeight;
                    
                    if (remainingHeight > 0) {
                        pdf.addPage();
                    }
                }
            }
            
            // Save the PDF
            const fileName = `AI_Education_Notes_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            
            console.log('Formatted PDF generated successfully');
            this.showNotification('Formatted PDF downloaded successfully!', 'success');
            
        } finally {
            // Clean up
            document.body.removeChild(tempContainer);
        }
    }

    async downloadTextPdf() {
        console.log('=== TEXT PDF GENERATION START ===');
        this.persistentLog('Text PDF generation as fallback');
        
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

                // Answer - use plain text version for PDF, with HTML fallback conversion
                pdf.setFont(undefined, 'normal');
                let plainResponse = item.plainTextResponse;
                if (!plainResponse && item.response) {
                    // Fallback: convert HTML to plain text
                    plainResponse = this.htmlToPlainText(item.response);
                }
                const responseText = `A: ${plainResponse || item.response}`;
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
            this.persistentLog(`Response data keys: ${Object.keys(data)}`);
            
            // Log the complete response in a more readable format
            console.log('📥 COMPLETE BACKEND RESPONSE:');
            console.log('Text:', data.text ? data.text.substring(0, 100) + '...' : 'No text');
            console.log('HTML:', data.html ? 'Present' : 'Not present');
            console.log('Generated Image:', data.generated_image);
            
            if (data.generated_image) {
                console.log('🎨 IMAGE URL:', data.generated_image.image_url);
                console.log('🎨 IMAGE DESCRIPTION:', data.generated_image.description);
                this.persistentLog(`🎨 GENERATED IMAGE FOUND: ${data.generated_image.image_url}`);
            } else {
                this.persistentLog('❌ No generated_image field in response');
                console.log('Available fields:', Object.keys(data));
            }
            
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
        console.log('🔍 handleBackendResponse called with:', response);
        console.log('🔍 Response type:', typeof response);
        console.log('🔍 Response keys:', Object.keys(response));
        
        if (response.error) {
            console.error('Backend returned error:', response.error);
            this.addMessage('Sorry, there was an error processing your request.', 'bot');
            this.showNotification(response.error, 'error');
            return;
        }

        if (response.text) {
            console.log('Adding text response:', response.text);
            console.log('Full response object:', response);
            
            // Check if there's an image generation happening
            if (response.generated_image) {
                console.log('🎨 Image generation detected in response!');
                console.log('🎨 Image data:', response.generated_image);
            } else {
                console.log('❌ No generated_image in response');
            }
            
            // Use HTML version if available, otherwise fall back to text
            const content = response.html || response.text;
            const isHtml = !!response.html;
            // Store both HTML and plain text for canvas functionality
            const plainText = response.text;
            
            // Check for generated image in the new format
            let imageUrl = null;
            let imageData = null;
            if (response.generated_image && response.generated_image.image_url) {
                // Prefer local URL if available, fall back to DALL-E URL
                imageUrl = response.generated_image.local_url || response.generated_image.image_url;
                imageData = response.generated_image;
                console.log('✅ Generated image detected:', imageData);
                console.log('✅ Image URL (preferring local):', imageUrl);
                
                if (response.generated_image.local_url) {
                    console.log('🏠 Using local image URL:', response.generated_image.local_url);
                    this.persistentLog(`🏠 USING LOCAL IMAGE: ${response.generated_image.local_url}`);
                } else {
                    console.log('🌐 Using DALL-E URL (no local copy):', response.generated_image.image_url);
                    this.persistentLog(`🌐 USING DALLE URL: ${response.generated_image.image_url}`);
                }
            } else if (response.image_url) {
                // Fallback to old format
                imageUrl = response.image_url;
                console.log('✅ Old format image URL detected:', imageUrl);
            } else {
                console.log('❌ No image found in response');
                console.log('Response keys:', Object.keys(response));
            }
            
            console.log('Final imageUrl for addMessage:', imageUrl);
            console.log('Final imageData for addMessage:', imageData);
            
            // Add visual indicator if image should be displayed
            if (imageUrl) {
                console.log('🖼️ IMAGE SHOULD BE DISPLAYED!', imageUrl);
                // Add temporary notification
                this.showNotification(`Image detected: ${imageUrl.substring(0, 50)}...`, 'info');
            } else {
                console.log('❌ NO IMAGE TO DISPLAY');
            }
            
            this.addMessage(content, 'bot', null, imageUrl, originalQuestion, isHtml, plainText, imageData);
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

    // Test function to manually add an image for debugging
    showImageModal(imageUrl, imageData = null) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            cursor: pointer;
        `;

        // Create content container
        const content = document.createElement('div');
        content.style.cssText = `
            max-width: 90vw;
            max-height: 90vh;
            background: white;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;
        content.addEventListener('click', (e) => e.stopPropagation());

        // Add image
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.cssText = `
            max-width: 100%;
            max-height: 70vh;
            border-radius: 8px;
            margin-bottom: 15px;
        `;

        // Add description if available
        if (imageData && imageData.description) {
            const description = document.createElement('div');
            description.innerHTML = `<strong>Generated Image:</strong> ${imageData.description}`;
            description.style.cssText = `
                font-size: 1.1em;
                color: #333;
                margin-bottom: 15px;
                font-weight: 500;
            `;
            content.appendChild(description);
        }

        content.appendChild(img);

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕ Close';
        closeBtn.style.cssText = `
            background: #6c757d;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 10px;
        `;
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        content.appendChild(closeBtn);
        modal.appendChild(content);

        // Close on overlay click
        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        document.body.appendChild(modal);
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

        // Allow PDF navigation and zoom buttons to work
        if (e.target.id === 'prevPage' || 
            e.target.id === 'nextPage' || 
            e.target.id === 'zoomIn' || 
            e.target.id === 'zoomOut' || 
            e.target.id === 'fitToWidth') {
            educationAssistant.persistentLog(`PDF control button clicked: ${e.target.id}`);
            return; // Allow PDF control button clicks
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
