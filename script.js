// Client-side routing for GitHub Pages
(function() {
    'use strict';
    
    // Text-to-Speech functionality using Web Speech API
    let speechSynthesis = window.speechSynthesis;
    let currentUtterance = null;
    let isPaused = false;
    
    // TTS Control functions
    function initializeTTS() {
        const playBtn = document.getElementById('tts-play-btn');
        const pauseBtn = document.getElementById('tts-pause-btn');
        const stopBtn = document.getElementById('tts-stop-btn');
        
        if (playBtn) {
            playBtn.addEventListener('click', playText);
        }
        if (pauseBtn) {
            pauseBtn.addEventListener('click', pauseText);
        }
        if (stopBtn) {
            stopBtn.addEventListener('click', stopText);
        }
    }
    
    function playText() {
        const textContent = document.getElementById('text-content');
        const playBtn = document.getElementById('tts-play-btn');
        const pauseBtn = document.getElementById('tts-pause-btn');
        const stopBtn = document.getElementById('tts-stop-btn');
        
        if (!textContent || !textContent.textContent.trim()) {
            // Show error in the UI instead of alert
            const controls = document.getElementById('tts-controls');
            const errorMsg = document.createElement('div');
            errorMsg.style.color = '#e74c3c';
            errorMsg.style.marginTop = '10px';
            errorMsg.style.fontSize = '0.9rem';
            errorMsg.textContent = 'Kein Text zum Vorlesen gefunden.';
            controls.appendChild(errorMsg);
            setTimeout(() => errorMsg.remove(), 3000);
            return;
        }
        
        // If paused, resume
        if (isPaused && currentUtterance) {
            speechSynthesis.resume();
            isPaused = false;
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-block';
            stopBtn.style.display = 'inline-block';
            return;
        }
        
        // Stop any ongoing speech
        speechSynthesis.cancel();
        
        // Create new utterance
        currentUtterance = new SpeechSynthesisUtterance(textContent.textContent);
        
        // Set German as the default language
        currentUtterance.lang = 'de-DE';
        
        // Try to find a German voice (voices should be loaded by now)
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            const germanVoice = voices.find(voice => voice.lang.startsWith('de'));
            if (germanVoice) {
                currentUtterance.voice = germanVoice;
            }
        }
        
        // Set speech parameters
        currentUtterance.rate = 0.9; // Slightly slower for better comprehension
        currentUtterance.pitch = 1.0;
        currentUtterance.volume = 1.0;
        
        // Event handlers
        currentUtterance.onstart = function() {
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-block';
            stopBtn.style.display = 'inline-block';
        };
        
        currentUtterance.onend = function() {
            playBtn.style.display = 'inline-block';
            pauseBtn.style.display = 'none';
            stopBtn.style.display = 'none';
            isPaused = false;
            currentUtterance = null;
        };
        
        currentUtterance.onerror = function(event) {
            console.error('Speech synthesis error:', event);
            playBtn.style.display = 'inline-block';
            pauseBtn.style.display = 'none';
            stopBtn.style.display = 'none';
            isPaused = false;
            currentUtterance = null;
        };
        
        // Start speaking
        speechSynthesis.speak(currentUtterance);
    }
    
    function pauseText() {
        const playBtn = document.getElementById('tts-play-btn');
        const pauseBtn = document.getElementById('tts-pause-btn');
        
        if (speechSynthesis.speaking && !isPaused) {
            speechSynthesis.pause();
            isPaused = true;
            playBtn.style.display = 'inline-block';
            playBtn.textContent = '▶ Fortsetzen';
            pauseBtn.style.display = 'none';
        }
    }
    
    function stopText() {
        const playBtn = document.getElementById('tts-play-btn');
        const pauseBtn = document.getElementById('tts-pause-btn');
        const stopBtn = document.getElementById('tts-stop-btn');
        
        speechSynthesis.cancel();
        isPaused = false;
        currentUtterance = null;
        
        playBtn.style.display = 'inline-block';
        playBtn.textContent = '▶ Text vorlesen';
        pauseBtn.style.display = 'none';
        stopBtn.style.display = 'none';
    }
    
    // Get the page from URL parameter or path
    function getCurrentPage() {
        // First check for URL parameter (from 404.html redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page');
        if (pageParam) {
            return sanitizePageName(pageParam);
        }
        
        // Otherwise, try to get from path
        const path = window.location.pathname;
        const pathSegments = path.split('/').filter(p => p);
        
        // For GitHub Pages subdirectory deployment (e.g., /repository-name/page)
        // The last segment would be the page name (if not index.html)
        if (pathSegments.length > 0) {
            const lastSegment = pathSegments[pathSegments.length - 1];
            // Ignore index.html or if it ends with .html
            if (lastSegment !== 'index.html' && !lastSegment.endsWith('.html')) {
                return sanitizePageName(lastSegment);
            }
        }
        
        return '';
    }
    
    // Sanitize page name to prevent path traversal attacks
    function sanitizePageName(name) {
        // Only allow alphanumeric characters, hyphens, and underscores
        return name.replace(/[^a-zA-Z0-9-_]/g, '');
    }
    
    // Load content for the current page
    async function loadContent(pageName) {
        const loadingEl = document.getElementById('loading');
        const errorEl = document.getElementById('error');
        const displayEl = document.getElementById('display');
        const titleEl = document.getElementById('title');
        const textContentEl = document.getElementById('text-content');
        const audioPlayerEl = document.getElementById('audio-player');
        const audioSourceEl = document.getElementById('audio-source');
        
        // Show loading state
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';
        displayEl.style.display = 'none';
        
        // If no page name, show welcome message
        if (!pageName) {
            loadingEl.style.display = 'none';
            displayEl.style.display = 'block';
            titleEl.textContent = 'Willkommen';
            textContentEl.innerHTML = '<p>Willkommen bei "Geschichte für Alle"!</p><p>Bitte verwenden Sie einen QR-Code, um auf die Audioführungen zuzugreifen.</p>';
            audioPlayerEl.style.display = 'none';
            return;
        }
        
        try {
            // Load text file
            const textResponse = await fetch(`content/${pageName}.txt`);
            if (!textResponse.ok) {
                throw new Error('Text file not found');
            }
            const textContent = await textResponse.text();
            
            // Try to load audio file
            let hasAudio = false;
            try {
                const audioResponse = await fetch(`content/${pageName}.mp3`, { method: 'HEAD' });
                if (audioResponse.ok) {
                    hasAudio = true;
                }
            } catch (e) {
                // Audio is optional
            }
            
            // Display content
            loadingEl.style.display = 'none';
            displayEl.style.display = 'block';
            titleEl.textContent = formatTitle(pageName);
            textContentEl.textContent = textContent;
            
            if (hasAudio) {
                audioPlayerEl.style.display = 'block';
                audioSourceEl.src = `content/${pageName}.mp3`;
                const audioEl = audioPlayerEl.querySelector('audio');
                audioEl.load();
            } else {
                audioPlayerEl.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Error loading content:', error);
            loadingEl.style.display = 'none';
            errorEl.style.display = 'block';
            errorEl.innerHTML = `<p>Der Inhalt "${pageName}" konnte nicht gefunden werden.</p><p>Bitte überprüfen Sie den QR-Code.</p>`;
        }
    }
    
    // Format page name to title
    function formatTitle(pageName) {
        return pageName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    // Initialize on page load
    window.addEventListener('DOMContentLoaded', function() {
        const pageName = getCurrentPage();
        loadContent(pageName);
        initializeTTS();
        
        // Ensure voices are loaded for speech synthesis
        // Voices may not be available immediately on some browsers
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = function() {
                // Voices are now loaded and ready to use
                const voices = speechSynthesis.getVoices();
                console.log('Loaded ' + voices.length + ' voices for TTS');
            };
        }
        // Also trigger voice loading immediately
        speechSynthesis.getVoices();
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', function() {
        stopText(); // Stop TTS when navigating
        const pageName = getCurrentPage();
        loadContent(pageName);
    });
})();
