# AI Smart Fitness Coach

## Project Information

### Project Overview
This project is a web-based artificial intelligence fitness coach that utilizes computer vision to track human body movements in real-time. By leveraging the user's webcam, the application detects body keypoints to count exercise repetitions, monitor posture form, and provide immediate feedback. All processing is done locally within the browser using WebGL, ensuring user privacy and low latency without sending data to external servers.

The system supports over 20 different exercises, ranging from strength training to cardio, and features an automated routine system for warm-ups and stretching.

### Key Features
*   **Real-time Pose Detection:** Tracks 17 body keypoints with high accuracy using TensorFlow.js.
*   **Repetition Counting:** Automates counting based on geometric angle calculation (e.g., knee angles for squats).
*   **Form Correction:** Provides text feedback (e.g., "Go lower," "Straighten back") based on biomechanical thresholds.
*   **Routine System:** Integrated logic for timed Warm-Up and Stretching sessions that automatically cycle through exercises.
*   **Performance Optimized:** Implements frame throttling for AI inference (10 FPS) while maintaining smooth UI rendering (60 FPS) to support lower-end devices.

### AI Model Used
This project relies on **TensorFlow.js** and the **MoveNet (SinglePose Lightning)** architecture.

*   **Architecture:** MoveNet is a bottom-up estimation model designed to run efficiently on consumer hardware, including laptops and mobile phones.
*   **Variant:** We utilize the "Lightning" variant. This version is optimized for high inference speed, making it ideal for fitness applications where tracking rapid movements is more critical than pixel-perfect precision.
*   **Mechanism:** The model analyzes the video feed frame-by-frame and outputs X/Y coordinates along with confidence scores for 17 keypoints (ankles, knees, hips, shoulders, elbows, wrists, etc.).

### Code Structure
The project is built with vanilla JavaScript to ensure easy deployment with no build steps required.

1.  **`index.html`**
    *   The entry point of the application.
    *   Contains the HTML5 Video element for the webcam feed.
    *   Contains the Canvas element for drawing the skeleton overlay.
    *   Includes the UI controls for mode selection (Warm Up / Stretch / Free Workout).

2.  **`script.js`**
    *   **Configuration:** Manages settings for video resolution and AI throttle rates.
    *   **Math Utilities:** Helper functions to calculate geometric angles, Euclidean distances, and vector mathematics.
    *   **Exercise Classes:** Defines the logic for 22 distinct exercises. Each class acts as a state machine (e.g., transitioning from "Standing" to "Squatting") to track repetitions and generate feedback.
    *   **Routine Manager:** Handles timed sequences for warm-ups and stretches.
    *   **Render Loop:** Separates the AI inference loop from the graphics rendering loop to ensure a smooth user experience.

3.  **`style.css`**
    *   Defines the visual appearance, utilizing a dark theme suitable for fitness environments.

### Supported Exercises
*   **Strength:** Squat, Push-up, Lunge, Dip, Sit-up, Leg Raise, Donkey Kick, Calf Raise.
*   **Cardio:** Jumping Jack, High Knees, Butt Kicks, Squat Jump, Box Jump, Mountain Climber, Burpee.
*   **Static/Core:** Plank, Side Plank, Wall Sit, Glute Bridge.
*   **Flexibility:** Side Stretch, Forward Fold.

### How to Run
1.  Clone or download the repository.
2.  Navigate to the project folder.
3.  Serve the files using a local web server (Browser security policies restrict webcam access when opening HTML files directly).
    *   **Using Python:** `python -m http.server 8000`
    *   **Using VS Code:** Install "Live Server" extension and click "Go Live".
4.  Open your browser to `localhost:8000`.
5.  Allow camera access when prompted.

---

## 项目信息

### 项目简介
本项目是一个基于Web的AI智能健身助手，利用计算机视觉技术实时追踪人体动作。应用程序通过用户的网络摄像头检测身体关键点，从而计算运动次数、监测姿态标准度并提供即时反馈。所有数据处理均通过WebGL在浏览器本地完成，无需将视频数据上传至服务器，从而确保了用户隐私和低延迟体验。

该系统支持深蹲、俯卧撑、有氧运动等20多种动作，并包含自动化的热身和拉伸流程。

### 主要功能
*   **实时姿态检测：** 使用TensorFlow.js高精度追踪人体17个关键点。
*   **自动计数：** 基于几何角度计算（如深蹲时的膝盖角度）实现自动计数。
*   **姿态矫正：** 根据生物力学阈值提供实时文本反馈（如“再低一点”、“背部挺直”）。
*   **流程管理系统：** 内置计时逻辑，支持热身和拉伸课程，可自动切换动作。
*   **性能优化：** 实现了AI推理帧率限制（10 FPS）与UI渲染（60 FPS）的分离，确保在低配置设备上也能流畅运行。

### 使用的AI模型
本项目采用了 **TensorFlow.js** 和 **MoveNet (SinglePose Lightning)** 架构。

*   **架构：** MoveNet 是一种自下而上的姿态估计算法，专为在笔记本电脑和手机等消费级硬件上高效运行而设计。
*   **变体：** 我们使用了 "Lightning"（闪电）版本。该版本针对推理速度进行了优化，非常适合需要捕捉快速动作的健身应用场景。
*   **原理：** 模型逐帧分析视频流，并输出17个关键点（脚踝、膝盖、臀部、肩膀、手肘、手腕等）的X/Y坐标及置信度分数。

### 代码结构
本项目使用原生JavaScript构建，无需复杂的构建步骤即可部署。

1.  **`index.html`**
    *   应用程序入口。
    *   包含用于显示摄像头的HTML5 Video元素。
    *   包含用于绘制骨架覆盖层的Canvas元素。
    *   包含用于选择模式（热身/拉伸/自由训练）的UI控件。

2.  **`script.js`**
    *   **配置 (Configuration)：** 管理视频分辨率和AI推理频率设置。
    *   **数学工具 (Math Utilities)：** 用于计算几何角度、欧几里得距离和向量运算的辅助函数。
    *   **动作类 (Exercise Classes)：** 定义了22种不同动作的逻辑。每个类作为一个状态机（例如从“站立”状态转换到“下蹲”状态），负责追踪重复次数并生成反馈。
    *   **流程管理器 (Routine Manager)：** 处理热身和拉伸的计时序列。
    *   **渲染循环 (Render Loop)：** 将AI推理循环与图形渲染循环分离，确保流畅的用户体验。

3.  **`style.css`**
    *   定义视觉样式，采用适合健身环境的深色主题。

### 支持的动作
*   **力量训练：** 深蹲 (Squat)、俯卧撑 (Push-up)、弓步蹲 (Lunge)、臂屈伸 (Dip)、仰卧起坐 (Sit-up)、腿举 (Leg Raise)、跪姿后踢 (Donkey Kick)、提踵 (Calf Raise)。
*   **有氧训练：** 开合跳 (Jumping Jack)、高抬腿 (High Knees)、后踢腿 (Butt Kicks)、深蹲跳 (Squat Jump)、跳箱 (Box Jump)、登山跑 (Mountain Climber)、波比跳 (Burpee)。
*   **静态/核心：** 平板支撑 (Plank)、侧平板支撑 (Side Plank)、靠墙静蹲 (Wall Sit)、臀桥 (Glute Bridge)。
*   **柔韧性：** 侧向拉伸 (Side Stretch)、体前屈 (Forward Fold)。

### 如何运行
1.  克隆或下载本代码仓库。
2.  进入项目文件夹。
3.  使用本地Web服务器运行文件（由于浏览器安全策略，直接打开HTML文件无法调用摄像头）。
    *   **使用 Python:** 在终端运行 `python -m http.server 8000`
    *   **使用 VS Code:** 安装 "Live Server" 插件并点击 "Go Live"。
4.  在浏览器中打开 `localhost:8000`。
5.  在提示时允许浏览器访问摄像头。

---

## References (参考资料)

*   **TensorFlow.js:** https://www.tensorflow.org/js
*   **MoveNet Model Documentation:** https://github.com/tensorflow/tfjs-models/tree/master/pose-detection/src/movenet
*   **Pose Detection API:** https://github.com/tensorflow/tfjs-models/tree/master/pose-detection