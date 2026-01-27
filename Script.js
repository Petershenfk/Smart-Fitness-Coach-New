/**
 * Script.js
 * Main application loop.
 */

let detector;
let video;
let canvas, ctx;
let currentExercise = null;
let repCount = 0;
let isModelReady = false;

// Timer variables for static exercises
let exerciseTimer = null;
let secondsHeld = 0;
let lastFrameTime = 0;

async function init() {
    video = document.getElementById('video');
    canvas = document.getElementById('output');
    ctx = canvas.getContext('2d');

    // 1. Setup Camera
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        });
        video.srcObject = stream;
        await new Promise(resolve => video.onloadedmetadata = resolve);
        video.play();
        
        // Match canvas to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    } catch (err) {
        alert("Camera permission denied or not available.");
        if(window.setAIStatus) window.setAIStatus('red');
        return;
    }

    // 2. Load AI Model
    if(window.setAIStatus) window.setAIStatus('yellow');
    try {
        detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
        });
        isModelReady = true;
        if(window.setAIStatus) window.setAIStatus('green');
        render(); // Start Loop
    } catch (err) {
        console.error(err);
        if(window.setAIStatus) window.setAIStatus('red');
    }
}

// Global API called by Routines.js
window.startMode = function(modeName) {
    if (typeof createExercise !== 'function') {
        console.error("Exercise.js not loaded!");
        return;
    }

    // Reset State
    currentExercise = createExercise(modeName);
    repCount = 0;
    secondsHeld = 0;
    
    console.log("Switched to:", currentExercise.name);
};

// Main Loop
async function render(currentTime) {
    if (!detector) return;

    // Detect Poses
    const poses = await detector.estimatePoses(video);
    
    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (poses && poses.length > 0) {
        const pose = poses[0];
        
        // Draw Skeleton
        drawSkeleton(pose.keypoints);

        // Process Exercise Logic
        if (currentExercise) {
            processExercise(pose, currentTime);
        }
    }

    requestAnimationFrame(render);
}

function processExercise(pose, currentTime) {
    // 1. Check Biomechanics
    const result = currentExercise.check(pose);
    
    if (!result) return; // Not enough keypoints visible

    // 2. Handle Feedback
    if (result.feedback && typeof window.updateHint === 'function') {
        // Only override hint if it's a correction, not general status
        if(result.feedback !== "Up" && result.feedback !== "Down") {
            // window.updateHint(result.feedback); // Optional: can get spammy
        }
    }

    // 3. Handle Counting (Reps vs Time)
    
    // Check if we are in a Routine
    const routineActive = window.routineManager && window.routineManager.active;
    const currentPlanItem = routineActive ? window.routineManager.currentPlan.sequence[window.routineManager.currentIndex] : null;

    if (routineActive && currentPlanItem.isTimer) {
        // --- TIMER LOGIC (Plank, Wall Sit) ---
        if (!lastFrameTime) lastFrameTime = currentTime;
        const delta = (currentTime - lastFrameTime) / 1000; // seconds
        lastFrameTime = currentTime;

        // Only count time if form is "Good" (e.g. holding the plank)
        // Simplified: We assume valid pose = holding
        secondsHeld += delta;
        
        // Update UI with Time
        const remaining = Math.max(0, currentPlanItem.count - Math.floor(secondsHeld));
        if (window.updateHint) window.updateHint(`${currentExercise.name}: ${remaining}s`);

        if (secondsHeld >= currentPlanItem.count) {
            window.routineManager.next();
            secondsHeld = 0; // Reset for next
        }

    } else {
        // --- REP LOGIC ---
        if (result.isRep) {
            repCount++;
            
            // Visual Flash
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.fillRect(0,0, canvas.width, canvas.height);

            // Check Routine Goal
            if (routineActive) {
                const remaining = currentPlanItem.count - repCount;
                if (window.updateHint) window.updateHint(`${currentExercise.name}: ${remaining} left`);
                
                if (repCount >= currentPlanItem.count) {
                    window.routineManager.next();
                    repCount = 0;
                }
            } else {
                // Free Workout Mode
                if (window.updateHint) window.updateHint(`Reps: ${repCount}`);
            }
        }
        lastFrameTime = currentTime; // Keep timer sync
    }
}

// --- Drawing Helper ---
function drawSkeleton(keypoints) {
    // Draw Points
    keypoints.forEach(p => {
        if (p.score > 0.3) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#00d2ff';
            ctx.fill();
        }
    });

    // Draw Lines (Simplified list)
    const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    
    adjacentPairs.forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];
        if (kp1.score > 0.3 && kp2.score > 0.3) {
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.stroke();
        }
    });
}

// Start
init();
