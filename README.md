# Magic Mirror - AI Fitness Coach / AI 智能健身私教

[English](#english) | [中文 (Chinese)](#中文-chinese)

---

<a name="english"></a>
## 🇬🇧 English

**Magic Mirror** is a browser-based personal fitness assistant that uses computer vision (AI) to track your workouts in real-time. Designed to act like a smart mirror, it reflects your image while overlaying pose skeletons, counting repetitions, and providing instant feedback on your form.

Built with **TensorFlow.js**, all AI processing happens locally on your device (Client-side), ensuring complete privacy and low latency.

### 🚀 Key Features

*   **Real-time Pose Detection:** Powered by the MoveNet SinglePose Lightning model to track 17 body keypoints with high speed and accuracy.
*   **"Magic Mirror" Interface:**
    *   **Immersive View:** Full-screen, mirrored video feed for a natural workout experience.
    *   **Modern Design:** Sleek "Glassmorphism" UI with translucent panels and smooth animations.
    *   **Smart Feedback:** Visual indicators for AI status (Ready/Loading) and proximity warnings (e.g., "Too Close!").
*   **Intelligent Tracking:**
    *   **Auto Rep Counting:** Automatically detects exercise states (e.g., squat depth) to count repetitions.
    *   **Form Correction:** Provides real-time guidance (e.g., "Keep back straight", "Go lower").
*   **Exercise Library:** Built-in support for Strength, Cardio, and Flexibility routines (Squats, Push-ups, Jumping Jacks, Planks, etc.).
*   **Privacy First:** No video data is ever sent to the cloud. Everything runs in your browser.

### 🛠️ Technology Stack

*   **Frontend:** HTML5, CSS3 (Responsive, Flexbox/Grid), Vanilla JavaScript.
*   **AI Engine:** TensorFlow.js (MoveNet).
*   **Hardware:** Standard Webcam (Laptop or USB).

### 📂 Project Structure

*   **`index.html`**  
    The main entry point. Contains the responsive layout, video/canvas elements, and the UI logic for the "Magic Mirror" interface.
    
*   **`Script.js`**  
    The core application logic. It handles:
    *   Webcam initialization and permissions.
    *   Loading the TensorFlow.js model.
    *   The main detection loop (pose estimation).
    *   Drawing the skeleton overlay.
    
*   **`Exercise.js`**  
    Contains the logic for specific exercises. It defines the biomechanical rules (angles, distances) for counting reps and detecting bad form.

### 📦 How to Run

Because this project requires access to the webcam and loads external AI models, modern browsers require it to be served over **HTTPS** or **localhost**. You cannot simply double-click the `index.html` file.

#### Method 1: VS Code (Recommended)
1.  Open the project folder in **Visual Studio Code**.
2.  Install the **Live Server** extension.
3.  Right-click `index.html` and select **"Open with Live Server"**.

#### Method 2: Python
If you have Python installed, run a simple HTTP server from the terminal:

```bash
# Python 3
python -m http.server 8000
```
Then open your browser to `http://localhost:8000`.

#### Method 3: Node.js
If you have Node.js installed:

```bash
npx http-server .
```

### 📱 Mobile Support
The interface is fully optimized for mobile devices:
*   **Responsive:** Layout adjusts automatically for Portrait and Landscape modes.
*   **Controls:** Touch-friendly buttons and floating menus.
*   **Note:** Please allow camera permissions when prompted by your mobile browser (Safari on iOS / Chrome on Android).

### ⚠️ Troubleshooting

1.  **AI Status Indicator stays Yellow:**  
    The model is downloading. Check your internet connection. If it persists, check the browser console (F12) for network errors.
    
2.  **"Too Close" Warning persists:**  
    Step back until your full body (head to toes) is visible in the frame. The AI needs to see your ankles and shoulders to accurately track exercises like Squats.

3.  **Video is black:**  
    Ensure you have granted camera permissions. Check if another application (Zoom, Teams) is currently using the camera.

---

<a name="中文-chinese"></a>
## 🇨🇳 中文 (Chinese)

**Magic Mirror (魔镜)** 是一款基于浏览器的 AI 个人健身助手。它利用计算机视觉技术实时追踪您的锻炼动作。就像一面智能镜子，您可以在屏幕上看到自己，AI 会叠加骨骼关键点，自动计算重复次数，并对您的动作姿态提供即时反馈。

本项目基于 **TensorFlow.js** 构建，所有 AI 计算均在您的设备本地（客户端）进行，确保了绝对的隐私安全和极低的延迟。

### 🚀 主要功能

*   **实时姿态检测：** 使用 MoveNet SinglePose Lightning 模型，快速且精准地追踪全身 17 个关键点。
*   **"魔镜" 界面体验：**
    *   **沉浸式视图：** 全屏镜像视频流，提供自然的跟练体验。
    *   **现代 UI 设计：** 采用流行的 "毛玻璃 (Glassmorphism)" 风格，界面通透美观。
    *   **智能反馈：** 包含 AI 状态指示灯（准备就绪/加载中）和距离提示（如“太近了！”）。
*   **智能追踪：**
    *   **自动计数：** 自动识别动作状态（如深蹲幅度的起落）并计算次数。
    *   **动作纠正：** 提供实时指导（例如：“背部挺直”、“下蹲再深一点”）。
*   **动作库：** 内置力量、有氧和柔韧性训练（深蹲、俯卧撑、开合跳、平板支撑等）。
*   **隐私优先：** 视频数据完全不经过云端，所有处理均在浏览器中完成。

### 🛠️ 技术栈

*   **前端：** HTML5, CSS3 (响应式布局), 原生 JavaScript.
*   **AI 引擎：** TensorFlow.js (MoveNet 模型).
*   **硬件要求：** 标准网络摄像头 (笔记本自带或 USB 外接).

### 📂 项目结构

*   **`index.html`**  
    主入口文件。包含响应式布局、视频/画布元素以及界面的交互逻辑。
    
*   **`Script.js`**  
    核心逻辑文件。负责：
    *   初始化摄像头并获取权限。
    *   加载 TensorFlow.js 模型。
    *   主检测循环（逐帧姿态估计）。
    *   在画布上绘制骨骼连线。
    
*   **`Exercise.js`**  
    具体动作的逻辑文件。定义了各个动作（如深蹲）的判断规则（角度、距离），用于计数和纠错。

### 📦 如何运行

由于项目需要访问摄像头并加载 AI 模型，现代浏览器要求必须通过 **HTTPS** 或 **localhost** 协议运行。您不能直接双击打开 `index.html` 文件。

#### 方法 1: VS Code (推荐)
1.  在 **Visual Studio Code** 中打开项目文件夹。
2.  安装 **Live Server** 扩展插件。
3.  右键点击 `index.html` 并选择 **"Open with Live Server"**。

#### 方法 2: Python
如果您安装了 Python，可以在终端运行简单的 HTTP 服务器：

```bash
# Python 3
python -m http.server 8000
```
然后在浏览器访问 `http://localhost:8000`。

#### 方法 3: Node.js
如果您安装了 Node.js：

```bash
npx http-server .
```

### 📱 移动端支持
界面已针对移动设备进行优化：
*   **响应式：** 自动适配横屏和竖屏模式。
*   **触控优化：** 按钮和菜单易于手指点击。
*   **注意：** 请在手机浏览器（iOS Safari / Android Chrome）提示时允许使用摄像头权限。

### ⚠️ 常见问题排查

1.  **AI 状态指示灯一直是黄色：**  
    模型正在下载中。请检查您的网络连接。如果长时间无变化，请按 F12 查看浏览器控制台是否有网络错误。
    
2.  **一直提示 "Too Close" (太近了)：**  
    请向后退，直到您的全身（从头到脚）都出现在画面中。AI 需要看到您的脚踝和肩膀才能准确追踪深蹲等动作。

3.  **视频黑屏：**  
    请确保已授予浏览器摄像头权限。检查是否有其他应用（如 Zoom, Teams）正在占用摄像头。

---
[MIT License](LICENSE)
