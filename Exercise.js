/* ======================================================================
   SECTION 1: CONFIGURATION & MATH UTILITIES
   ====================================================================== */

const CONFIG = {
    videoWidth: 640,
    videoHeight: 480,
    aiFps: 10, // Run AI 10 times per second (Performance mode)
};

// Global State
let detector;
let video;
let canvas, ctx;
let lastVideoTime = 0;
let lastAiTime = 0;
let lastPose = null;

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

    // Get keypoints for the specific side
    getSidePoints: (pose, side) => {
        return side === "left" ? 
        { s: pose.keypoints[5], e: pose.keypoints[7], w: pose.keypoints[9], h: pose.keypoints[11], k: pose.keypoints[13], a: pose.keypoints[15] } : 
        { s: pose.keypoints[6], e: pose.keypoints[8], w: pose.keypoints[10], h: pose.keypoints[12], k: pose.keypoints[14], a: pose.keypoints[16] };
    },

    // Check if keypoints have enough confidence to process
    isValid: (points) => {
        return points.every(p => p.score > 0.3);
    }
};

/* ======================================================================
   SECTION 2: EXERCISE LIBRARY (Logic)
   ====================================================================== */

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
        this.startTime = null;
    }
    
    isValid(points) {
        return Utils.isValid(points);
    }
}

// --- CATEGORY A: HINGE & SQUAT MOVEMENTS ---

// 1. SQUATS
class Squat extends Exercise {
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        if (!this.isValid([p.h, p.k, p.a])) return;

        const angle = Utils.getAngle(p.h, p.k, p.a);

        if (angle > 165) {
            if (this.status === "down") { this.count++; this.feedback = "Good Rep!"; }
            this.status = "up";
        } else if (angle < 100) {
            this.status = "down"; this.feedback = "Deep enough!";
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

        const angle = Utils.getAngle(p.s, p.e, p.w);

        if (angle > 160) {
            if (this.status === "down") { this.count++; this.feedback = "Up!"; }
            this.status = "up";
        } else if (angle < 90) {
            this.status = "down"; this.feedback = "Good depth!";
        }
    }
}

// 3. LUNGES
class Lunge extends Exercise {
    update(pose) {
        const left = Utils.getSidePoints(pose, "left");
        const right = Utils.getSidePoints(pose, "right");
        
        const leftAngle = Utils.getAngle(left.h, left.k, left.a);
        const rightAngle = Utils.getAngle(right.h, right.k, right.a);
        const workingAngle = (leftAngle < rightAngle) ? leftAngle : rightAngle;

        if (workingAngle > 160) {
            if (this.status === "down") { this.count++; this.feedback = "Nice lunge!"; }
            this.status = "up";
        } else if (workingAngle < 100) {
            this.status = "down"; this.feedback = "Hold...";
        }
    }
}

// 4. DIPS
class Dip extends Exercise {
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        if (!this.isValid([p.s, p.e, p.w])) return;

        const armAngle = Utils.getAngle(p.s, p.e, p.w);

        if (armAngle > 160) {
            if (this.status === "down") { this.count++; this.feedback = "Push up!"; }
            this.status = "up";
        } else if (armAngle < 100) {
            this.status = "down"; this.feedback = "Deep...";
        }
    }
}

// 5. SIT-UPS
class SitUp extends Exercise {
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        if (!this.isValid([p.s, p.h, p.k])) return;

        const torsoAngle = Utils.getAngle(p.s, p.h, p.k);

        if (torsoAngle > 120) {
            this.status = "down"; this.feedback = "Crunch up!";
        } else if (torsoAngle < 60) {
            if (this.status === "down") { this.count++; this.feedback = "Great core work!"; }
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

        const hipAngle = Utils.getAngle(p.s, p.h, p.k);

        if (hipAngle > 170) {
            this.status = "down"; this.feedback = "Lift legs!";
        } else if (hipAngle < 100) {
            if (this.status === "down") { this.count++; this.feedback = "Control down..."; }
            this.status = "up";
        }
    }
}

// 7. DONKEY KICKS
class DonkeyKick extends Exercise {
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        const hipAngle = Utils.getAngle(p.s, p.h, p.k);

        if (hipAngle < 100) {
            this.status = "in"; this.feedback = "Kick back!";
        } else if (hipAngle > 160) {
            if (this.status === "in") { this.count++; this.feedback = "Squeeze glute!"; }
            this.status = "out";
        }
    }
}

// 8. CALF RAISES
class CalfRaise extends Exercise {
    update(pose) {
        const nose = pose.keypoints[0];
        if (!this.baseY) this.baseY = nose.y;
        if (nose.score < 0.5) return;

        if (nose.y > this.baseY - 10) {
            this.status = "down";
            this.baseY = (this.baseY * 0.9) + (nose.y * 0.1);
        } else if (nose.y < this.baseY - 40) {
            if (this.status === "down") { this.count++; this.feedback = "High heels!"; }
            this.status = "up";
        }
    }
}

// --- CATEGORY B: VERTICAL / CARDIO ---

// 9. JUMPING JACKS
class JumpingJack extends Exercise {
    update(pose) {
        const l_w = pose.keypoints[9], r_w = pose.keypoints[10];
        const nose = pose.keypoints[0];
        const l_a = pose.keypoints[15], r_a = pose.keypoints[16];

        if(!this.isValid([l_w, r_w, l_a, r_a])) return;

        const handsUp = (l_w.y < nose.y) && (r_w.y < nose.y);
        const legsWide = Math.abs(l_a.x - r_a.x) > 150;

        if (handsUp && legsWide) {
            this.status = "star"; this.feedback = "Together!";
        } else if (!handsUp && !legsWide) {
            if (this.status === "star") { this.count++; this.feedback = "Go!"; }
            this.status = "pencil";
        }
    }
}

// 10. HIGH KNEES
class HighKnees extends Exercise {
    update(pose) {
        const l_k = pose.keypoints[13], r_k = pose.keypoints[14];
        const l_h = pose.keypoints[11], r_h = pose.keypoints[12];
        const leftUp = l_k.y < l_h.y;
        const rightUp = r_k.y < r_h.y;

        if (leftUp || rightUp) {
            if (this.status === "down") { this.count++; this.feedback = "Higher!"; }
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
        const angle = Utils.getAngle(p.h, p.k, p.a);

        if (angle < 45) {
            if (this.status === "down") { this.count++; this.feedback = "Kick!"; }
            this.status = "up";
        } else if (angle > 120) {
            this.status = "down";
        }
    }
}

// 12. SQUAT JUMPS
class SquatJump extends Exercise {
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        const angle = Utils.getAngle(p.h, p.k, p.a);
        
        if (angle < 100) {
            this.status = "squat"; this.feedback = "EXPLODE UP!";
        } else if (angle > 170 && this.status === "squat") {
             this.count++; this.status = "jump"; this.feedback = "Land Softly";
        }
    }
}

// 13. BOX JUMPS
class BoxJump extends Exercise {
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const hip = Utils.getSidePoints(pose, side).h;
        
        if (!this.floorY) this.floorY = hip.y;
        if (hip.y > this.floorY) this.floorY = hip.y;

        if (this.floorY - hip.y > 150) {
            if (this.status === "ground") { this.count++; this.feedback = "On Box!"; }
            this.status = "air";
        } else if (this.floorY - hip.y < 50) {
            this.status = "ground"; this.feedback = "Jump!";
        }
    }
}

// --- CATEGORY C: STATIC HOLDS ---

// 14. PLANK
class Plank extends Exercise {
    constructor() { super(); this.type = "time"; }
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        if(!this.isValid([p.s, p.h, p.a])) return;

        const angle = Utils.getAngle(p.s, p.h, p.a);
        if (angle > 165 && angle < 195) {
            if (!this.startTime) this.startTime = Date.now();
            this.count = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.feedback = "Hold...";
        } else {
            this.startTime = null;
            this.feedback = angle <= 165 ? "Lower Hips" : "Lift Hips";
        }
    }
}

// 15. SIDE PLANK
class SidePlank extends Exercise {
    constructor() { super(); this.type = "time"; }
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        if(!this.isValid([p.s, p.h, p.a])) return;

        const angle = Utils.getAngle(p.s, p.h, p.a);
        if (angle > 160 && angle < 200) {
             if (!this.startTime) this.startTime = Date.now();
            this.count = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.feedback = "Stay strong";
        } else {
            this.startTime = null; this.feedback = "Align body";
        }
    }
}

// 16. WALL SIT
class WallSit extends Exercise {
    constructor() { super(); this.type = "time"; }
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        if(!this.isValid([p.h, p.k, p.a])) return;

        const angle = Utils.getAngle(p.h, p.k, p.a);
        if (angle > 80 && angle < 110) {
             if (!this.startTime) this.startTime = Date.now();
            this.count = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.feedback = "Burn!";
        } else {
            this.startTime = null; this.feedback = "Knees at 90°";
        }
    }
}

// 17. GLUTE BRIDGE HOLD
class GluteBridge extends Exercise {
    constructor() { super(); this.type = "time"; }
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        const angle = Utils.getAngle(p.s, p.h, p.k);
        if (angle > 160) {
            if (!this.startTime) this.startTime = Date.now();
            this.count = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.feedback = "Squeeze!";
        } else {
            this.startTime = null; this.feedback = "Hips higher";
        }
    }
}

// --- CATEGORY D: COMPLEX / CROSS-BODY ---

// 18. BICYCLE CRUNCHES
class BicycleCrunch extends Exercise {
    update(pose) {
        const le = pose.keypoints[7], rk = pose.keypoints[14];
        const re = pose.keypoints[8], lk = pose.keypoints[13];
        const d1 = Utils.getDistance(le, rk), d2 = Utils.getDistance(re, lk);

        if (d1 < 100 || d2 < 100) {
            if (this.status === "open") { this.count++; this.feedback = "Twist!"; }
            this.status = "close";
        } else {
            this.status = "open";
        }
    }
}

// 19. MOUNTAIN CLIMBERS
class MountainClimber extends Exercise {
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        const dist = Utils.getDistance(p.k, p.e);

        if (dist < 150) {
             if (this.status === "back") { this.count++; this.feedback = "Fast!"; }
            this.status = "front";
        } else {
            this.status = "back";
        }
    }
}

// 20. BURPEES
class Burpee extends Exercise {
    constructor() { super(); this.burpeeState = 0; }
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        const bodyAngle = Utils.getAngle(p.s, p.h, p.a);

        if (this.burpeeState === 0 && bodyAngle > 165 && p.h.y < 300) {
            this.feedback = "Drop down!";
        }
        if (this.burpeeState === 0 && p.h.y > 350) {
            this.burpeeState = 1; this.feedback = "Kick feet back!";
        }
        if (this.burpeeState === 1 && p.h.y < 300 && bodyAngle > 160) {
            this.count++; this.burpeeState = 0; this.feedback = "Jump!";
        }
    }
}

// --- ADDITIONAL EXERCISES FOR ROUTINES (Needed for Warmup/Stretch) ---
// These are added to ensure the RoutineSystem logic below works correctly.

class SideStretch extends Exercise {
    constructor() { super(); this.type = "time"; }
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        const bodyAngle = Utils.getAngle(p.s, p.h, p.a);
        if (p.w.y < p.s.y && (bodyAngle < 160 || bodyAngle > 200)) {
            if (!this.startTime) this.startTime = Date.now();
            this.count = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.feedback = "Feel the stretch";
        } else { this.startTime = null; this.feedback = "Lean & Reach"; }
    }
}

class ForwardFold extends Exercise {
    constructor() { super(); this.type = "time"; }
    update(pose) {
        const side = Utils.getDominantSide(pose);
        const p = Utils.getSidePoints(pose, side);
        if (p.s.y > p.h.y + 30) { 
            if (!this.startTime) this.startTime = Date.now();
            this.count = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.feedback = "Breathe...";
        } else { this.startTime = null; this.feedback = "Touch Toes"; }
    }
}

/* ======================================================================
   SECTION 3: MANAGERS
   ====================================================================== */

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
        "burpee": new Burpee(),
        // Added for Routines
        "sidestretch": new SideStretch(),
        "forwardfold": new ForwardFold()
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

const RoutineSystem = {
    active: false,
    queue: [],
    index: 0,
    timer: 0,
    lastTick: 0,
    
    routines: {
        warmup: [
            { name: 'jumpingjack', time: 30, label: "Warm Up: Jacks" },
            { name: 'highknees', time: 30, label: "Warm Up: Knees" },
            { name: 'squat', time: 30, label: "Leg Activation" }
        ],
        stretch: [
            { name: 'forwardfold', time: 20, label: "Hamstrings" },
            { name: 'sidestretch', time: 20, label: "Side Body" },
            { name: 'wallsit', time: 20, label: "Final Hold" }
        ]
    },

    start: function(type) {
        if (!this.routines[type]) return;
        this.active = true;
        this.queue = this.routines[type];
        this.index = 0;
        document.getElementById('exercise-controls').style.display = 'none';
        this.loadStep();
    },

    stop: function() {
        this.active = false;
        this.queue = [];
        document.getElementById('exercise-controls').style.display = 'block';
        ExerciseManager.switch('squat');
    },

    loadStep: function() {
        if (this.index >= this.queue.length) {
            this.stop();
            alert("Routine Complete!");
            return;
        }
        const step = this.queue[this.index];
        this.timer = step.time;
        this.lastTick = Date.now();
        ExerciseManager.switch(step.name);
    },

    update: function() {
        if (!this.active) return;
        const now = Date.now();
        if (now - this.lastTick > 1000) {
            this.timer--;
            this.lastTick = now;
            if (this.timer <= 0) {
                this.index++;
                this.loadStep();
            }
        }
    }
};

/* ======================================================================
   SECTION 4: INITIALIZATION & APP LOOP
   ====================================================================== */

async function init() {
    // 1. Setup Camera
    video = document.getElementById('video');
    video.width = CONFIG.videoWidth;
    video.height = CONFIG.videoHeight;
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
            'audio': false,
            'video': { width: CONFIG.videoWidth, height: CONFIG.videoHeight }
        });
        video.srcObject = stream;
        
        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });
    }

    // 2. Setup Canvas
    canvas = document.getElementById('output');
    canvas.width = CONFIG.videoWidth;
    canvas.height = CONFIG.videoHeight;
    ctx = canvas.getContext('2d');

    // 3. Load MoveNet Model
    console.log("Loading MoveNet...");
    const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
    };
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
    console.log("MoveNet Loaded.");

    // 4. Setup Controls
    setupControls();

    // 5. Start Loop
    renderLoop();
}

function setupControls() {
    const select = document.getElementById('exercise-select');
    if (select) {
        const options = ExerciseManager.getOptions();
        options.forEach(opt => {
            const el = document.createElement("option");
            el.value = opt;
            el.text = opt.charAt(0).toUpperCase() + opt.slice(1);
            select.appendChild(el);
        });
        select.addEventListener('change', (e) => {
            ExerciseManager.switch(e.target.value);
        });
    }
}

async function renderLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Video
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 2. Run AI Detection (Throttled)
    if (timestamp - lastAiTime > (1000 / CONFIG.aiFps)) {
        if (detector && video.readyState === 4) {
            try {
                const poses = await detector.estimatePoses(video);
                if (poses && poses.length > 0) {
                    lastPose = poses[0];
                    
                    // Update Routine System
                    if (typeof RoutineSystem !== 'undefined') {
                        RoutineSystem.update();
                    }
                    
                    // Update Exercise Logic
                    const activeExercise = ExerciseManager.getCurrent();
                    activeExercise.update(lastPose);
                }
            } catch (error) {
                console.error("AI Error:", error);
            }
        }
        lastAiTime = timestamp;
    }

    // 3. Draw UI & Skeleton
    if (lastPose) {
        drawSkeleton(lastPose);
        drawUI();
    }

    requestAnimationFrame(renderLoop);
}

// =======================
// DRAWING HELPERS
// =======================

function drawSkeleton(pose) {
    const exercise = ExerciseManager.getCurrent();
    
    let color = '#00FF00'; // Green
    if (exercise.status === 'down' || exercise.status === 'star' || exercise.status === 'in') {
        color = '#FFFF00'; // Yellow
    }

    const connections = [
        [5, 7], [7, 9],       // Left Arm
        [6, 8], [8, 10],      // Right Arm
        [5, 6],               // Shoulders
        [5, 11], [6, 12],     // Torso
        [11, 12],             // Hips
        [11, 13], [13, 15],   // Left Leg
        [12, 14], [14, 16]    // Right Leg
    ];

    connections.forEach(([i, j]) => {
        const kp1 = pose.keypoints[i];
        const kp2 = pose.keypoints[j];
        if (kp1.score > 0.3 && kp2.score > 0.3) {
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.stroke();
        }
    });

    pose.keypoints.forEach(kp => {
        if (kp.score > 0.3) {
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
        }
    });
}

function drawUI() {
    const exercise = ExerciseManager.getCurrent();

    // Box background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 300, 150);

    // Text Settings
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "white";
    
    // 1. Title (Handle Routines)
    let title = ExerciseManager.currentExerciseName.toUpperCase();
    if (typeof RoutineSystem !== 'undefined' && RoutineSystem.active && RoutineSystem.queue[RoutineSystem.index]) {
        title = RoutineSystem.queue[RoutineSystem.index].label.toUpperCase();
    }
    ctx.font = "20px Arial";
    ctx.fillStyle = "#AAAAAA";
    ctx.fillText(title, 20, 30);

    // 2. Count / Timer
    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#FFFFFF";
    
    let displayValue;
    if (typeof RoutineSystem !== 'undefined' && RoutineSystem.active) {
        displayValue = RoutineSystem.timer + " s";
        ctx.fillStyle = "#00FFFF";
    } else {
        displayValue = exercise.count;
        if (exercise.type === 'time') {
            displayValue += " s";
        }
    }
    ctx.fillText(displayValue, 20, 80);

    // 3. Feedback
    ctx.font = "24px Arial";
    if (exercise.feedback.includes("Good") || exercise.feedback.includes("Hold") || exercise.feedback.includes("Burn")) {
        ctx.fillStyle = "#00FF00";
    } else {
        ctx.fillStyle = "#FFCC00";
    }
    ctx.fillText(exercise.feedback, 20, 120);
}

// Start Application
init();