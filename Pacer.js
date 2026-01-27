/**
 * Pacer.js
 * Handles visual rhythm guide and audio metronome.
 */
class Pacer {
    constructor() {
        this.active = false;
        this.audioCtx = null;
        this.timerID = null;
        
        // DOM Elements (will be grabbed after DOM load)
        this.container = null; 
    }

    init() {
        this.container = document.getElementById('pacer-container');
    }

    /**
     * Starts the pacer.
     * @param {number} durationSeconds - Time for one full rep (e.g., 4s = 2s down, 2s up)
     * @param {string} type - 'strength' (Up/Down bar) or 'cardio' (Pulsing circle)
     */
    start(durationSeconds, type = 'strength') {
        if (!this.container) this.init();
        if (!this.container) return; // Safety check

        this.stop(); // Stop any existing pacer
        this.active = true;
        this.container.classList.remove('hidden');

        // 1. Set Animation Speed via CSS Variable
        document.documentElement.style.setProperty('--tempo', `${durationSeconds}s`);

        // 2. Set Visual Style
        if (type === 'cardio' || type === 'static') {
            this.container.classList.add('pulse-mode');
        } else {
            this.container.classList.remove('pulse-mode');
        }

        // 3. Start Audio Metronome
        this.playAudio(durationSeconds);
    }

    stop() {
        this.active = false;
        if (this.container) this.container.classList.add('hidden');
        if (this.timerID) {
            clearInterval(this.timerID);
            this.timerID = null;
        }
    }

    playAudio(intervalSeconds) {
        // Initialize Audio Context on first user interaction
        if (!window.AudioContext && !window.webkitAudioContext) return;
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const playTone = (freq, type = 'sine') => {
            if (!this.active) return;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            
            osc.frequency.value = freq;
            osc.type = type;
            
            // Short crisp beep
            gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
            
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.1);
        };

        // Strength Logic: Beep at Top (High) and Bottom (Low)
        // Interval is full cycle (e.g., 4s). Halfway is 2s.
        const halfTimeMS = (intervalSeconds * 1000) / 2;

        // Immediate start
        playTone(600); 

        this.timerID = setInterval(() => {
            if (!this.active) return;
            
            playTone(600); // Top of movement / Start of Pulse
            
            // If strength, play a 'bottom' tone halfway through
            if (!this.container.classList.contains('pulse-mode')) {
                setTimeout(() => {
                    if (this.active) playTone(350, 'triangle'); // Lower tone for bottom
                }, halfTimeMS);
            }
        }, intervalSeconds * 1000);
    }
}

// Global Instance
window.pacer = new Pacer();