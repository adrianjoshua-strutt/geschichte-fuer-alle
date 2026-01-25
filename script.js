// Client-side routing for GitHub Pages
(function() {
    'use strict';
    
    // MP3 Player functionality
    let audioElement = null;
    let playPauseBtn = null;
    let progressFill = null;
    let progressContainer = null;
    let listenersAttached = false;
    
    // Initialize MP3 Player
    function initializeMP3Player() {
        // Update element references (these may change when content loads)
        audioElement = document.getElementById('audio-element');
        playPauseBtn = document.getElementById('play-pause-btn');
        progressFill = document.getElementById('progress-fill');
        progressContainer = document.querySelector('.progress-bar');
        
        if (!audioElement || !playPauseBtn) return;
        
        // Only attach event listeners once
        if (!listenersAttached) {
            // Play/Pause button click
            playPauseBtn.addEventListener('click', togglePlayPause);
            
            // Update progress bar
            audioElement.addEventListener('timeupdate', updateProgress);
            
            // Reset button when audio ends
            audioElement.addEventListener('ended', function() {
                if (playPauseBtn) {
                    playPauseBtn.classList.remove('playing');
                    const playIcon = playPauseBtn.querySelector('.play-icon');
                    if (playIcon) playIcon.textContent = '▶';
                }
                if (progressFill) progressFill.style.width = '0%';
            });
            
            // Click on progress bar to seek
            // Note: progressContainer is updated on each init to handle page navigation
            if (progressContainer) {
                progressContainer.addEventListener('click', function(e) {
                    // Get fresh reference to progressContainer in case it changed
                    const container = document.querySelector('.progress-bar');
                    if (!audioElement || !isFinite(audioElement.duration) || !container) return;
                    const rect = container.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    audioElement.currentTime = percent * audioElement.duration;
                });
            }
            
            listenersAttached = true;
        }
    }
    
    function togglePlayPause() {
        if (!audioElement) return;
        
        const playIcon = playPauseBtn ? playPauseBtn.querySelector('.play-icon') : null;
        
        if (audioElement.paused) {
            audioElement.play().catch(function(error) {
                console.error('Playback error:', error);
            });
            if (playPauseBtn) playPauseBtn.classList.add('playing');
            if (playIcon) playIcon.textContent = '⏸';
        } else {
            audioElement.pause();
            if (playPauseBtn) playPauseBtn.classList.remove('playing');
            if (playIcon) playIcon.textContent = '▶';
        }
    }
    
    function updateProgress() {
        if (!audioElement || !isFinite(audioElement.duration)) return;
        
        const percent = (audioElement.currentTime / audioElement.duration) * 100;
        if (progressFill) progressFill.style.width = percent + '%';
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
                const audioEl = document.getElementById('audio-element');
                if (audioEl) {
                    audioEl.load();
                    // Reinitialize player controls for new audio
                    initializeMP3Player();
                }
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
        initializeMP3Player();
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', function() {
        const pageName = getCurrentPage();
        loadContent(pageName);
    });
})();
