/**
 * Script.js
 * Main application loop.
 * Features: HD Camera request, Timer logic fixes, Routine integration.
 */

let detector;
let video;
let canvas, ctx;
let currentExercise = null;
let repCount = 0;
let isModelReady = false;

// Timer variables for static exercises
let secondsHeld = 0;
let lastFrameTime = 0;

async function init() {
    video = document.getElementById('video');
    canvas = document.getElementById('output');
    ctx = canvas.getContext('2d');

    // 1. Setup Camera - REQUEST HD (1280x720) for Wider Angle ("Zoom Out")
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 }, 
                height: { ideal: 720 },
                facingMode: 'user'
            } 
        });
        video.srcObject = stream;
        await new Promise(resolve => video.onloadedmetadata = resolve);
        video.play();
        
        // Match canvas internal resolution to video source resolution
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Ensure canvas element fills the container via CSS
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
    } catch (err) {
        alert("Camera error: " + err.message);
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
        
        // Start Loop using requestAnimationFrame to ensure valid timestamp
        requestAnimationFrame(render); 
    } catch (err) {
        console.error(err);
        if(window.setAIStatus) window.setAIStatus('red');
    }
}

// Global API called by Routines.js / HTML Buttons
window.startMode = function(modeName) {
    if (typeof createExercise !== 'function') {
        console.error("Exercise.js not loaded!");
        return;
    }

    // Create new exercise instance via Factory
    currentExercise = createExercise(modeName);
    
    // Reset Counters
    repCount = 0;
    secondsHeld = 0;
    lastFrameTime = 0; // Reset timer sync
    
    console.log("Switched to:", currentExercise.name);
};

// Main Animation Loop
async function render(currentTime) {
    if (!detector) return;

    // Detect Poses
    let poses = null;
    try {
        poses = await detector.estimatePoses(video);
    } catch (error) {
        // Handle intermittent detection failures
        console.warn("Detection error:", error);
    }
    
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
    // 1. Check Biomechanics (Exercise.js)
    const result = currentExercise.check(pose);
    
    if (!result) return; // Not enough keypoints visible

    // 2. Handle Feedback
    if (result.feedback && typeof window.updateHint === 'function') {
        // Only show biomechanical feedback if not just simple Up/Down state
        if(result.feedback !== "Up" && result.feedback !== "Down") {
             // Optional: Uncomment to show mechanics feedback
             // window.updateHint(result.feedback); 
        }
    }

    // 3. Handle Counting (Reps vs Time)
    const routineActive = window.routineManager && window.routineManager.active;
    const currentPlanItem = routineActive ? window.routineManager.currentPlan.sequence[window.routineManager.currentIndex] : null;

    // Initialize time sync on first active frame
    if (!lastFrameTime) {
        lastFrameTime = currentTime;
        return; // Skip first frame to avoid huge delta
    }

    if (routineActive && currentPlanItem.isTimer) {
        // --- TIMER LOGIC (Routine Mode - Plank/Wall Sit) ---
        const delta = (currentTime - lastFrameTime) / 1000; // seconds
        
        // Simplified: Assuming valid pose = holding correctly
        secondsHeld += delta;
        
        // Update UI
        const remaining = Math.max(0, currentPlanItem.count - Math.floor(secondsHeld));
        if (window.updateHint) window.updateHint(`${currentExercise.name}: ${remaining}s`);

        // Check completion
        if (secondsHeld >= currentPlanItem.count) {
            window.routineManager.next();
            secondsHeld = 0; 
        }

    } else {
        // --- REP LOGIC (Routine OR Free Mode) ---
        if (result.isRep) {
            repCount++;
            
            // Visual Flash on Canvas
            ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.fillRect(0,0, canvas.width, canvas.height);

            if (routineActive) {
                // Routine Mode
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
    }
    
    lastFrameTime = currentTime; // Update for next frame
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

    // Draw Lines
    // Requires poseDetection.util to be loaded from CDN
    if (poseDetection && poseDetection.util) {
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
}

// Start Application
init();
