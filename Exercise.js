/* exercises.js */

/**
 * UTILITY FUNCTIONS
 * Helper math for geometry and keypoint selection
 */
const Utils = {
    // Calculate angle between three points (A-B-C)
    getAngle: (a, b, c) => {
        let radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        return angle > 180.0 ? 360 - angle : angle;
    },

    // Calculate distance between two points
    getDistance: (a, b) => {
        return Math.hypot(a.x - b.x, a.y - b.y);
    },

    // Returns "left" or "right" based on which side of the body has higher confidence scores
    getDominantSide: (pose) => {
        const leftConf = (pose.keypoints[5].score + pose.keypoints[11].score + pose.keypoints[13].score);
        const rightConf = (pose.keypoints[6].score + pose.keypoints[12].score + pose.keypoints[14].score);
        return leftConf > rightConf ? "left" : "right";
    },

    // Get keypoints for the specific side (e.g., Left Knee vs Right Knee)
    getSidePoints: (pose, side) => {
        return side === "left" ? 
        { s: pose.keypoints[5], e: pose.keypoints[7], w: pose.keypoints[9], h: pose.keypoints[11], k: pose.keypoints[13], a: pose.keypoints[15] } : 
        { s: pose.keypoints[6], e: pose.keypoints[8], w: pose.keypoints[10], h: pose.keypoints[12], k: pose.keypoints[14], a: pose.keypoints[16] };
    }
};

/**
 * BASE EXERCISE CLASS
 */
class Exercise {
    constructor() {
        this.count = 0;
        this.status = "start"; // start, active, end
        this.feedback = "Get in position";
        this.type = "reps"; // 'reps' or 'time'
    }

    reset() {
        this.count = 0;
        this.status = "start";
        this.feedback = "Get in position";
    }
    
    // Check if keypoints have enough confidence to process
    isValid(points) {
        return points.every(p => p.score > 0.3);
    }
}

/* ======================================================================
   CATEGORY A: HINGE & SQUAT MOVEMENTS (Angle Tracking)
   ====================================================================== */

// 1. SQUATS
class Squat extends Exercise {
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        if (!this.isValid([p.h, p.k, p.a])) return;

        const angle = Utils.getAngle(p.h, p.k, p.a); // Hip-Knee-Ankle

        if (angle > 165) {
            if (this.status === "down") {
                this.count++;
                this.feedback = "Good Rep!";
            }
            this.status = "up";
        } else if (angle < 100) {
            this.status = "down";
            this.feedback = "Deep enough!";
        } else if (angle < 140 && this.status === "up") {
            this.feedback = "Lower...";
        }
    }
}

// 2. PUSH-UPS
class PushUp extends Exercise {
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        if (!this.isValid([p.s, p.e, p.w])) return;

        const angle = Utils.getAngle(p.s, p.e, p.w); // Shoulder-Elbow-Wrist

        if (angle > 160) {
            if (this.status === "down") {
                this.count++;
                this.feedback = "Up!";
            }
            this.status = "up";
        } else if (angle < 90) {
            this.status = "down";
            this.feedback = "Good depth!";
        }
    }
}

// 3. LUNGES
class Lunge extends Exercise {
    update(pose) {
        // Detects the leg that is FORWARD. 
        // Logic: Forward leg knee bends to ~90, Back leg drops.
        const left = Utils.getSidePoints(pose, "left");
        const right = Utils.getSidePoints(pose, "right");
        
        // Use the side with the sharper knee angle as the "working" leg
        const leftAngle = Utils.getAngle(left.h, left.k, left.a);
        const rightAngle = Utils.getAngle(right.h, right.k, right.a);
        
        const workingAngle = (leftAngle < rightAngle) ? leftAngle : rightAngle;

        if (workingAngle > 160) {
            if (this.status === "down") {
                this.count++;
                this.feedback = "Nice lunge!";
            }
            this.status = "up";
        } else if (workingAngle < 100) {
            this.status = "down";
            this.feedback = "Hold...";
        }
    }
}

// 4. DIPS (Tricep Dips)
class Dip extends Exercise {
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        if (!this.isValid([p.s, p.e, p.w])) return;

        const armAngle = Utils.getAngle(p.s, p.e, p.w);

        // Arms straight vs Arms bent
        if (armAngle > 160) {
            if (this.status === "down") {
                this.count++;
                this.feedback = "Push up!";
            }
            this.status = "up";
        } else if (armAngle < 100) {
            this.status = "down";
            this.feedback = "Deep...";
        }
    }
}

// 5. SIT-UPS
class SitUp extends Exercise {
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        if (!this.isValid([p.s, p.h, p.k])) return;

        // Angle between Shoulder-Hip-Knee
        const torsoAngle = Utils.getAngle(p.s, p.h, p.k);

        // 180 is lying flat, < 80 is sitting up
        if (torsoAngle > 120) { // adjusted for user flexibility
            this.status = "down";
            this.feedback = "Crunch up!";
        } else if (torsoAngle < 60) {
            if (this.status === "down") {
                this.count++;
                this.feedback = "Great core work!";
            }
            this.status = "up";
        }
    }
}

// 6. LEG RAISES
class LegRaise extends Exercise {
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        if (!this.isValid([p.s, p.h, p.k])) return;

        // Angle between Shoulder-Hip-Knee (legs moving relative to torso)
        const hipAngle = Utils.getAngle(p.s, p.h, p.k);

        if (hipAngle > 170) {
            this.status = "down";
            this.feedback = "Lift legs!";
        } else if (hipAngle < 100) {
            if (this.status === "down") {
                this.count++;
                this.feedback = "Control down...";
            }
            this.status = "up";
        }
    }
}

// 7. DONKEY KICKS
class DonkeyKick extends Exercise {
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        
        // Track Hip Extension: Angle Shoulder-Hip-Knee
        // 90 degrees is starting (all fours), 160+ is leg extended back
        const hipAngle = Utils.getAngle(p.s, p.h, p.k);

        if (hipAngle < 100) {
            this.status = "in";
            this.feedback = "Kick back!";
        } else if (hipAngle > 160) {
            if (this.status === "in") {
                this.count++;
                this.feedback = "Squeeze glute!";
            }
            this.status = "out";
        }
    }
}

// 8. CALF RAISES
class CalfRaise extends Exercise {
    update(pose) {
        // Hard to detect toe angle. Detecting Vertical Rise of Eye/Nose
        // Requires user to stand relatively still horizontally
        const nose = pose.keypoints[0];
        
        if (!this.baseY) this.baseY = nose.y; // Calibration on first frame

        // Reset calibration if user moves too much
        if (nose.score < 0.5) return;

        // Threshold: 30 pixels up (Y decreases)
        if (nose.y > this.baseY - 10) {
            this.status = "down";
            this.baseY = (this.baseY * 0.9) + (nose.y * 0.1); // Slow adapt
        } else if (nose.y < this.baseY - 40) { // Went up
            if (this.status === "down") {
                this.count++;
                this.feedback = "High heels!";
            }
            this.status = "up";
        }
    }
}

/* ======================================================================
   CATEGORY B: VERTICAL / CARDIO (Height & Separation Tracking)
   ====================================================================== */

// 9. JUMPING JACKS
class JumpingJack extends Exercise {
    update(pose) {
        const l_w = pose.keypoints[9]; // Left Wrist
        const r_w = pose.keypoints[10]; // Right Wrist
        const nose = pose.keypoints[0];
        const l_a = pose.keypoints[15];
        const r_a = pose.keypoints[16];

        if(!this.isValid([l_w, r_w, l_a, r_a])) return;

        // Star Phase: Wrists above nose AND legs wide
        const handsUp = (l_w.y < nose.y) && (r_w.y < nose.y);
        const legsWide = Math.abs(l_a.x - r_a.x) > 150; // Threshold pixels

        if (handsUp && legsWide) {
            this.status = "star";
            this.feedback = "Together!";
        } else if (!handsUp && !legsWide) {
            if (this.status === "star") {
                this.count++;
                this.feedback = "Go!";
            }
            this.status = "pencil";
        }
    }
}

// 10. HIGH KNEES
class HighKnees extends Exercise {
    update(pose) {
        const l_k = pose.keypoints[13];
        const r_k = pose.keypoints[14];
        const l_h = pose.keypoints[11];
        const r_h = pose.keypoints[12];

        // Check if ANY knee is above corresponding hip
        const leftUp = l_k.y < l_h.y;
        const rightUp = r_k.y < r_h.y;

        if (leftUp || rightUp) {
            if (this.status === "down") {
                this.count++;
                this.feedback = "Higher!";
            }
            this.status = "up";
        } else {
            this.status = "down";
        }
    }
}

// 11. BUTT KICKS
class ButtKicks extends Exercise {
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        
        // Heel (Ankle) comes close to Hip in Y axis, or Knee bends completely
        const angle = Utils.getAngle(p.h, p.k, p.a);

        if (angle < 45) { // Maximum knee flexion
            if (this.status === "down") {
                this.count++;
                this.feedback = "Kick!";
            }
            this.status = "up";
        } else if (angle > 120) {
            this.status = "down";
        }
    }
}

// 12. SQUAT JUMPS
class SquatJump extends Exercise {
    update(pose) {
        // Use Squat Logic + Height check
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        
        const angle = Utils.getAngle(p.h, p.k, p.a);
        
        // Detect Deep Squat
        if (angle < 100) {
            this.status = "squat";
            this.feedback = "EXPLODE UP!";
        } 
        // Detect Extension (Jump)
        else if (angle > 170 && this.status === "squat") {
             this.count++;
             this.status = "jump";
             this.feedback = "Land Softly";
        }
    }
}

// 13. BOX JUMPS (Simulated - detecting hip elevation)
class BoxJump extends Exercise {
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const hip = Utils.getSidePoints(pose, side).h;
        
        if (!this.floorY) this.floorY = hip.y;

        // Reset floor occasionally
        if (hip.y > this.floorY) this.floorY = hip.y;

        // Jump Detection: Hip rises significantly (150px) quickly
        if (this.floorY - hip.y > 150) {
            if (this.status === "ground") {
                this.count++;
                this.feedback = "On Box!";
            }
            this.status = "air";
        } else if (this.floorY - hip.y < 50) {
            this.status = "ground";
            this.feedback = "Jump!";
        }
    }
}

/* ======================================================================
   CATEGORY C: STATIC HOLDS (Time-based, Alignment)
   ====================================================================== */

// 14. PLANK
class Plank extends Exercise {
    constructor() {
        super();
        this.type = "time";
    }
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        if(!this.isValid([p.s, p.h, p.a])) return;

        const angle = Utils.getAngle(p.s, p.h, p.a);

        // Valid Plank: Body is straight (165-195 degrees)
        if (angle > 165 && angle < 195) {
            if (!this.startTime) this.startTime = Date.now();
            this.count = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.feedback = "Hold...";
        } else {
            this.startTime = null;
            if (angle <= 165) this.feedback = "Lower Hips";
            else this.feedback = "Lift Hips";
        }
    }
}

// 15. SIDE PLANK
class SidePlank extends Exercise {
    constructor() {
        super();
        this.type = "time";
    }
    update(pose) {
        // Logic is identical to Plank, but user is facing camera differently. 
        // MoveNet usually handles 2D projection well enough.
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        if(!this.isValid([p.s, p.h, p.a])) return;

        const angle = Utils.getAngle(p.s, p.h, p.a);
        
        if (angle > 160 && angle < 200) {
             if (!this.startTime) this.startTime = Date.now();
            this.count = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.feedback = "Stay strong";
        } else {
            this.startTime = null;
            this.feedback = "Align body";
        }
    }
}

// 16. WALL SIT
class WallSit extends Exercise {
    constructor() {
        super();
        this.type = "time";
    }
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        if(!this.isValid([p.h, p.k, p.a])) return;

        const angle = Utils.getAngle(p.h, p.k, p.a);

        // Knee should be ~90 degrees
        if (angle > 80 && angle < 110) {
             if (!this.startTime) this.startTime = Date.now();
            this.count = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.feedback = "Burn!";
        } else {
            this.startTime = null;
            this.feedback = "Knees at 90°";
        }
    }
}

// 17. GLUTE BRIDGE HOLD
class GluteBridge extends Exercise {
    constructor() {
        super();
        this.type = "time";
    }
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        
        // Line from Shoulder to Knee should be straight at top
        const angle = Utils.getAngle(p.s, p.h, p.k);

        if (angle > 160) {
            if (!this.startTime) this.startTime = Date.now();
            this.count = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.feedback = "Squeeze!";
        } else {
            this.startTime = null;
            this.feedback = "Hips higher";
        }
    }
}

/* ======================================================================
   CATEGORY D: COMPLEX / CROSS-BODY
   ====================================================================== */

// 18. BICYCLE CRUNCHES
class BicycleCrunch extends Exercise {
    update(pose) {
        const l_elbow = pose.keypoints[7];
        const r_knee = pose.keypoints[14];
        const r_elbow = pose.keypoints[8];
        const l_knee = pose.keypoints[13];

        // Distance Check: Left Elbow meets Right Knee
        const dist1 = Utils.getDistance(l_elbow, r_knee);
        const dist2 = Utils.getDistance(r_elbow, l_knee);

        // Threshold 80 pixels (adjust based on resolution)
        if (dist1 < 100 || dist2 < 100) {
            if (this.status === "open") {
                this.count++;
                this.feedback = "Twist!";
            }
            this.status = "close";
        } else {
            this.status = "open";
        }
    }
}

// 19. MOUNTAIN CLIMBERS
class MountainClimber extends Exercise {
    update(pose) {
        // Similar to high knees but in plank position (Horizontal)
        // Check Knee X position relative to Hip X position
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        
        // In plank, head is far from feet. 
        // Rep counts when Knee gets close to Elbow
        const dist = Utils.getDistance(p.k, p.e);

        if (dist < 150) {
             if (this.status === "back") {
                this.count++;
                this.feedback = "Fast!";
            }
            this.status = "front";
        } else {
            this.status = "back";
        }
    }
}

// 20. BURPEES
class Burpee extends Exercise {
    // 3 States: Stand -> Plank -> Stand
    constructor() {
        super();
        this.burpeeState = 0; // 0: Stand, 1: Plank, 2: Jumping up
    }
    
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        const bodyAngle = Utils.getAngle(p.s, p.h, p.a); // Straight body?

        // 1. Standing Phase
        if (this.burpeeState === 0 && bodyAngle > 165 && p.h.y < 300) {
            this.feedback = "Drop down!";
        }
        
        // 2. Plank Phase (Hips low, body straight-ish)
        // Detect if hips dropped significantly
        if (this.burpeeState === 0 && p.h.y > 350) {
            this.burpeeState = 1;
            this.feedback = "Kick feet back!";
        }
        
        // 3. Return to Stand
        if (this.burpeeState === 1 && p.h.y < 300 && bodyAngle > 160) {
            this.count++;
            this.burpeeState = 0;
            this.feedback = "Jump!";
        }
    }
}

/**
 * EXERCISE MANAGER
 * Handles switching between exercises
 */
const ExerciseManager = {
    exercises: {
        "squat": new Squat(),
        "pushup": new PushUp(),
        "lunge": new Lunge(),
        "dip": new Dip(),
        "situp": new SitUp(),
        "legraise": new LegRaise(),
        "donkeykick": new DonkeyKick(),
        "calfraise": new CalfRaise(),
        "jumpingjack": new JumpingJack(),
        "highknees": new HighKnees(),
        "buttkicks": new ButtKicks(),
        "squatjump": new SquatJump(),
        "boxjump": new BoxJump(),
        "plank": new Plank(),
        "sideplank": new SidePlank(),
        "wallsit": new WallSit(),
        "glutebridge": new GluteBridge(),
        "bicycle": new BicycleCrunch(),
        "climbers": new MountainClimber(),
        "burpee": new Burpee()
    },
    
    currentExerciseName: "squat",

    getCurrent: function() {
        return this.exercises[this.currentExerciseName];
    },

    switch: function(name) {
        if (this.exercises[name]) {
            this.currentExerciseName = name;
            this.exercises[name].reset();
            console.log("Switched to " + name);
        } else {
            console.error("Exercise not found:", name);
        }
    },
    
    getOptions: function() {
        return Object.keys(this.exercises);
    }
};