/**
 * Routines.js
 * Manages predefined workout plans (Upper, Lower, Full Body).
 */

const WORKOUT_PLANS = {
    upperBody: {
        id: 'upperBody',
        title: "Upper Body Power",
        subtitle: "10 Min • Strength & Core",
        sequence: [
            { name: "Push-up", count: 12, instruction: "Keep body straight" },
            { name: "Dip", count: 15, instruction: "Lower until 90 degrees" },
            { name: "Plank", count: 30, instruction: "Hold steady (seconds)", isTimer: true },
            { name: "Push-up", count: 10, instruction: "Set 2: Push hard!" },
            { name: "Side Plank", count: 20, instruction: "Left side" },
            { name: "Side Plank", count: 20, instruction: "Right side" }
        ]
    },
    lowerBody: {
        id: 'lowerBody',
        title: "Leg Day Blitz",
        subtitle: "10 Min • Glutes & Quads",
        sequence: [
            { name: "Squat", count: 20, instruction: "Knees behind toes" },
            { name: "Lunge", count: 12, instruction: "Alternating legs" },
            { name: "Calf Raise", count: 25, instruction: "Full range of motion" },
            { name: "Wall Sit", count: 30, instruction: "Hold steady (seconds)", isTimer: true },
            { name: "Squat", count: 15, instruction: "Set 2: Go lower" },
            { name: "Glute Bridge", count: 20, instruction: "Squeeze at top" }
        ]
    },
    fullBody: {
        id: 'fullBody',
        title: "Total Body Burn",
        subtitle: "10 Min • HIIT Style",
        sequence: [
            { name: "Jumping Jack", count: 30, instruction: "Warm up pace" },
            { name: "Squat", count: 15, instruction: "Deep squats" },
            { name: "Push-up", count: 10, instruction: "Chest to floor" },
            { name: "High Knees", count: 40, instruction: "Drive knees up!" },
            { name: "Burpee", count: 10, instruction: "Explosive movement" },
            { name: "Plank", count: 45, instruction: "Finisher hold", isTimer: true }
        ]
    }
};

class RoutineManager {
    constructor() {
        this.currentPlan = null;
        this.currentIndex = 0;
        this.active = false;
    }

    /**
     * Starts a specific routine
     * @param {string} planId - 'upperBody', 'lowerBody', or 'fullBody'
     */
    start(planId) {
        if (!WORKOUT_PLANS[planId]) {
            console.error("Plan not found:", planId);
            return;
        }

        this.currentPlan = WORKOUT_PLANS[planId];
        this.currentIndex = 0;
        this.active = true;

        // UI Updates
        if(window.setAIStatus) window.setAIStatus('green'); // Update indicator
        this.updateHeaderUI();
        this.loadCurrentExercise();
    }

    /**
     * Loads the specific exercise from the sequence
     */
    loadCurrentExercise() {
        if (!this.active || !this.currentPlan) return;

        const exercise = this.currentPlan.sequence[this.currentIndex];
        
        console.log(`Starting Exercise ${this.currentIndex + 1}: ${exercise.name}`);

        // 1. Tell the main Script.js to switch mode (Mapping string names to internal logic)
        // Assuming window.startMode exists in global scope from Script.js
        if (typeof window.startMode === 'function') {
            // Convert "Push-up" to "pushup" or whatever internal ID your AI uses
            const internalId = exercise.name.toLowerCase().replace(/\s/g, ''); 
            window.startMode(internalId); 
        }

        // 2. Show the Instruction Overlay
        const message = `${exercise.name}: ${exercise.count} ${exercise.isTimer ? 'Secs' : 'Reps'}`;
        if (typeof window.updateHint === 'function') {
            window.updateHint(message); // Using the red pill for immediate instruction
        }
        
        // 3. Update Status Header
        const statusText = document.getElementById('status-text');
        if (statusText) {
            statusText.innerText = `${this.currentPlan.title} • ${this.currentIndex + 1}/${this.currentPlan.sequence.length}`;
        }
    }

    /**
     * Call this function when the AI detects a completed rep or timer finishes
     */
    next() {
        if (!this.active) return;

        this.currentIndex++;

        if (this.currentIndex >= this.currentPlan.sequence.length) {
            this.finish();
        } else {
            this.loadCurrentExercise();
        }
    }

    finish() {
        this.active = false;
        this.currentPlan = null;
        
        if (typeof window.updateHint === 'function') {
            window.updateHint("Workout Complete! Great Job!");
        }
        
        // Reset UI after 3 seconds
        setTimeout(() => {
            if (typeof window.updateHint === 'function') window.updateHint(null);
            const statusText = document.getElementById('status-text');
            if (statusText) statusText.innerText = "Ready";
        }, 3000);
    }

    updateHeaderUI() {
        // Optional: Can add specific UI logic here
    }
}

// Initialize Global Instance
window.routineManager = new RoutineManager();