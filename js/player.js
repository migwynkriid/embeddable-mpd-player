// Global variables
let player = null;
let currentUrl = '';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializePlayer();
    setupEventListeners();
    checkUrlParameters();
});

// Check for URL parameters and auto-load if link parameter is present
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const linkParam = urlParams.get('link');
    
    if (linkParam) {
        const urlInput = document.getElementById('mpdUrl');
        urlInput.value = linkParam;
        
        // Validate and load the video automatically
        if (isValidUrl(linkParam)) {
            loadVideo();
        } else {
            showError('Invalid MPD URL provided in link parameter');
        }
    }
}

// Check for URL parameters and auto-load if link parameter is present
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const linkParam = urlParams.get('link');
    
    if (linkParam) {
        const urlInput = document.getElementById('mpdUrl');
        urlInput.value = linkParam;
        
        // Validate and load the video automatically
        if (isValidUrl(linkParam)) {
            loadVideo();
        } else {
            showError('Invalid MPD URL provided in link parameter');
        }
    }
}

function initializePlayer() {
    const video = document.getElementById('videoPlayer');
    
    if (dashjs.supportsMediaSource()) {
        player = dashjs.MediaPlayer().create();
        
        // Set up event listeners for player
        player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, onStreamInitialized);
        player.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, onPlaybackStarted);
        player.on(dashjs.MediaPlayer.events.PLAYBACK_PAUSED, onPlaybackPaused);
        player.on(dashjs.MediaPlayer.events.ERROR, onError);
        player.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED, onQualityChange);
        player.on(dashjs.MediaPlayer.events.METRIC_CHANGED, onMetricChanged);
        
        // Configure player settings
        player.updateSettings({
            streaming: {
                abr: {
                    autoSwitchBitrate: {
                        video: true,
                        audio: true
                    }
                },
                buffer: {
                    fastSwitchEnabled: true
                }
            }
        });
        
        console.log('DASH.js player initialized successfully');
    } else {
        showError('Your browser does not support Media Source Extensions (MSE), which is required for DASH playback.');
    }
}

function setupEventListeners() {
    const urlInput = document.getElementById('mpdUrl');
    const loadBtn = document.getElementById('loadBtn');
    
    // Enter key support
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loadVideo();
        }
    });
    
    // Input validation
    urlInput.addEventListener('input', function() {
        const isValid = isValidUrl(this.value);
        loadBtn.disabled = !isValid;
        
        if (this.value && !isValid) {
            this.style.borderColor = '#dc3545';
        } else {
            this.style.borderColor = '#e1e5e9';
        }
    });
}

function loadVideo() {
    const url = document.getElementById('mpdUrl').value.trim();
    const loadBtn = document.getElementById('loadBtn');
    const video = document.getElementById('videoPlayer');
    
    if (!url) {
        showError('Please enter a valid MPD URL');
        return;
    }
    
    if (!isValidUrl(url)) {
        showError('Please enter a valid URL');
        return;
    }
    
    // Clear previous errors
    clearError();
    
    // Show loading state
    loadBtn.disabled = true;
    loadBtn.textContent = 'Loading...';
    loadBtn.classList.add('loading');
    
    try {
        // Reset player if already initialized
        if (player && currentUrl) {
            player.reset();
        }
        
        // Initialize player with new URL
        player.initialize(video, url, true);
        currentUrl = url;
        
        updateStatus('Loading...');
        
        console.log('Loading MPD:', url);
        
    } catch (error) {
        console.error('Error loading video:', error);
        showError('Failed to load video: ' + error.message);
        resetLoadButton();
    }
}

function loadSample(url) {
    document.getElementById('mpdUrl').value = url;
    loadVideo();
}

function onStreamInitialized(e) {
    console.log('Stream initialized:', e);
    updateStatus('Stream Ready');
    showVideoInfo();
    resetLoadButton();
    
    // Get available qualities
    updateQualityInfo();
}

function onPlaybackStarted(e) {
    console.log('Playback started:', e);
    updateStatus('Playing');
}

function onPlaybackPaused(e) {
    console.log('Playback paused:', e);
    updateStatus('Paused');
}

function onError(e) {
    console.error('Player error:', e);
    let errorMessage = 'An error occurred while playing the video.';
    
    if (e.error) {
        switch (e.error.code) {
            case dashjs.MediaPlayer.errors.DOWNLOAD_ERROR_ID_MANIFEST:
                errorMessage = 'Failed to download the MPD manifest. Please check the URL and CORS settings.';
                break;
            case dashjs.MediaPlayer.errors.MANIFEST_LOADER_PARSING_FAILURE_ERROR_CODE:
                errorMessage = 'Failed to parse the MPD manifest. The file may be corrupted or invalid.';
                break;
            case dashjs.MediaPlayer.errors.DOWNLOAD_ERROR_ID_CONTENT:
                errorMessage = 'Failed to download video content. The media files may be unavailable.';
                break;
            default:
                errorMessage = e.error.message || errorMessage;
        }
    }
    
    showError(errorMessage);
    resetLoadButton();
}

function onQualityChange(e) {
    console.log('Quality changed:', e);
    updateQualityInfo();
}

function onMetricChanged(e) {
    if (e.metric === 'BufferLevel') {
        updateBufferInfo();
    }
}

function updateStatus(status) {
    // Video info section removed - no longer updating status
    console.log('Status:', status);
}

function updateQualityInfo() {
    if (!player) return;
    
    try {
        const videoTrack = player.getCurrentTrackFor('video');
        const bitrateInfo = player.getBitrateInfoListFor('video');
        const currentQuality = player.getQualityFor('video');
        
        if (videoTrack && bitrateInfo && bitrateInfo[currentQuality]) {
            const quality = bitrateInfo[currentQuality];
            console.log('Quality:', `${quality.width}x${quality.height}`);
            console.log('Bitrate:', `${Math.round(quality.bitrate / 1000)} kbps`);
        }
    } catch (error) {
        console.warn('Could not update quality info:', error);
    }
}

function updateBufferInfo() {
    if (!player) return;
    
    try {
        const bufferLevel = player.getDashMetrics().getCurrentBufferLevel('video');
        if (bufferLevel !== null) {
            console.log('Buffer:', `${bufferLevel.toFixed(1)}s`);
        }
    } catch (error) {
        console.warn('Could not update buffer info:', error);
    }
}

function showVideoInfo() {
    // Video info section removed - no longer showing info panel
    console.log('Video info would be shown here');
}

function hideVideoInfo() {
    // Video info section removed - no longer hiding info panel
    console.log('Video info would be hidden here');
}

function showError(message) {
    const errorSection = document.getElementById('errorSection');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    errorSection.style.display = 'block';
    
    // Scroll to error
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearError() {
    document.getElementById('errorSection').style.display = 'none';
}

function resetLoadButton() {
    const loadBtn = document.getElementById('loadBtn');
    loadBtn.disabled = false;
    loadBtn.textContent = 'Load Video';
    loadBtn.classList.remove('loading');
}

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Utility function to format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Export functions for global access
window.loadVideo = loadVideo;
window.loadSample = loadSample;
window.clearError = clearError;

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (player) {
        player.reset();
    }
});