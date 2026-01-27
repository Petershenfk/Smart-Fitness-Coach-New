/**
 * Exercise.js
 * Definitions for counting reps and checking form for specific exercises.
 */

class Exercise {
    constructor(name) {
        this.name = name;
        this.state = "up"; // 'up' or 'down'
        this.feedback = "";
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

// --- STRENGTH: LOWER BODY ---

class Squat extends Exercise {
    check(pose) {
        const hip = pose.keypoints.find(k => k.name === 'left_hip');
        const knee = pose.keypoints.find(k => k.name === 'left_knee');
        const ankle = pose.keypoints.find(k => k.name === 'left_ankle');
        
        if (!hip || !knee || !ankle) return null;

        const angle = this.calculateAngle(hip, knee, ankle);
        
        if (this.state === "up" && angle < 100) {
            this.state = "down";
            return { isRep: false, feedback: "Good depth!" };
        } 
        if (this.state === "down" && angle > 160) {
            this.state = "up";
            return { isRep: true, feedback: "Up" };
        }
        return { isRep: false, feedback: angle < 120 ? "Hold..." : "Go Lower" };
    }
}

class Lunge extends Exercise {
    check(pose) {
        // Simplified: Uses similar logic to squat but allows wider angles
        const lHip = pose.keypoints.find(k => k.name === 'left_hip');
        const lKnee = pose.keypoints.find(k => k.name === 'left_knee');
        const lAnkle = pose.keypoints.find(k => k.name === 'left_ankle');
        
        const angle = this.calculateAngle(lHip, lKnee, lAnkle);
        
        if (this.state === "up" && angle < 110) {
            this.state = "down";
            return { isRep: false, feedback: "Nice Lunge" };
        }
        if (this.state === "down" && angle > 160) {
            this.state = "up";
            return { isRep: true, feedback: "Up" };
        }
        return { isRep: false, feedback: "" };
    }
}

class CalfRaise extends Exercise {
    check(pose) {
        // Detects vertical movement of the ankle/heel relative to knee
        // This is tricky with 2D video, using simplified vertical toggle
        const ankle = pose.keypoints.find(k => k.name === 'left_ankle');
        if (!ankle) return null;

        // Use arbitrary Y thresholds based on screen position (normalized 0-1)
        // Note: Real-world usage requires calibration, simplified here
        if (this.state === "down" && ankle.y < 0.8) { 
            this.state = "up"; 
            return { isRep: false, feedback: "Hold top" };
        }
        if (this.state === "up" && ankle.y > 0.85) {
            this.state = "down";
            return { isRep: true, feedback: "Down" };
        }
        return { isRep: false, feedback: "" };
    }
}

// --- STRENGTH: UPPER BODY ---

class PushUp extends Exercise {
    check(pose) {
        const shoulder = pose.keypoints.find(k => k.name === 'left_shoulder');
        const elbow = pose.keypoints.find(k => k.name === 'left_elbow');
        const wrist = pose.keypoints.find(k => k.name === 'left_wrist');
        
        const angle = this.calculateAngle(shoulder, elbow, wrist);

        if (this.state === "up" && angle < 90) {
            this.state = "down";
            return { isRep: false, feedback: "Push!" };
        }
        if (this.state === "down" && angle > 160) {
            this.state = "up";
            return { isRep: true, feedback: "Up" };
        }
        return { isRep: false, feedback: "Keep back straight" };
    }
}

class Dip extends Exercise {
    check(pose) {
        // Similar to pushup but vertical
        const shoulder = pose.keypoints.find(k => k.name === 'left_shoulder');
        const elbow = pose.keypoints.find(k => k.name === 'left_elbow');
        const wrist = pose.keypoints.find(k => k.name === 'left_wrist');
        
        const angle = this.calculateAngle(shoulder, elbow, wrist);

        if (this.state === "up" && angle < 100) {
            this.state = "down";
            return { isRep: false, feedback: "Deep dip" };
        }
        if (this.state === "down" && angle > 150) {
            this.state = "up";
            return { isRep: true, feedback: "Up" };
        }
        return { isRep: false, feedback: "" };
    }
}

// --- CARDIO / DYNAMIC ---

class JumpingJack extends Exercise {
    check(pose) {
        const lAnkle = pose.keypoints.find(k => k.name === 'left_ankle');
        const rAnkle = pose.keypoints.find(k => k.name === 'right_ankle');
        const lWrist = pose.keypoints.find(k => k.name === 'left_wrist');
        const rWrist = pose.keypoints.find(k => k.name === 'right_wrist');

        if(!lAnkle || !rAnkle) return null;

        // X distance between feet
        const feetDist = Math.abs(lAnkle.x - rAnkle.x);
        
        // State 1: Feet Together (Start)
        if (this.state === "out" && feetDist < 0.15) {
            this.state = "in";
            return { isRep: true, feedback: "Clap!" };
        }
        // State 2: Feet Apart (Jump)
        if (this.state === "in" && feetDist > 0.35) {
            this.state = "out";
            return { isRep: false, feedback: "Jump!" };
        }
        return { isRep: false, feedback: "" };
    }
}

class HighKnees extends Exercise {
    check(pose) {
        const lKnee = pose.keypoints.find(k => k.name === 'left_knee');
        const lHip = pose.keypoints.find(k => k.name === 'left_hip');
        
        // Check if knee goes above hip level (Y is smaller when higher)
        if (this.state === "down" && lKnee.y < lHip.y) {
            this.state = "up";
            return { isRep: true, feedback: "Good!" };
        }
        if (this.state === "up" && lKnee.y > lHip.y + 0.1) {
            this.state = "down";
            return { isRep: false, feedback: "" };
        }
        return { isRep: false, feedback: "Faster!" };
    }
}

class Burpee extends Exercise {
    check(pose) {
        // Complex state machine: Stand -> Plank -> Stand
        // Simplified: Checking head height variation
        const nose = pose.keypoints.find(k => k.name === 'nose');
        if(!nose) return null;

        if (this.state === "up" && nose.y > 0.7) { // Head near floor
            this.state = "down";
            return { isRep: false, feedback: "Push up!" };
        }
        if (this.state === "down" && nose.y < 0.3) { // Head near top
            this.state = "up";
            return { isRep: true, feedback: "Jump!" };
        }
        return { isRep: false, feedback: "" };
    }
}

// --- STATIC (TIMED) EXERCISES ---
// These don't return "isRep: true". Script.js handles the timer.
// These just return feedback on form.

class Plank extends Exercise {
    check(pose) {
        const shoulder = pose.keypoints.find(k => k.name === 'left_shoulder');
        const hip = pose.keypoints.find(k => k.name === 'left_hip');
        const ankle = pose.keypoints.find(k => k.name === 'left_ankle');
        
        const angle = this.calculateAngle(shoulder, hip, ankle);
        
        if (angle < 160) return { isRep: false, feedback: "Lower hips!" };
        if (angle > 190) return { isRep: false, feedback: "Lift hips!" };
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

// --- EXPORT FACTORY ---
const EXERCISE_CLASSES = {
    'squat': Squat,
    'pushup': PushUp,
    'lunge': Lunge,
    'calfraise': CalfRaise,
    'dip': Dip,
    'jumpingjack': JumpingJack,
    'highknees': HighKnees,
    'burpee': Burpee,
    'plank': Plank,
    'sideplank': Plank, // Reuse plank logic for now
    'wallsit': WallSit,
    'glutebridge': Squat // Reuse logic or add specific class
};

function createExercise(name) {
    // Normalize name to key (remove spaces, lowercase)
    const key = name.toLowerCase().replace(/\s/g, '');
    const ClassRef = EXERCISE_CLASSES[key];
    
    if (ClassRef) {
        return new ClassRef(name);
    } else {
        console.warn(`Exercise class not found for: ${name}, using generic.`);
        return new Squat(name); // Fallback to avoid crash
    }
}
