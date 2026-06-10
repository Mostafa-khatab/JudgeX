import os
import sys
import re
import asyncio
import json
import subprocess
import shutil

# Check dependencies
required_packages = ["playwright", "edge-tts", "imageio-ffmpeg"]
for pkg in required_packages:
    try:
        __import__(pkg.replace("-", "_"))
    except ImportError:
        print(f"Installing {pkg}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

try:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        p.chromium.launch(headless=True)
except Exception:
    print("Installing Playwright Chromium...")
    subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])

import edge_tts
import imageio_ffmpeg
from playwright.async_api import async_playwright

# Setup directories
TEMP_DIR = "temp_assets"
VIDEO_DIR = os.path.join(TEMP_DIR, "videos")
AUDIO_DIR = os.path.join(TEMP_DIR, "audios")
MERGED_DIR = os.path.join(TEMP_DIR, "merged")

# Clean existing video/merged folders to prevent naming collisions
for d in [VIDEO_DIR, MERGED_DIR]:
    if os.path.exists(d):
        try:
            shutil.rmtree(d)
        except Exception as e:
            print(f"Warning: could not delete directory {d}: {e}")
    os.makedirs(d, exist_ok=True)

os.makedirs(AUDIO_DIR, exist_ok=True)

VOICE = "en-US-GuyNeural" # Professional male voice

SCENES = [
    {
        "id": 0,
        "name": "00_title",
        "url": "data:text/html,",
        "voiceover": "Welcome to the official, complete platform walkthrough of JudgeX. JudgeX is an advanced, high-performance ecosystem designed for automated code evaluation, structured programming education, and collaborative developer recruitment. In this demo, we will explore the complete feature set of the platform in dark mode.",
        "duration": 18.0
    },
    {
        "id": 1,
        "name": "01_landing",
        "url": "http://localhost:5173/",
        "voiceover": "Let's begin with the landing page. It showcases a modern, dark-themed UI featuring clean typography and beautiful gradient accents. JudgeX bridges the gap between students, competitive programmers, and technical recruiters by offering a single, unified environment. As we scroll down, we see the core features highlighted: interactive code execution, real-time leaderboards, custom learning roadmaps, and full-featured recruitment rooms.",
        "duration": 25.0
    },
    {
        "id": 2,
        "name": "02_login",
        "url": "http://localhost:5173/login",
        "voiceover": "We will now navigate to the login page. Notice the smooth transitions as the page loads in dark mode. We enter our registered developer credentials. The interface is clean and responsive. Clicking the login button securely authenticates us with the server and seamlessly redirects us to the primary user workspace.",
        "duration": 16.0
    },
    {
        "id": 3,
        "name": "03_dashboard",
        "url": "http://localhost:5173/home",
        "voiceover": "This is the home dashboard, the central command center for every programmer. It displays user statistics, rank progression, and completed missions. In the center, we see the Daily Coding Challenge and recent programming articles. On the right, the sidebar displays the active contest leaderboard and top competitors, keeping developers engaged.",
        "duration": 22.0
    },
    {
        "id": 4,
        "name": "04_problems",
        "url": "http://localhost:5173/problems",
        "voiceover": "Next, we visit the Problems repository. This section lists a wide array of coding challenges. We can filter problems by category, difficulty level, or search for a specific problem. Let's search for the classic Two Sum problem. The search is instant, and we filter by the Array tag to isolate the question.",
        "duration": 20.0
    },
    {
        "id": 5,
        "name": "05_solve",
        "url": "http://localhost:5173/problems",
        "voiceover": "Clicking the problem launches our immersive development environment. The left pane contains the description and test cases. The right pane features the industry-standard Monaco Code Editor. We select Python as our language and type our optimized solution using a hash map. We write our code line-by-line, and then click submit. The grading system runs the code against multiple hidden test cases and compiles the results in real-time.",
        "duration": 35.0
    },
    {
        "id": 6,
        "name": "06_submissions",
        "url": "http://localhost:5173/submissions",
        "voiceover": "Once the code executes, we are navigated to the Submissions History page. Here, we can review all past submissions. We see the execution time, memory footprint, language used, and the Accepted verdict. Clicking on the submission reveals the details of our run.",
        "duration": 20.0
    },
    {
        "id": 7,
        "name": "07_contests",
        "url": "http://localhost:5173/contests",
        "voiceover": "Competitive programmers can join structured competitions in the Contests section. This dashboard shows upcoming, active, and completed contests. Each contest page includes distinct start times, targeted problem lists, and a live leaderboard tracking participants and scores as the contest unfolds.",
        "duration": 22.0
    },
    {
        "id": 8,
        "name": "08_courses",
        "url": "http://localhost:5173/courses",
        "voiceover": "For structured learning, the Courses section offers curated curriculum paths. We can browse available paths, track our learning progress, and dive into specific lessons. Each lesson integrates code practice directly, helping students build fundamental programming concepts.",
        "duration": 20.0
    },
    {
        "id": 9,
        "name": "09_ailab",
        "url": "http://localhost:5173/home?tab=ailab",
        "voiceover": "If a student gets stuck on a concept or code error, the integrated AI Lab offers an advanced conversational assistant. We ask the chatbot to explain dynamic programming in a single concise sentence. The AI responds instantly with a clear explanation, providing helpful coding guidance.",
        "duration": 22.0
    },
    {
        "id": 10,
        "name": "10_roadmaps",
        "url": "http://localhost:5173/home?tab=roadmap",
        "voiceover": "The AI Roadmaps tab visualizes data structures and algorithm pathways using a dynamic ReactFlow node graph. Developers can pan and zoom through the graph to explore learning tracks. Clicking on a node, like binary trees, opens a detailed slide-out overlay summarizing key concepts.",
        "duration": 25.0
    },
    {
        "id": 11,
        "name": "11_interviews",
        "url": "http://localhost:5173/interview",
        "voiceover": "Finally, the Recruitment module provides collaborative interview rooms. Instructors can schedule sessions, enter room environments, write code interactively with candidates via web-sockets, and chat in real-time. This provides an all-in-one platform to assess technical skills.",
        "duration": 32.0
    },
    {
        "id": 12,
        "name": "12_conclusion",
        "url": "http://localhost:5173/home",
        "voiceover": "In conclusion, JudgeX provides a complete, modern workspace for practicing, learning, and conducting technical hiring. Its rich feature set, dark mode aesthetics, and AI-assisted tooling make it a premium platform. Thank you for watching this walkthrough.",
        "duration": 18.0
    }
]

# Shared scripts injected to mimic cursor and transitions
CURSOR_SCRIPT = """
window.injectPlaywrightCursor = function() {
    if (document.getElementById('custom-playwright-cursor')) return;
    const style = document.createElement('style');
    style.id = 'custom-playwright-cursor-style';
    style.innerHTML = `
        #custom-playwright-cursor {
            position: fixed;
            width: 20px;
            height: 20px;
            background-color: rgba(56, 189, 248, 0.85);
            border: 3px solid #ffffff;
            border-radius: 50%;
            pointer-events: none;
            z-index: 100000000;
            box-shadow: 0 0 15px rgba(56, 189, 248, 0.9);
            transform: translate(-50%, -50%);
            transition: transform 0.08s ease-out, background-color 0.1s;
            top: 0;
            left: 0;
        }
        #custom-playwright-cursor.clicking {
            transform: translate(-50%, -50%) scale(0.7);
            background-color: rgba(244, 63, 94, 0.9);
            box-shadow: 0 0 15px rgba(244, 63, 94, 0.9);
        }
    `;
    document.head.appendChild(style);
    
    const cursor = document.createElement('div');
    cursor.id = 'custom-playwright-cursor';
    document.body.appendChild(cursor);
    
    window.currentCursorX = 960;
    window.currentCursorY = 540;
    cursor.style.left = window.currentCursorX + 'px';
    cursor.style.top = window.currentCursorY + 'px';
    
    window.updateCursor = function(x, y) {
        const c = document.getElementById('custom-playwright-cursor');
        if (c) {
            c.style.left = x + 'px';
            c.style.top = y + 'px';
            window.currentCursorX = x;
            window.currentCursorY = y;
        }
    };
    
    window.clickCursor = function() {
        const c = document.getElementById('custom-playwright-cursor');
        if (c) {
            c.classList.add('clicking');
            setTimeout(() => {
                c.classList.remove('clicking');
            }, 150);
        }
    };
};
"""

TRANSITION_SCRIPT = """
window.injectTransitionOverlay = function() {
    if (document.getElementById('custom-transition-overlay')) return;
    const style = document.createElement('style');
    style.id = 'custom-transition-overlay-style';
    style.innerHTML = `
        #custom-transition-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #090d16 0%, #15103c 100%);
            z-index: 100000001;
            pointer-events: none;
            opacity: 1;
            transition: opacity 1.0s ease-in-out;
        }
        #custom-transition-overlay.fade-out {
            opacity: 0;
        }
    `;
    document.head.appendChild(style);
    
    const overlay = document.createElement('div');
    overlay.id = 'custom-transition-overlay';
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.remove();
        }, 1000);
    }, 200);
};

window.triggerFadeIn = function(callback) {
    let overlay = document.getElementById('custom-transition-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'custom-transition-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'linear-gradient(135deg, #090d16 0%, #15103c 100%)';
        overlay.style.zIndex = '100000001';
        overlay.style.pointerEvents = 'none';
        overlay.style.opacity = '0';
        document.body.appendChild(overlay);
    }
    overlay.offsetHeight; // force reflow
    overlay.style.transition = 'opacity 1.0s ease-in-out';
    overlay.style.opacity = '1';
    
    setTimeout(callback, 1000);
};
"""

INIT_SCRIPT = CURSOR_SCRIPT + "\n" + TRANSITION_SCRIPT + """
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.injectPlaywrightCursor();
        window.injectTransitionOverlay();
    });
} else {
    window.injectPlaywrightCursor();
    window.injectTransitionOverlay();
}
try {
    localStorage.setItem('mode', 'dark');
} catch(e) {}
"""

def get_audio_duration(file_path):
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    result = subprocess.run([ffmpeg, "-i", file_path], stderr=subprocess.PIPE, text=True)
    match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", result.stderr)
    if match:
        hours = int(match.group(1))
        minutes = int(match.group(2))
        seconds = float(match.group(3))
        return hours * 3600 + minutes * 60 + seconds
    return 15.0

async def generate_voiceovers():
    print("--- GENERATING VOICEOVERS ---")
    for scene in SCENES:
        name = scene["name"]
        text = scene["voiceover"]
        out_path = os.path.join(AUDIO_DIR, f"{name}.mp3")
        if os.path.exists(out_path):
            print(f"Audio already exists for {name}, skipping generation.")
        else:
            print(f"Generating audio for {name}...")
            communicate = edge_tts.Communicate(text, VOICE)
            await communicate.save(out_path)
        dur = get_audio_duration(out_path)
        scene["duration"] = dur
        print(f"Audio for {name}: {out_path} ({dur:.2f} seconds)")

# Smooth mouse movement helper
async def move_mouse_smoothly(page, target_x, target_y, duration_ms=800):
    cursor_state = await page.evaluate("() => { return { x: window.currentCursorX || 960, y: window.currentCursorY || 540 }; }")
    start_x = cursor_state["x"]
    start_y = cursor_state["y"]
    
    steps = int(duration_ms / 16)
    if steps < 5: steps = 5
    
    for i in range(steps + 1):
        t = i / steps
        # easeInOutCubic curve
        ease_t = 4 * t * t * t if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2
        curr_x = start_x + (target_x - start_x) * ease_t
        curr_y = start_y + (target_y - start_y) * ease_t
        
        await page.evaluate(f"window.updateCursor({curr_x}, {curr_y})")
        await page.mouse.move(curr_x, curr_y)
        await asyncio.sleep(0.016)

async def move_and_click(page, selector):
    elem = page.locator(selector).first
    await elem.wait_for(state="visible", timeout=12000)
    box = await elem.bounding_box()
    if box:
        target_x = box["x"] + box["width"] / 2
        target_y = box["y"] + box["height"] / 2
        await move_mouse_smoothly(page, target_x, target_y, duration_ms=600)
        await page.evaluate("window.clickCursor()")
        await page.mouse.click(target_x, target_y)
        await asyncio.sleep(0.4)
    else:
        print(f"Warning: could not find bounding box for {selector}")

async def move_click_and_type(page, selector, text, delay=50):
    await move_and_click(page, selector)
    await page.keyboard.type(text, delay=delay)
    await asyncio.sleep(0.2)

async def fade_out_and_wait(page):
    await page.evaluate("window.triggerFadeIn(() => {})")
    await asyncio.sleep(1.0)

async def record_scenes():
    print("--- RECORDING SCENES IN 1080P ---")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 0. Title Scene
        print("Recording Scene 0...")
        intro_context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=VIDEO_DIR,
            record_video_size={"width": 1920, "height": 1080}
        )
        intro_page = await intro_context.new_page()
        
        title_html = """
        <html>
        <head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;900&display=swap" rel="stylesheet">
        <style>
            body {
                background: linear-gradient(135deg, #090d16 0%, #15103c 100%);
                height: 100vh; margin: 0; display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                font-family: 'Poppins', sans-serif; color: white; text-align: center;
                overflow: hidden;
            }
            .container { animation: fadeIn 2.5s ease-in-out; }
            h1 {
                font-size: 96px; font-weight: 900; margin: 0 0 15px 0;
                background: linear-gradient(to right, #38bdf8, #818cf8);
                -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                letter-spacing: -3px;
            }
            h2 { font-size: 32px; font-weight: 600; color: #a5b4fc; margin: 0 0 50px 0; max-width: 900px; line-height: 1.4; }
            .badge {
                padding: 10px 24px; border-radius: 9999px; background: rgba(99, 102, 241, 0.2);
                border: 1px solid rgba(99, 102, 241, 0.4); font-size: 18px; font-weight: 600;
                letter-spacing: 3px; text-transform: uppercase; color: #818cf8;
            }
            @keyframes fadeIn {
                0% { opacity: 0; transform: translateY(30px); }
                100% { opacity: 1; transform: translateY(0); }
            }
        </style>
        </head>
        <body>
            <div class="container">
                <h1>JudgeX</h1>
                <h2>Online Judging & Collaborative Recruitment Platform</h2>
                <div class="badge">Walkthrough Showcase</div>
            </div>
        </body>
        </html>
        """
        await intro_page.set_content(title_html)
        # Record Title scene
        target_dur = SCENES[0]["duration"]
        await intro_page.wait_for_timeout(int(target_dur * 1000) + 1000)
        video_path = await intro_page.video.path()
        await intro_context.close()
        
        # Rename recorded file
        if video_path and os.path.exists(video_path):
            dest = os.path.join(VIDEO_DIR, "00_title.webm")
            if os.path.abspath(video_path) != os.path.abspath(dest):
                if os.path.exists(dest): os.remove(dest)
                os.rename(video_path, dest)
            print("Saved Scene 0 video.")
 
        # Re-use storage state across other scenes
        # We need to perform the login once, save state, then capture each scene
        print("Pre-authenticating to capture credentials...")
        auth_context = await browser.new_context(viewport={"width": 1920, "height": 1080})
        auth_page = await auth_context.new_page()
        await auth_page.goto("http://localhost:5173/login")
        await auth_page.wait_for_timeout(1000)
        await auth_page.fill("input[type='email']", "maaastafakhatab200@gmail.com")
        await auth_page.fill("input[type='password']", "mostafA#22")
        await auth_page.click("button.bg-gradient-to-r")
        await auth_page.wait_for_url("**/home", timeout=20000)
        await auth_page.wait_for_timeout(2000)
        await auth_context.storage_state(path="state.json")
        await auth_context.close()
        print("Authentication state saved.")

        # Automation runner for remaining scenes
        async def record_scene_runner(scene_id, scene_name, nav_url, custom_actions=None):
            print(f"Recording Scene {scene_id}: {scene_name}...")
            context = await browser.new_context(
                storage_state="state.json" if scene_id > 2 else None,
                viewport={"width": 1920, "height": 1080},
                record_video_dir=VIDEO_DIR,
                record_video_size={"width": 1920, "height": 1080}
            )
            await context.add_init_script(INIT_SCRIPT)
            page = await context.new_page()
            
            # Start timer
            start_time = asyncio.get_event_loop().time()
            
            await page.goto(nav_url)
            await page.wait_for_timeout(2500) # wait for overlay fade out
            
            # Run custom script actions
            if custom_actions:
                try:
                    await custom_actions(page)
                except Exception as e:
                    print(f"Error in actions for {scene_name}: {e}")
            
            # Wait to match audio duration
            elapsed = asyncio.get_event_loop().time() - start_time
            target_dur = SCENES[scene_id]["duration"]
            remaining = target_dur - elapsed
            if remaining > 0:
                print(f"Waiting remaining {remaining:.2f} seconds...")
                await page.wait_for_timeout(int(remaining * 1000))
            
            # End with visual fade out
            await fade_out_and_wait(page)
            
            # Get video path before closing context
            video_path = await page.video.path()
            await context.close()
            
            # Rename recorded file
            if video_path and os.path.exists(video_path):
                dest = os.path.join(VIDEO_DIR, f"{scene_name}.webm")
                if os.path.abspath(video_path) != os.path.abspath(dest):
                    if os.path.exists(dest): os.remove(dest)
                    os.rename(video_path, dest)
                print(f"Saved Scene {scene_id} video: {dest}")

        # Scene 1: Landing Page
        async def act_landing(page):
            await move_mouse_smoothly(page, 960, 540, 1000)
            # Smooth scrolling down
            for _ in range(8):
                await page.mouse.wheel(0, 180)
                await asyncio.sleep(0.6)
            # Smooth scroll up
            for _ in range(4):
                await page.mouse.wheel(0, -180)
                await asyncio.sleep(0.4)
            await move_mouse_smoothly(page, 1700, 50, 1000) # Move near login/signup

        # Scene 2: Login Page
        async def act_login(page):
            # Invalidate storage state inside this context so we show logging in
            await page.evaluate("localStorage.clear()")
            await page.reload()
            await page.wait_for_timeout(1000)
            
            await move_mouse_smoothly(page, 960, 540, 500)
            # Fill email
            await move_click_and_type(page, "input[type='email']", "maaastafakhatab200@gmail.com", 60)
            # Fill password
            await move_click_and_type(page, "input[type='password']", "mostafA#22", 60)
            # Click Login
            await move_and_click(page, "button.bg-gradient-to-r")
            await page.wait_for_url("**/home", timeout=15000)
            await page.wait_for_timeout(1500)

        # Scene 3: Dashboard
        async def act_dashboard(page):
            await move_mouse_smoothly(page, 960, 400, 800)
            # Hover over daily challenge card
            await move_mouse_smoothly(page, 600, 450, 1000)
            await page.wait_for_timeout(1000)
            # Scroll down
            for _ in range(4):
                await page.mouse.wheel(0, 150)
                await asyncio.sleep(0.5)
            # Hover over ranking items in sidebar
            await move_mouse_smoothly(page, 1500, 600, 800)
            await page.wait_for_timeout(1000)
            for _ in range(2):
                await page.mouse.wheel(0, -150)
                await asyncio.sleep(0.4)

        # Scene 4: Problems List
        async def act_problems(page):
            await move_mouse_smoothly(page, 960, 300, 800)
            # Find and click Search input
            await move_click_and_type(page, "input[placeholder*='Search'], input[placeholder*='search']", "Two Sum", 100)
            await page.keyboard.press("Enter")
            await page.wait_for_timeout(1500)
            
            # Hover difficulty tags or filter options
            await move_mouse_smoothly(page, 500, 200, 1000)
            await page.wait_for_timeout(1000)
            
            # Scroll problems list
            await page.mouse.wheel(0, 200)
            await page.wait_for_timeout(1000)

        # Scene 5: Code Editor
        async def act_solve(page):
            # Click the first problem card in search result
            prob_link = page.locator("a[href*='/problem/']").first
            if await prob_link.count() > 0:
                href = await prob_link.get_attribute("href")
                match = re.search(r"/problem/([^/]+)", href)
                prob_id = match.group(1) if match else href.split("/")[-1]
                solve_url = f"http://localhost:5173/problem/{prob_id}/solve"
                print(f"Navigating to solving portal: {solve_url}")
                await page.goto(solve_url)
                await page.wait_for_timeout(3000)
                
                # Double check Monaco editor loading
                editor_textarea = page.locator(".monaco-editor textarea").first
                await editor_textarea.wait_for(state="visible", timeout=10000)
                
                # Click it
                box = await editor_textarea.bounding_box()
                if box:
                    await move_mouse_smoothly(page, box["x"]+100, box["y"]+100, 800)
                    await page.mouse.click(box["x"]+100, box["y"]+100)
                
                # Clear content
                await page.keyboard.press("Control+KeyA")
                await page.keyboard.press("Delete")
                await page.wait_for_timeout(500)
                
                # Type optimized python two-sum solution
                code_to_type = (
                    "# Optimized solution\n"
                    "def solve(nums, target):\n"
                    "    seen = {}\n"
                    "    for i, n in enumerate(nums):\n"
                    "        diff = target - n\n"
                    "        if diff in seen:\n"
                    "            return [seen[diff], i]\n"
                    "        seen[n] = i\n"
                )
                await page.keyboard.type(code_to_type, delay=55)
                await page.wait_for_timeout(1500)
                
                # Click Submit button
                await move_and_click(page, "button:has-text('Submit')")
                # Wait for grading animations
                await page.wait_for_timeout(8000)

        # Scene 6: Submissions History
        async def act_submissions(page):
            await page.mouse.wheel(0, 150)
            await page.wait_for_timeout(1000)
            # Find first submission row and click details
            details_btn = page.locator("a[href*='/submission/']").first
            if await details_btn.count() > 0:
                await move_and_click(page, "a[href*='/submission/']")
                await page.wait_for_timeout(4000)
                # Scroll modal code
                await page.mouse.wheel(0, 100)
                await page.wait_for_timeout(1000)

        # Scene 7: Contests
        async def act_contests(page):
            await page.mouse.wheel(0, 200)
            await page.wait_for_timeout(1000)
            contest_card = page.locator("a[href*='/contest/']").first
            if await contest_card.count() > 0:
                await move_and_click(page, "a[href*='/contest/']")
                await page.wait_for_timeout(4000)
                await page.mouse.wheel(0, 300)
                await page.wait_for_timeout(1500)

        # Scene 8: Courses
        async def act_courses(page):
            await page.mouse.wheel(0, 150)
            await page.wait_for_timeout(1000)
            course_card = page.locator("a[href*='/course/']").first
            if await course_card.count() > 0:
                await move_and_click(page, "a[href*='/course/']")
                await page.wait_for_timeout(4000)
                await page.mouse.wheel(0, 200)
                await page.wait_for_timeout(1000)

        # Scene 9: AI Lab
        async def act_ailab(page):
            # 1. Click Complexity Analyzer card to open the tool view
            await move_and_click(page, "h3:has-text('Complexity Analyzer')")
            await page.wait_for_timeout(1500)
            
            # 2. Click inside the textarea and type
            input_sel = "textarea[placeholder*='Paste']"
            await move_click_and_type(page, input_sel, "def quicksort(arr):\n    if len(arr) <= 1: return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)", 45)
            
            # 3. Click Initiate Analysis
            await move_and_click(page, "button:has-text('Initiate Analysis')")
            # Wait for text stream response
            await page.wait_for_timeout(7000)
            # Scroll chat panel
            chat_pane = page.locator("div.custom-scrollbar, div.overflow-y-auto").first
            if await chat_pane.count() > 0:
                box = await chat_pane.bounding_box()
                if box:
                    await move_mouse_smoothly(page, box["x"]+100, box["y"]+100, 500)
                    await page.mouse.wheel(0, 150)
            await page.wait_for_timeout(1000)

        # Scene 10: Roadmaps
        async def act_roadmaps(page):
            await page.wait_for_timeout(3000)
            # Click a ReactFlow node
            node_sel = ".react-flow__node, .roadmap-node"
            first_node = page.locator(node_sel).first
            if await first_node.count() > 0:
                await move_and_click(page, node_sel)
                await page.wait_for_timeout(4000)
                # Hover sidebar items or detail cards
                await move_mouse_smoothly(page, 1600, 500, 800)
                await page.wait_for_timeout(1000)

        # Scene 11: Collaborative Interviews
        async def act_interviews(page):
            # We want to schedule or create a new session
            # 1. Click "Launch New Session"
            await move_and_click(page, "button:has-text('Launch New Session'), button:has-text('Create Interview')")
            await page.wait_for_timeout(1500)
            # 2. Click "Construct Workspace"
            await move_and_click(page, "button:has-text('Construct Workspace')")
            # Wait for redirection to room
            await page.wait_for_url("**/interview/room/**", timeout=20000)
            await page.wait_for_timeout(3000)
            
            # In the room:
            # 1. Type inside code editor
            editor_textarea = page.locator(".monaco-editor textarea").first
            if await editor_textarea.count() > 0:
                box = await editor_textarea.bounding_box()
                if box:
                    await move_mouse_smoothly(page, box["x"]+50, box["y"]+50, 500)
                    await page.mouse.click(box["x"]+50, box["y"]+50)
                    await page.wait_for_timeout(300)
                    await page.keyboard.type("# Welcome to the collaborative workspace.\n# Let's implement binary search.", delay=50)
                    await page.wait_for_timeout(1000)
            
            # 2. Click Chat input and send message
            chat_input = page.locator("input[placeholder='Type message...']").first
            if await chat_input.count() > 0:
                await move_click_and_type(page, "input[placeholder='Type message...']", "Hello candidate! Let's start by writing our setup code.", 50)
                # Click send
                await move_and_click(page, "button.bg-blue-600:has(svg)")
                await page.wait_for_timeout(3000)

        # Scene 12: Conclusion
        async def act_conclusion(page):
            await move_mouse_smoothly(page, 960, 540, 800)
            # Click Avatar to show menu dropdown
            avatar = page.locator("button[class*='avatar'], div[class*='avatar'], img[class*='avatar'], button:has(img)").first
            if await avatar.count() > 0:
                await move_and_click(page, "button[class*='avatar'], div[class*='avatar'], img[class*='avatar'], button:has(img)")
                await page.wait_for_timeout(3000)
            else:
                await page.mouse.wheel(0, 100)
                await page.wait_for_timeout(2000)

        # Run scenes
        await record_scene_runner(1, "01_landing", "http://localhost:5173/", act_landing)
        await record_scene_runner(2, "02_login", "http://localhost:5173/login", act_login)
        await record_scene_runner(3, "03_dashboard", "http://localhost:5173/home", act_dashboard)
        await record_scene_runner(4, "04_problems", "http://localhost:5173/problems", act_problems)
        await record_scene_runner(5, "05_solve", "http://localhost:5173/problems", act_solve)
        await record_scene_runner(6, "06_submissions", "http://localhost:5173/submissions", act_submissions)
        await record_scene_runner(7, "07_contests", "http://localhost:5173/contests", act_contests)
        await record_scene_runner(8, "08_courses", "http://localhost:5173/courses", act_courses)
        await record_scene_runner(9, "09_ailab", "http://localhost:5173/home?tab=ailab", act_ailab)
        await record_scene_runner(10, "10_roadmaps", "http://localhost:5173/home?tab=roadmap", act_roadmaps)
        await record_scene_runner(11, "11_interviews", "http://localhost:5173/interview", act_interviews)
        await record_scene_runner(12, "12_conclusion", "http://localhost:5173/home", act_conclusion)
        
        await browser.close()

def merge_audio_video():
    print("--- MERGING AUDIO AND VIDEO ---")
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    
    for scene in SCENES:
        name = scene["name"]
        video_src = os.path.join(VIDEO_DIR, f"{name}.webm")
        audio_src = os.path.join(AUDIO_DIR, f"{name}.mp3")
        output_dst = os.path.join(MERGED_DIR, f"{name}.mp4")
        
        if not os.path.exists(video_src):
            print(f"Error: Video source {video_src} does not exist. Skipping.")
            continue
        if not os.path.exists(audio_src):
            print(f"Error: Audio source {audio_src} does not exist. Skipping.")
            continue
            
        print(f"Merging {name}...")
        
        # We merge video and audio, re-encoding to h264/aac
        # We cut the output to the shortest of the two streams so that it fits exactly
        cmd = [
            ffmpeg,
            "-y",
            "-i", video_src,
            "-i", audio_src,
            "-map", "0:v",
            "-map", "1:a",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-shortest",
            output_dst
        ]
        
        subprocess.run(cmd, check=True)
        print(f"Created merged scene: {output_dst}")

def concat_scenes(output_filename):
    print("--- CONCATENATING SCENES ---")
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    
    list_file_path = os.path.join(TEMP_DIR, "file_list.txt")
    abs_merged_dir = os.path.abspath(MERGED_DIR)
    
    with open(list_file_path, "w", encoding="utf-8") as f:
        for scene in SCENES:
            name = scene["name"]
            scene_path = os.path.join(abs_merged_dir, f"{name}.mp4")
            if os.path.exists(scene_path):
                safe_path = scene_path.replace("\\", "/")
                f.write(f"file '{safe_path}'\n")
            else:
                print(f"Warning: Merged scene {scene_path} does not exist, omitting from final compilation.")
                
    print(f"Written file list for concatenation: {list_file_path}")
    
    cmd = [
        ffmpeg,
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", list_file_path,
        "-c", "copy",
        output_filename
    ]
    
    subprocess.run(cmd, check=True)
    print(f"SUCCESS: Final compiled video created at {output_filename}")

async def main():
    # 1. Generate Voiceovers
    await generate_voiceovers()
    
    # 2. Record Playwright Scenes
    await record_scenes()
    
    # 3. Merge Audio and Video
    merge_audio_video()
    
    # 4. Concatenate Final video
    output_target = "presentation/JudgeX_Demo.mp4"
    os.makedirs(os.path.dirname(output_target), exist_ok=True)
    concat_scenes(output_target)
    
    # 5. Copy to root
    root_target = "JudgeX_Demo.mp4"
    shutil.copy(output_target, root_target)
    print(f"Copied final video to root: {os.path.abspath(root_target)}")

if __name__ == "__main__":
    asyncio.run(main())
