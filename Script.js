/* script.js */

// =======================
// CONFIGURATION
// =======================
const CONFIG = {
    videoWidth: 640,
    videoHeight: 480,
    aiFps: 10,             // Run AI 10 times per second (Performance mode)
};

// =======================
// STATE VARIABLES
// =======================
let detector;
let video;
let canvas, ctx;
let lastVideoTime = 0;
let lastAiTime = 0;
let lastPose = null;       // Store the last detected pose for drawing

// =======================
// INITIALIZATION
// =======================
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

    // 4. Setup Controls (Dropdown)
    setupControls();

    // 5. Start Loop
    renderLoop();
}

function setupControls() {
    // Look for a dropdown in HTML to switch exercises
    const select = document.getElementById('exercise-select');
    if (select) {
        // Populate options from ExerciseManager
        const options = ExerciseManager.getOptions();
        options.forEach(opt => {
            const el = document.createElement("option");
            el.value = opt;
            el.text = opt.charAt(0).toUpperCase() + opt.slice(1);
            select.appendChild(el);
        });

        // Handle change
        select.addEventListener('change', (e) => {
            ExerciseManager.switch(e.target.value);
        });
    }
}

// =======================
// MAIN LOOP (60 FPS)
// =======================
async function renderLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Video
    ctx.save();
    ctx.scale(-1, 1); // Mirror video
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 2. Run AI Detection (Throttled to 10 FPS)
    if (timestamp - lastAiTime > (1000 / CONFIG.aiFps)) {
        if (detector && video.readyState === 4) {
            try {
                const poses = await detector.estimatePoses(video);
                if (poses && poses.length > 0) {
                    lastPose = poses[0];
                    
                    // --- UPDATED LOGIC HERE ---
                    // 1. Update Routine Timer (if active)
                    if (typeof RoutineSystem !== 'undefined') {
                        RoutineSystem.update();
                    }
                    
                    // 2. Update Exercise Logic
                    const activeExercise = ExerciseManager.getCurrent();
                    activeExercise.update(lastPose);
                }
            } catch (error) {
                console.error("AI Error:", error);
            }
        }
        lastAiTime = timestamp;
    }

    // 3. Draw UI & Skeleton (Interpolated 60 FPS)
    if (lastPose) {
        drawSkeleton(lastPose);
        drawUI();
    }

    requestAnimationFrame(renderLoop);
}

// =======================
// DRAWING
// =======================
function drawSkeleton(pose) {
    // Get the current exercise state to determine colors
    const exercise = ExerciseManager.getCurrent();
    
    let color = '#00FF00'; // Green
    if (exercise.status === 'down' || exercise.status === 'star' || exercise.status === 'in') {
        color = '#FFFF00'; // Yellow for active phase
    }

    // Define connections for a stick figure
    const connections = [
        [5, 7], [7, 9],       // Left Arm
        [6, 8], [8, 10],      // Right Arm
        [5, 6],               // Shoulders
        [5, 11], [6, 12],     // Torso
        [11, 12],             // Hips
        [11, 13], [13, 15],   // Left Leg
        [12, 14], [14, 16]    // Right Leg
    ];

    // Draw Lines
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

    // Draw Joints
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

    // Box background for text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 300, 150);

    // Text Settings
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "white";
    
    // 1. Exercise Name / Routine Label
    ctx.font = "20px Arial";
    ctx.fillStyle = "#AAAAAA";
    
    // --- UPDATED TITLE LOGIC ---
    let title = ExerciseManager.currentName.toUpperCase();
    // If we are in a routine (Warmup/Stretch), show the specific step label
    if (typeof RoutineSystem !== 'undefined' && RoutineSystem.active && RoutineSystem.queue[RoutineSystem.index]) {
        title = RoutineSystem.queue[RoutineSystem.index].label.toUpperCase();
    }
    ctx.fillText(title, 20, 30);

    // 2. Count / Time
    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#FFFFFF";
    
    // --- UPDATED DISPLAY VALUE LOGIC ---
    let displayValue;
    
    if (typeof RoutineSystem !== 'undefined' && RoutineSystem.active) {
        // If in routine, show TIMER
        displayValue = RoutineSystem.timer + " s";
        ctx.fillStyle = "#00FFFF"; // Cyan color for timer
    } else {
        // Normal Mode
        displayValue = exercise.count;
        if (exercise.type === 'time') {
            displayValue += " s";
        }
    }
    ctx.fillText(displayValue, 20, 80);

    // 3. Feedback
    ctx.font = "24px Arial";
    
    // Color code feedback
    if (exercise.feedback.includes("Good") || exercise.feedback.includes("Hold") || exercise.feedback.includes("Burn")) {
        ctx.fillStyle = "#00FF00"; // Green
    } else {
        ctx.fillStyle = "#FFCC00"; // Orange/Yellow warning
    }
    
    ctx.fillText(exercise.feedback, 20, 120);
}

// Start Application
init();