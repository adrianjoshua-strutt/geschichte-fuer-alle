// Client-side routing for GitHub Pages
(function() {
    'use strict';
    
    // Text-to-Speech state
    let ttsUtterance = null;
    let ttsCurrentText = '';
    let ttsIsPlaying = false;
    
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
    
    // Text-to-Speech functions
    function initializeTTS() {
        // Check if speech synthesis is supported
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported in this browser');
            const ttsPanel = document.getElementById('tts-panel');
            if (ttsPanel) {
                ttsPanel.style.display = 'none';
            }
            return;
        }
        
        const playPauseBtn = document.getElementById('tts-play-pause');
        const stopBtn = document.getElementById('tts-stop');
        const slowSpeedCheckbox = document.getElementById('tts-slow-speed');
        const repeatCheckbox = document.getElementById('tts-repeat');
        
        if (!playPauseBtn || !stopBtn) return;
        
        // Play/Pause button
        playPauseBtn.addEventListener('click', function() {
            if (ttsIsPlaying) {
                pauseTTS();
            } else {
                playTTS();
            }
        });
        
        // Stop button
        stopBtn.addEventListener('click', function() {
            stopTTS();
        });
        
        // Speed change
        if (slowSpeedCheckbox) {
            slowSpeedCheckbox.addEventListener('change', function() {
                if (ttsIsPlaying) {
                    // Restart with new speed
                    stopTTS();
                    playTTS();
                }
            });
        }
    }
    
    function playTTS() {
        const textContentEl = document.getElementById('text-content');
        const playPauseBtn = document.getElementById('tts-play-pause');
        const slowSpeedCheckbox = document.getElementById('tts-slow-speed');
        const repeatCheckbox = document.getElementById('tts-repeat');
        
        if (!textContentEl || !playPauseBtn) return;
        
        // Get text content
        const text = textContentEl.textContent.trim();
        if (!text) return;
        
        // Cancel any existing speech
        window.speechSynthesis.cancel();
        
        // Create new utterance
        ttsUtterance = new SpeechSynthesisUtterance(text);
        ttsUtterance.lang = 'de-DE'; // German language
        ttsUtterance.rate = slowSpeedCheckbox && slowSpeedCheckbox.checked ? 0.5 : 1.0;
        ttsUtterance.pitch = 1.0;
        ttsUtterance.volume = 1.0;
        
        // Event handlers
        ttsUtterance.onstart = function() {
            ttsIsPlaying = true;
            updatePlayPauseButton(true);
        };
        
        ttsUtterance.onend = function() {
            // Check if repeat is enabled
            if (repeatCheckbox && repeatCheckbox.checked) {
                // Restart speech with a new utterance
                setTimeout(() => {
                    playTTS();
                }, 500);
            } else {
                ttsIsPlaying = false;
                updatePlayPauseButton(false);
            }
        };
        
        ttsUtterance.onerror = function(event) {
            console.error('Speech synthesis error:', event);
            ttsIsPlaying = false;
            updatePlayPauseButton(false);
        };
        
        // Start speaking
        window.speechSynthesis.speak(ttsUtterance);
        ttsCurrentText = text;
    }
    
    function pauseTTS() {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            ttsIsPlaying = false;
            updatePlayPauseButton(false);
        } else if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            ttsIsPlaying = true;
            updatePlayPauseButton(true);
        } else {
            // Not currently speaking, start from beginning
            playTTS();
        }
    }
    
    function stopTTS() {
        window.speechSynthesis.cancel();
        ttsIsPlaying = false;
        ttsUtterance = null;
        updatePlayPauseButton(false);
    }
    
    function updatePlayPauseButton(isPlaying) {
        const playPauseBtn = document.getElementById('tts-play-pause');
        if (!playPauseBtn) return;
        
        const icon = playPauseBtn.querySelector('.btn-icon');
        const text = playPauseBtn.querySelector('.btn-text');
        
        if (isPlaying) {
            playPauseBtn.classList.add('playing');
            if (icon) icon.textContent = '⏸';
            if (text) text.textContent = 'Pause';
            playPauseBtn.setAttribute('aria-label', 'Pause');
        } else {
            playPauseBtn.classList.remove('playing');
            if (icon) icon.textContent = '▶';
            if (text) text.textContent = 'Vorlesen';
            playPauseBtn.setAttribute('aria-label', 'Text vorlesen');
        }
    }
    
    // Initialize on page load
    window.addEventListener('DOMContentLoaded', function() {
        const pageName = getCurrentPage();
        loadContent(pageName);
        initializeTTS();
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', function() {
        stopTTS(); // Stop any playing speech when navigating
        const pageName = getCurrentPage();
        loadContent(pageName);
    });
})();
