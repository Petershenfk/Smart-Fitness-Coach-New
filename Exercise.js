/**
 * Exercise.js
 * Improved detection with Anti-Spam (Cooldown) logic.
 * Prevents false positives and double-counting.
 */

class Exercise {
    constructor(name) {
        this.name = name;
        this.state = "start"; // Generic start state
        this.feedback = "";
        
        // --- NEW: Cooldown Logic ---
        this.lastRepTime = 0;       // Timestamp of the last valid rep
        this.minRepInterval = 600;  // 600ms cooldown between reps (adjust as needed)
    }

    // Helper: Calculate angle between three points (A, B, C)
    calculateAngle(a, b, c) {
        if (!a || !b || !c) return 0;
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        if (angle > 180.0) angle = 360.0 - angle;
        return angle;
    }
}

// --- STRENGTH EXERCISES ---

class Squat extends Exercise {
    constructor(name) { super(name); this.state = "up"; }

    check(pose) {
        const hip = pose.keypoints.find(k => k.name === 'left_hip');
        const knee = pose.keypoints.find(k => k.name === 'left_knee');
        const ankle = pose.keypoints.find(k => k.name === 'left_ankle');
        
        // Confidence check: If AI isn't sure where legs are, don't count
        if (!hip || !knee || !ankle || hip.score < 0.3 || knee.score < 0.3) return null;

        const angle = this.calculateAngle(hip, knee, ankle);
        
        // GOING DOWN
        if (this.state === "up" && angle < 110) { 
            this.state = "down";
            return { isRep: false, feedback: "Good depth" };
        } 
        
        // COMING UP (With Cooldown)
        if (this.state === "down" && angle > 165) { 
            const now = Date.now();
            if (now - this.lastRepTime > this.minRepInterval) {
                this.state = "up";
                this.lastRepTime = now;
                return { isRep: true, feedback: "Up" };
            }
        }
        return { isRep: false, feedback: angle < 120 ? "Hold..." : "Go Lower" };
    }
}

class PushUp extends Exercise {
    constructor(name) { super(name); this.state = "up"; }

    check(pose) {
        const shoulder = pose.keypoints.find(k => k.name === 'left_shoulder');
        const elbow = pose.keypoints.find(k => k.name === 'left_elbow');
        const wrist = pose.keypoints.find(k => k.name === 'left_wrist');
        
        if (!shoulder || !elbow || !wrist || shoulder.score < 0.3) return null;
        
        const angle = this.calculateAngle(shoulder, elbow, wrist);

        // DOWN (Bent elbows)
        if (this.state === "up" && angle < 100) {
            this.state = "down";
            return { isRep: false, feedback: "Push!" };
        }
        // UP (Straight arms + Cooldown)
        if (this.state === "down" && angle > 160) {
            const now = Date.now();
            if (now - this.lastRepTime > this.minRepInterval) {
                this.state = "up";
                this.lastRepTime = now;
                return { isRep: true, feedback: "Up" };
            }
        }
        return { isRep: false, feedback: "Keep back straight" };
    }
}

class Lunge extends Exercise {
    constructor(name) { super(name); this.state = "up"; }

    check(pose) {
        const hip = pose.keypoints.find(k => k.name === 'left_hip');
        const knee = pose.keypoints.find(k => k.name === 'left_knee');
        const ankle = pose.keypoints.find(k => k.name === 'left_ankle');
        
        if (!hip || !knee || !ankle) return null;
        const angle = this.calculateAngle(hip, knee, ankle);
        
        if (this.state === "up" && angle < 110) {
            this.state = "down";
            return { isRep: false, feedback: "Nice Lunge" };
        }
        if (this.state === "down" && angle > 160) {
            const now = Date.now();
            if (now - this.lastRepTime > this.minRepInterval) {
                this.state = "up";
                this.lastRepTime = now;
                return { isRep: true, feedback: "Up" };
            }
        }
        return { isRep: false, feedback: "" };
    }
}

class Dip extends Exercise {
    constructor(name) { super(name); this.state = "up"; }

    check(pose) {
        const shoulder = pose.keypoints.find(k => k.name === 'left_shoulder');
        const elbow = pose.keypoints.find(k => k.name === 'left_elbow');
        const wrist = pose.keypoints.find(k => k.name === 'left_wrist');
        
        if (!shoulder || !elbow) return null;
        const angle = this.calculateAngle(shoulder, elbow, wrist);

        if (this.state === "up" && angle < 110) {
            this.state = "down";
            return { isRep: false, feedback: "Dip low" };
        }
        if (this.state === "down" && angle > 155) {
            const now = Date.now();
            if (now - this.lastRepTime > this.minRepInterval) {
                this.state = "up";
                this.lastRepTime = now;
                return { isRep: true, feedback: "Up" };
            }
        }
        return { isRep: false, feedback: "" };
    }
}

// --- CARDIO EXERCISES ---

class JumpingJack extends Exercise {
    constructor(name) { super(name); this.state = "in"; }

    check(pose) {
        const lAnkle = pose.keypoints.find(k => k.name === 'left_ankle');
        const rAnkle = pose.keypoints.find(k => k.name === 'right_ankle');
        
        if(!lAnkle || !rAnkle) return null;

        // Using X-distance between feet relative to image width
        const feetDist = Math.abs(lAnkle.x - rAnkle.x);
        
        // JUMP OUT (Wide feet)
        if (this.state === "in" && feetDist > 0.35) {
            this.state = "out";
            return { isRep: false, feedback: "Jump!" };
        }
        // JUMP IN (Feet together + Cooldown)
        if (this.state === "out" && feetDist < 0.15) {
            const now = Date.now();
            if (now - this.lastRepTime > 400) { // Fast cardio needs shorter cooldown
                this.state = "in";
                this.lastRepTime = now;
                return { isRep: true, feedback: "Clap!" };
            }
        }
        return { isRep: false, feedback: "" };
    }
}

class HighKnees extends Exercise {
    constructor(name) { super(name); this.state = "down"; }

    check(pose) {
        const lKnee = pose.keypoints.find(k => k.name === 'left_knee');
        const lHip = pose.keypoints.find(k => k.name === 'left_hip');
        
        if (!lKnee || !lHip) return null;

        // Knee goes UP (Y value decreases)
        if (this.state === "down" && lKnee.y < lHip.y) {
             const now = Date.now();
             if (now - this.lastRepTime > 300) { // Very fast
                this.state = "up";
                this.lastRepTime = now;
                return { isRep: true, feedback: "Good!" };
             }
        }
        // Knee goes DOWN
        if (this.state === "up" && lKnee.y > lHip.y + 0.1) {
            this.state = "down";
            return { isRep: false, feedback: "" };
        }
        return { isRep: false, feedback: "Faster!" };
    }
}

class Burpee extends Exercise {
    constructor(name) { super(name); this.state = "up"; }

    check(pose) {
        // Simplified Burpee: Stand -> Head Low (Pushup pos) -> Stand
        const nose = pose.keypoints.find(k => k.name === 'nose');
        if(!nose) return null;

        if (this.state === "up" && nose.y > 0.75) { // Head near floor
            this.state = "down";
            return { isRep: false, feedback: "Push up!" };
        }
        if (this.state === "down" && nose.y < 0.3) { // Head near top
            const now = Date.now();
            if (now - this.lastRepTime > 1000) { // Long cooldown for full burpee
                this.state = "up";
                this.lastRepTime = now;
                return { isRep: true, feedback: "Jump!" };
            }
        }
        return { isRep: false, feedback: "" };
    }
}

// --- STATIC EXERCISES (Timer based) ---
// These don't use 'lastRepTime' for counting, but we keep the class structure

class Plank extends Exercise {
    check(pose) {
        const shoulder = pose.keypoints.find(k => k.name === 'left_shoulder');
        const hip = pose.keypoints.find(k => k.name === 'left_hip');
        const ankle = pose.keypoints.find(k => k.name === 'left_ankle');
        
        // Return valid if pose is good, Script.js handles the timer increment
        const angle = this.calculateAngle(shoulder, hip, ankle);
        
        if (angle < 160) return { isRep: false, feedback: "Lower hips!" };
        if (angle > 200) return { isRep: false, feedback: "Lift hips!" };
        return { isRep: false, feedback: "Perfect Hold" };
    }
}

class WallSit extends Exercise {
    check(pose) {
        const hip = pose.keypoints.find(k => k.name === 'left_hip');
        const knee = pose.keypoints.find(k => k.name === 'left_knee');
        const ankle = pose.keypoints.find(k => k.name === 'left_ankle');
        
        const angle = this.calculateAngle(hip, knee, ankle);
        if (angle > 110) return { isRep: false, feedback: "Sit lower" };
        return { isRep: false, feedback: "Hold it!" };
    }
}

// --- FACTORY ---

const EXERCISE_CLASSES = {
    'squat': Squat,
    'pushup': PushUp,
    'lunge': Lunge,
    'dip': Dip,
    'calfraise': Squat, // Reuse simple up/down logic
    'glutebridge': Squat, // Reuse simple up/down logic
    'jumpingjack': JumpingJack,
    'highknees': HighKnees,
    'burpee': Burpee,
    'plank': Plank,
    'sideplank': Plank, 
    'wallsit': WallSit
};

function createExercise(name) {
    const key = name.toLowerCase().replace(/\s/g, '');
    const ClassRef = EXERCISE_CLASSES[key];
    
    if (ClassRef) {
        return new ClassRef(name);
    } else {
        console.warn(`Exercise class not found for: ${name}, using generic Squat logic.`);
        return new Squat(name);
    }
}
