/**
 * Script.js
 * Robust Camera Loading & AI Loop
 */

let detector;
let video;
let canvas, ctx;
let currentExercise = null;
let repCount = 0;
let isModelReady = false;

// Timer variables
let secondsHeld = 0;
let lastFrameTime = 0;

// --- 1. Robust Camera Setup ---
async function setupCamera() {
    video = document.getElementById('video');
    canvas = document.getElementById('output');
    ctx = canvas.getContext('2d');

    // Strategy A: Try HD (Zoomed Out / Wide)
    const constraintsHD = {
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
        }
    };

    // Strategy B: Fallback to whatever works (Standard)
    const constraintsBasic = {
        video: { facingMode: 'user' }
    };

    let stream;
    try {
        console.log("Attempting HD Camera...");
        stream = await navigator.mediaDevices.getUserMedia(constraintsHD);
    } catch (err) {
        console.warn("HD failed, falling back to basic camera.", err);
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraintsBasic);
        } catch (err2) {
            alert("Camera access denied. Please check permissions.");
            if(window.setAIStatus) window.setAIStatus('red');
            return false;
        }
    }

    video.srcObject = stream;

    // Wait for video to actually be ready
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            // Force fill container
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            
            video.play();
            resolve(true);
        };
    });
}

// --- 2. Initialization ---
async function init() {
    // Set Status: Loading
    if(window.setAIStatus) window.setAIStatus('yellow');

    // 1. Start Camera
    const cameraReady = await setupCamera();
    if (!cameraReady) return;

    // 2. Load AI Model
    try {
        // Use a lighter model config for mobile stability
        detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            enableSmoothing: true, // smoother points
            minPoseScore: 0.25
        });
        
        isModelReady = true;
        console.log("AI Model Loaded");
        
        // Don't set Green yet. Set Green in the first successful render frame.
        requestAnimationFrame(render);
        
    } catch (err) {
        console.error("AI Load Error:", err);
        if(window.setAIStatus) window.setAIStatus('red');
        alert("Failed to load AI model. Check connection.");
    }
}

// --- 3. Mode Switching ---
window.startMode = function(modeName) {
    if (typeof createExercise !== 'function') {
        console.error("Exercise.js not loaded!");
        return;
    }
    currentExercise = createExercise(modeName);
    repCount = 0;
    secondsHeld = 0;
    lastFrameTime = 0;
    
    // Clear previous hints
    if(window.updateHint) window.updateHint(null);
    console.log("Switched to:", currentExercise.name);
};

// --- 4. Main Render Loop ---
async function render(currentTime) {
    // Safety check
    if (!detector || !video || video.readyState < 2) {
        requestAnimationFrame(render);
        return;
    }

    // A. Detect Poses
    let poses = null;
    try {
        poses = await detector.estimatePoses(video);
        
        // SUCCESS: If we got here, the AI is working. Turn light Green.
        if(window.setAIStatus && document.querySelector('.status-yellow')) {
            window.setAIStatus('green'); 
        }
    } catch (error) {
        console.warn("Detection error (skipping frame):", error);
    }
    
    // B. Draw & Process
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (poses && poses.length > 0) {
        const pose = poses[0];
        
        // Only process if confidence is decent
        if (pose.score > 0.25) {
            drawSkeleton(pose.keypoints);
            if (currentExercise) {
                processExercise(pose, currentTime);
            }
        }
    }

    requestAnimationFrame(render);
}

function processExercise(pose, currentTime) {
    if (!lastFrameTime) {
        lastFrameTime = currentTime;
        return;
    }

    // 1. Check Biomechanics
    const result = currentExercise.check(pose);
    if (!result) return; 

    // 2. Update Feedback
    // Only update hint if it's a specific correction (not just "Up/Down")
    if (result.feedback && result.feedback !== "Up" && result.feedback !== "Down") {
        // window.updateHint(result.feedback); // Uncomment if you want text spam
    }

    // 3. Logic for Routine vs Free Mode
    const routineActive = window.routineManager && window.routineManager.active;
    const currentPlanItem = routineActive ? window.routineManager.currentPlan.sequence[window.routineManager.currentIndex] : null;

    if (routineActive && currentPlanItem.isTimer) {
        // Timer Logic
        const delta = (currentTime - lastFrameTime) / 1000;
        secondsHeld += delta;
        
        const remaining = Math.max(0, currentPlanItem.count - Math.floor(secondsHeld));
        if (window.updateHint) window.updateHint(`${currentExercise.name}: ${remaining}s`);

        if (secondsHeld >= currentPlanItem.count) {
            window.routineManager.next();
            secondsHeld = 0;
        }
    } else {
        // Rep Logic
        if (result.isRep) {
            repCount++;
            
            // Flash Screen Green
            ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.fillRect(0,0, canvas.width, canvas.height);

            if (routineActive) {
                const remaining = currentPlanItem.count - repCount;
                if (window.updateHint) window.updateHint(`${currentExercise.name}: ${remaining} left`);
                if (repCount >= currentPlanItem.count) {
                    window.routineManager.next();
                    repCount = 0;
                }
            } else {
                // Free Mode
                if (window.updateHint) window.updateHint(`Reps: ${repCount}`);
            }
        }
    }
    lastFrameTime = currentTime;
}

// --- 5. Drawing Helper ---
function drawSkeleton(keypoints) {
    // Draw Points
    keypoints.forEach(p => {
        if (p.score > 0.3) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI); // Slightly larger dots
            ctx.fillStyle = '#00E5FF'; // Cyan
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.stroke();
        }
    });

    // Draw Lines
    if (poseDetection && poseDetection.util) {
        const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3; // Thicker lines for visibility
        
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

// Start
init();
