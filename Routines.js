/**
 * Routines.js
 * Manages predefined workout plans with Pacer integration.
 */

const WORKOUT_PLANS = {
    upperBody: {
        id: 'upperBody',
        title: "Upper Body Power",
        sequence: [
            // Strength: 4s tempo (2s down, 2s up)
            { name: "Push-up", count: 12, tempo: 4, type: 'strength' },
            { name: "Dip", count: 15, tempo: 3, type: 'strength' },
            // Static: 1s pulse for timing
            { name: "Plank", count: 30, tempo: 1, type: 'static', isTimer: true },
            { name: "Push-up", count: 10, tempo: 4, type: 'strength' },
            { name: "Side Plank", count: 20, tempo: 1, type: 'static' }
        ]
    },
    lowerBody: {
        id: 'lowerBody',
        title: "Leg Day Blitz",
        sequence: [
            { name: "Squat", count: 20, tempo: 4, type: 'strength' },
            { name: "Lunge", count: 12, tempo: 4, type: 'strength' },
            { name: "Calf Raise", count: 25, tempo: 2, type: 'strength' },
            { name: "Wall Sit", count: 30, tempo: 1, type: 'static', isTimer: true },
            { name: "Squat", count: 15, tempo: 4, type: 'strength' },
            { name: "Glute Bridge", count: 20, tempo: 3, type: 'strength' }
        ]
    },
    fullBody: {
        id: 'fullBody',
        title: "Total Body Burn",
        sequence: [
            // Cardio: Fast pulsing (0.8s)
            { name: "Jumping Jack", count: 30, tempo: 0.8, type: 'cardio' },
            { name: "Squat", count: 15, tempo: 3, type: 'strength' },
            { name: "Push-up", count: 10, tempo: 3, type: 'strength' },
            { name: "High Knees", count: 40, tempo: 0.6, type: 'cardio' },
            { name: "Burpee", count: 10, tempo: 5, type: 'strength' },
            { name: "Plank", count: 45, tempo: 1, type: 'static', isTimer: true }
        ]
    }
};

class RoutineManager {
    constructor() {
        this.currentPlan = null;
        this.currentIndex = 0;
        this.active = false;
    }

    start(planId) {
        if (!WORKOUT_PLANS[planId]) return;
        this.currentPlan = WORKOUT_PLANS[planId];
        this.currentIndex = 0;
        this.active = true;

        if(window.setAIStatus) window.setAIStatus('green');
        this.loadCurrentExercise();
    }

    loadCurrentExercise() {
        if (!this.active || !this.currentPlan) return;

        const exercise = this.currentPlan.sequence[this.currentIndex];
        
        console.log(`Starting: ${exercise.name}`);

        // 1. Switch AI Mode
        if (typeof window.startMode === 'function') {
            const internalId = exercise.name.toLowerCase().replace(/\s/g, ''); 
            window.startMode(internalId); 
        }

        // 2. Update UI Hint
        const message = `${exercise.name}: ${exercise.count} ${exercise.isTimer ? 'Secs' : 'Reps'}`;
        if (typeof window.updateHint === 'function') {
            window.updateHint(message);
        }
        
        // 3. Update Header
        const statusText = document.getElementById('status-text');
        if (statusText) {
            statusText.innerText = `${this.currentPlan.title} • ${this.currentIndex + 1}/${this.currentPlan.sequence.length}`;
        }

        // 4. START PACER (New)
        if (window.pacer && exercise.tempo) {
            window.pacer.start(exercise.tempo, exercise.type);
        } else if (window.pacer) {
            window.pacer.stop();
        }
    }

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
        
        // Stop Pacer
        if (window.pacer) window.pacer.stop();

        if (typeof window.updateHint === 'function') {
            window.updateHint("Workout Complete!");
        }
        
        setTimeout(() => {
            if (typeof window.updateHint === 'function') window.updateHint(null);
            const statusText = document.getElementById('status-text');
            if (statusText) statusText.innerText = "Ready";
        }, 3000);
    }
}

window.routineManager = new RoutineManager();
