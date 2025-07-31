// Enhanced Autoplay Detection and Management
class AutoplayEnhancer {
    constructor() {
        this.autoplaySupported = null;
        this.autoplayAttempted = false;
        this.fallbackStrategies = [
            this.immediateAutoplay.bind(this),
            this.delayedAutoplay.bind(this),
            this.userInteractionPrompt.bind(this)
        ];
        this.currentStrategyIndex = 0;
    }

    // Test if autoplay is supported in current browser/context
    async testAutoplaySupport() {
        if (this.autoplaySupported !== null) {
            return this.autoplaySupported;
        }

        try {
            const video = document.createElement('video');
            video.muted = true;
            video.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMWF2YzEAAAAIZnJlZQAAABBtZGF0AAAADGdvb2QgZGF5IQ==';
            
            const playPromise = video.play();
            if (playPromise !== undefined) {
                await playPromise;
                this.autoplaySupported = true;
                console.log('Autoplay test: SUPPORTED');
            } else {
                this.autoplaySupported = false;
                console.log('Autoplay test: NOT SUPPORTED (no promise)');
            }
        } catch (error) {
            this.autoplaySupported = false;
            console.log('Autoplay test: BLOCKED', error.message);
        }

        return this.autoplaySupported;
    }

    // Strategy 1: Immediate autoplay attempt
    async immediateAutoplay(video) {
        console.log('Autoplay Strategy 1: Immediate attempt');
        try {
            await video.play();
            console.log('✅ Immediate autoplay successful');
            return true;
        } catch (error) {
            console.log('❌ Immediate autoplay failed:', error.message);
            return false;
        }
    }

    // Strategy 2: Delayed autoplay with multiple attempts
    async delayedAutoplay(video) {
        console.log('Autoplay Strategy 2: Delayed attempts');
        const delays = [1000, 2000, 3000]; // 1s, 2s, 3s delays
        
        for (const delay of delays) {
            try {
                await new Promise(resolve => setTimeout(resolve, delay));
                await video.play();
                console.log(`✅ Delayed autoplay successful after ${delay}ms`);
                return true;
            } catch (error) {
                console.log(`❌ Delayed autoplay failed after ${delay}ms:`, error.message);
            }
        }
        return false;
    }

    // Strategy 3: Show user interaction prompt
    userInteractionPrompt(video) {
        console.log('Autoplay Strategy 3: User interaction required');
        
        // Create overlay with play button
        const overlay = document.createElement('div');
        overlay.className = 'autoplay-overlay';
        overlay.innerHTML = `
            <div class="autoplay-prompt">
                <div class="play-icon">▶️</div>
                <p>Click to play video</p>
                <small>Autoplay was blocked by your browser</small>
            </div>
        `;
        
        // Add styles
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1000;
            color: white;
            font-family: Arial, sans-serif;
        `;
        
        const prompt = overlay.querySelector('.autoplay-prompt');
        prompt.style.cssText = `
            text-align: center;
            padding: 20px;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
        `;
        
        const playIcon = overlay.querySelector('.play-icon');
        playIcon.style.cssText = `
            font-size: 48px;
            margin-bottom: 10px;
            animation: pulse 2s infinite;
        `;
        
        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
        
        // Add overlay to video container
        const videoContainer = video.parentElement;
        videoContainer.style.position = 'relative';
        videoContainer.appendChild(overlay);
        
        // Handle click to play
        overlay.addEventListener('click', async () => {
            try {
                await video.play();
                overlay.remove();
                console.log('✅ User interaction autoplay successful');
            } catch (error) {
                console.error('❌ Even user interaction failed:', error);
            }
        });
        
        return false; // This strategy doesn't auto-play, requires user action
    }

    // Main method to attempt autoplay with progressive fallback
    async attemptAutoplay(video, urlParams) {
        const autoplayParam = urlParams.get('autoplay');
        const unmuteParam = urlParams.get('unmute');
        
        // Only attempt if autoplay is requested
        if (autoplayParam !== 'true') {
            console.log('Autoplay not requested via URL parameter');
            return false;
        }
        
        // Set mute state based on parameter
        if (unmuteParam === 'true') {
            video.muted = false;
        } else if (unmuteParam === 'false') {
            video.muted = true;
        }
        
        console.log('🎬 Starting enhanced autoplay sequence...');
        console.log(`Video muted: ${video.muted}`);
        
        // Test autoplay support first
        await this.testAutoplaySupport();
        
        // Try each strategy until one succeeds
        for (let i = 0; i < this.fallbackStrategies.length; i++) {
            const strategy = this.fallbackStrategies[i];
            console.log(`Trying autoplay strategy ${i + 1}/${this.fallbackStrategies.length}`);
            
            const success = await strategy(video);
            if (success) {
                console.log('🎉 Autoplay successful!');
                return true;
            }
            
            // Wait a bit before trying next strategy
            if (i < this.fallbackStrategies.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        console.log('⚠️ All autoplay strategies exhausted');
        return false;
    }

    // Method to be called when stream is initialized
    async onStreamReady(video, urlParams) {
        // Small delay to ensure everything is properly initialized
        setTimeout(async () => {
            await this.attemptAutoplay(video, urlParams);
        }, 100);
    }
}

// Export for use in main player
window.AutoplayEnhancer = AutoplayEnhancer;