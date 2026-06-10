import os
import sys
import re
import asyncio
import json
import subprocess
import shutil

# Standard dependencies check
required_packages = ["playwright", "edge-tts", "imageio-ffmpeg"]
for pkg in required_packages:
    try:
        __import__(pkg.replace("-", "_"))
    except ImportError:
        print(f"Installing {pkg}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

# Check if playwright browsers are installed
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
os.makedirs(VIDEO_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(MERGED_DIR, exist_ok=True)

# Voice configuration
VOICE = "en-US-GuyNeural" # Professional, clear narrator voice

# Define scenes (Updated to use localhost)
SCENES = [
    {
        "id": 0,
        "name": "00_title",
        "url": "data:text/html,",
        "voiceover": "Welcome to the official project demo of JudgeX, an innovative platform designed for automated code evaluation and collaborative technical interviews.",
        "duration": 9.0
    },
    {
        "id": 1,
        "name": "01_landing",
        "url": "http://localhost:5173/",
        "voiceover": "JudgeX is a comprehensive hub for programming contests, structured learning, and engineering interviews. Let's explore the platform's key features, starting with a clean and informative landing page highlighting its core value proposition.",
        "duration": 17.0
    },
    {
        "id": 2,
        "name": "02_login",
        "url": "http://localhost:5173/login",
        "voiceover": "Logging in with our credentials takes us through a secure and seamless authentication process, redirection occurs automatically as our profile details are loaded.",
        "duration": 11.0
    },
    {
        "id": 3,
        "name": "03_dashboard",
        "url": "http://localhost:5173/home",
        "voiceover": "The home dashboard is our command center. It presents user stats, current rank, completed missions, a daily coding challenge, recent blog feeds, and a quick sidebar featuring top competitors and ongoing contests.",
        "duration": 16.0
    },
    {
        "id": 4,
        "name": "04_problems",
        "url": "http://localhost:5173/problems",
        "voiceover": "In the Problems section, users can browse through a rich collection of algorithmic questions. With advanced search and filters for difficulty and topics, finding the right challenge is effortless.",
        "duration": 15.0
    },
    {
        "id": 5,
        "name": "05_solve",
        "url": "http://localhost:5173/problems",
        "voiceover": "Clicking a problem opens the immersive solving environment. Here, we can read the problem details, select our preferred language, write our solution in a full-fledged Monaco code editor, and submit it.",
        "duration": 22.0
    },
    {
        "id": 6,
        "name": "06_submissions",
        "url": "http://localhost:5173/submissions",
        "voiceover": "Once submitted, the code runs against our automated grading system. The Submissions history page records all past attempts, displaying compilation details, execution runtime, memory footprint, and final verdict in real-time.",
        "duration": 16.0
    },
    {
        "id": 7,
        "name": "07_contests",
        "url": "http://localhost:5173/contests",
        "voiceover": "For competitive programmers, the Contests tab displays upcoming, active, and completed programming contests. Each contest page includes problem sets, specific timelines, and a live leaderboard tracking participants.",
        "duration": 16.0
    },
    {
        "id": 8,
        "name": "08_courses",
        "url": "http://localhost:5173/courses",
        "voiceover": "Structured learning is supported via the Courses feature. Students can view curated paths, monitor their curriculum progress, dive into specific lessons, and practice core concepts step-by-step.",
        "duration": 15.0
    },
    {
        "id": 9,
        "name": "09_ailab",
        "url": "http://localhost:5173/home?tab=ailab",
        "voiceover": "Stuck on a problem? The AI Lab tab offers an integrated chatbot powered by advanced generative models. Students can ask conceptual questions, debug logic, and receive code explanations immediately.",
        "duration": 16.0
    },
    {
        "id": 10,
        "name": "10_roadmaps",
        "url": "http://localhost:5173/home?tab=roadmap",
        "voiceover": "The interactive AI Learning Roadmaps, rendered using dynamic node graphs, visualizes data structures and algorithm pathways. Selecting a node displays detail overlays, making curriculum paths intuitive.",
        "duration": 17.0
    },
    {
        "id": 11,
        "name": "11_interviews",
        "url": "http://localhost:5173/interview",
        "voiceover": "For recruitment, the Interview module provides collaborative rooms. Instructors can schedule sessions, write code interactively with candidates via web-sockets, chat in real-time, and fill out candidate evaluation reports.",
        "duration": 18.0
    },
    {
        "id": 12,
        "name": "12_conclusion",
        "url": "http://localhost:5173/home",
        "voiceover": "JudgeX successfully bridges the gap between practicing coding, tracking personal growth, and conducting tech recruitment. Thank you for watching the walkthrough.",
        "duration": 12.0
    }
]

# Helper to get audio duration using ffmpeg
def get_audio_duration(file_path):
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    result = subprocess.run([ffmpeg, "-i", file_path], stderr=subprocess.PIPE, text=True)
    match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", result.stderr)
    if match:
        hours = int(match.group(1))
        minutes = int(match.group(2))
        seconds = float(match.group(3))
        return hours * 3600 + minutes * 60 + seconds
    return 10.0

# Generate TTS files
async def generate_voiceovers():
    print("--- GENERATING VOICEOVERS ---")
    for scene in SCENES:
        name = scene["name"]
        text = scene["voiceover"]
        out_path = os.path.join(AUDIO_DIR, f"{name}.mp3")
        print(f"Generating audio for {name}...")
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(out_path)
        
        # Read duration
        dur = get_audio_duration(out_path)
        scene["duration"] = dur
        print(f"Audio generated: {out_path} ({dur:.2f} seconds)")

# Record screen using Playwright
async def record_scenes():
    print("--- RECORDING SCENES ---")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Scene 0: Title Card
        print("Recording Scene 0: Title Card...")
        intro_context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=VIDEO_DIR,
            record_video_size={"width": 1280, "height": 720}
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
            .container { animation: fadeIn 2s ease-in-out; }
            h1 {
                font-size: 72px; font-weight: 900; margin: 0 0 10px 0;
                background: linear-gradient(to right, #38bdf8, #818cf8);
                -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                letter-spacing: -2px;
            }
            h2 { font-size: 24px; font-weight: 600; color: #a5b4fc; margin: 0 0 40px 0; max-width: 700px; }
            .badge {
                padding: 6px 16px; border-radius: 9999px; background: rgba(99, 102, 241, 0.2);
                border: 1px solid rgba(99, 102, 241, 0.4); font-size: 14px; font-weight: 600;
                letter-spacing: 2px; text-transform: uppercase; color: #818cf8;
            }
            @keyframes fadeIn {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
            }
        </style>
        </head>
        <body>
            <div class="container">
                <h1>JudgeX</h1>
                <h2>Online Judging & Collaborative Recruitment Platform</h2>
                <div class="badge">Project Walkthrough</div>
            </div>
        </body>
        </html>
        """
        
        await intro_page.set_content(title_html)
        await intro_page.wait_for_timeout(int(SCENES[0]["duration"] * 1000) + 1000)
        await intro_context.close() # Saves the video
        
        # Rename the recorded video for scene 0
        recorded_files = [f for f in os.listdir(VIDEO_DIR) if f.endswith(".webm")]
        if recorded_files:
            latest_file = os.path.join(VIDEO_DIR, recorded_files[0])
            dest_file = os.path.join(VIDEO_DIR, "00_title.webm")
            if os.path.exists(dest_file): os.remove(dest_file)
            os.rename(latest_file, dest_file)
            print(f"Recorded scene 0: {dest_file}")
            
        # Scene 1: Landing Page
        print("Recording Scene 1: Landing Page...")
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=VIDEO_DIR,
            record_video_size={"width": 1280, "height": 720}
        )
        page = await context.new_page()
        await page.goto("http://localhost:5173/")
        await page.wait_for_timeout(2000)
        
        # Scroll down smoothly
        scroll_steps = int(SCENES[1]["duration"] * 2) - 4
        for _ in range(scroll_steps):
            await page.mouse.wheel(0, 150)
            await page.wait_for_timeout(300)
            
        await page.wait_for_timeout(1500)
        await context.close()
        
        # Rename Scene 1 video
        recorded_files = [f for f in os.listdir(VIDEO_DIR) if f.endswith(".webm") and not f.startswith("00_")]
        if recorded_files:
            latest_file = os.path.join(VIDEO_DIR, recorded_files[0])
            dest_file = os.path.join(VIDEO_DIR, "01_landing.webm")
            if os.path.exists(dest_file): os.remove(dest_file)
            os.rename(latest_file, dest_file)
            print(f"Recorded scene 1: {dest_file}")
            
        # Scene 2: Login
        print("Recording Scene 2: Login Page...")
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=VIDEO_DIR,
            record_video_size={"width": 1280, "height": 720}
        )
        page = await context.new_page()
        await page.goto("http://localhost:5173/login")
        await page.wait_for_timeout(2000)
        
        await page.fill("input[placeholder='Email']", "maaastafakhatab200@gmail.com")
        await page.wait_for_timeout(500)
        await page.fill("input[placeholder='Password']", "mostafA#22")
        await page.wait_for_timeout(800)
        
        # Click login button using robust locator
        login_btn = page.locator("button.bg-gradient-to-r")
        await login_btn.click()
        
        # Wait for redirect
        await page.wait_for_url("**/home", timeout=15000)
        await page.wait_for_timeout(2000)
        
        # Save storage state
        await context.storage_state(path="state.json")
        await context.close()
        
        # Rename Scene 2 video
        recorded_files = [f for f in os.listdir(VIDEO_DIR) if f.endswith(".webm") and not (f.startswith("00_") or f.startswith("01_"))]
        if recorded_files:
            latest_file = os.path.join(VIDEO_DIR, recorded_files[0])
            dest_file = os.path.join(VIDEO_DIR, "02_login.webm")
            if os.path.exists(dest_file): os.remove(dest_file)
            os.rename(latest_file, dest_file)
            print(f"Recorded scene 2: {dest_file}")
            
        # Helper function for logged-in scenes
        async def record_auth_scene(scene_id, scene_name, nav_url, custom_actions=None):
            print(f"Recording Scene {scene_id}: {scene_name}...")
            context = await browser.new_context(
                storage_state="state.json",
                viewport={"width": 1280, "height": 720},
                record_video_dir=VIDEO_DIR,
                record_video_size={"width": 1280, "height": 720}
            )
            page = await context.new_page()
            await page.goto(nav_url)
            await page.wait_for_timeout(3000)
            
            start_time = asyncio.get_event_loop().time()
            
            if custom_actions:
                try:
                    await custom_actions(page)
                except Exception as e:
                    print(f"Error in custom actions for {scene_name}: {e}")
                    
            elapsed = asyncio.get_event_loop().time() - start_time
            target_dur = SCENES[scene_id]["duration"]
            remaining = target_dur - elapsed
            if remaining > 0:
                await page.wait_for_timeout(int(remaining * 1000) + 1000)
                
            await context.close()
            
            # Find and rename
            exclude_prefixes = [f"{s['id']:02d}_" for s in SCENES if s["id"] < scene_id]
            recorded_files = [f for f in os.listdir(VIDEO_DIR) if f.endswith(".webm") and not any(f.startswith(p) for p in exclude_prefixes)]
            if recorded_files:
                latest_file = os.path.join(VIDEO_DIR, recorded_files[0])
                dest_file = os.path.join(VIDEO_DIR, f"{scene_id:02d}_{scene_name}.webm")
                if os.path.exists(dest_file): os.remove(dest_file)
                os.rename(latest_file, dest_file)
                print(f"Recorded scene {scene_id}: {dest_file}")

        # Scene 3: Dashboard
        async def actions_dashboard(page):
            await page.mouse.wheel(0, 100)
            await page.wait_for_timeout(1000)
            await page.mouse.wheel(0, 150)
            await page.wait_for_timeout(2000)
            await page.mouse.wheel(0, -250)
            await page.wait_for_timeout(1000)
            
        await record_auth_scene(3, "dashboard", "http://localhost:5173/home", actions_dashboard)
        
        # Scene 4: Problems List
        async def actions_problems(page):
            await page.mouse.wheel(0, 200)
            await page.wait_for_timeout(2000)
            await page.mouse.wheel(0, 200)
            await page.wait_for_timeout(1000)
            await page.mouse.wheel(0, -400)
            await page.wait_for_timeout(1000)
            
        await record_auth_scene(4, "problems", "http://localhost:5173/problems", actions_problems)
        
        # Scene 5: Solve
        async def actions_solve(page):
            problem_link = page.locator("a[href*='/problem/']").first
            if await problem_link.count() > 0:
                print("Clicking first problem link...")
                href = await problem_link.get_attribute("href")
                prob_id = href.split("/")[-1]
                solve_url = f"http://localhost:5173/problem/{prob_id}/solve"
                print(f"Navigating to solve URL: {solve_url}")
                await page.goto(solve_url)
                await page.wait_for_timeout(4000)
                
                # Monaco typing
                textarea = page.locator(".monaco-editor textarea")
                if await textarea.count() > 0:
                    print("Found Monaco editor. Typing code...")
                    await textarea.focus()
                    await page.keyboard.press("Control+KeyA")
                    await page.keyboard.press("Delete")
                    await page.wait_for_timeout(500)
                    
                    code = (
                        "# Optimized solution\n"
                        "def solve(nums, target):\n"
                        "    seen = {}\n"
                        "    for i, n in enumerate(nums):\n"
                        "        diff = target - n\n"
                        "        if diff in seen:\n"
                        "            return [seen[diff], i]\n"
                        "        seen[n] = i\n"
                    )
                    await textarea.type(code, delay=40)
                    await page.wait_for_timeout(1000)
                    
                    # Click Submit button
                    submit_btn = page.locator("button:has-text('Submit')")
                    if await submit_btn.count() > 0:
                        print("Clicking submit button...")
                        await submit_btn.first.click()
                        await page.wait_for_timeout(6000) # Wait for grading loader
            else:
                print("No problem found! Navigating to courses fallback.")
                
        await record_auth_scene(5, "solve", "http://localhost:5173/problems", actions_solve)
        
        # Scene 6: Submissions History
        async def actions_submissions(page):
            await page.mouse.wheel(0, 200)
            await page.wait_for_timeout(2000)
            details_link = page.locator("a[href*='/submission/']").first
            if await details_link.count() > 0:
                print("Clicking submission details...")
                await details_link.click()
                await page.wait_for_timeout(3000)
                await page.mouse.wheel(0, 150)
                await page.wait_for_timeout(1000)
                
        await record_auth_scene(6, "submissions", "http://localhost:5173/submissions", actions_submissions)
        
        # Scene 7: Contests
        async def actions_contests(page):
            await page.mouse.wheel(0, 200)
            await page.wait_for_timeout(1500)
            contest_link = page.locator("a[href*='/contest/']").first
            if await contest_link.count() > 0:
                print("Clicking contest link...")
                await contest_link.click()
                await page.wait_for_timeout(3000)
                await page.mouse.wheel(0, 200)
                await page.wait_for_timeout(1000)
                
        await record_auth_scene(7, "contests", "http://localhost:5173/contests", actions_contests)
        
        # Scene 8: Courses
        async def actions_courses(page):
            await page.mouse.wheel(0, 150)
            await page.wait_for_timeout(1500)
            course_link = page.locator("a[href*='/course/']").first
            if await course_link.count() > 0:
                print("Clicking course link...")
                await course_link.click()
                await page.wait_for_timeout(3000)
                await page.mouse.wheel(0, 250)
                await page.wait_for_timeout(1000)
                
        await record_auth_scene(8, "courses", "http://localhost:5173/courses", actions_courses)
        
        # Scene 9: AI Lab Chatbot
        async def actions_ailab(page):
            input_box = page.locator("textarea[placeholder*='ask'], input[placeholder*='ask'], textarea[placeholder*='message'], input[placeholder*='message']").first
            if await input_box.count() > 0:
                print("Typing AI question...")
                await input_box.fill("Explain dynamic programming in 1 sentence.")
                await page.wait_for_timeout(800)
                send_btn = page.locator("button:has-text('Send'), button:has(svg)").first
                await send_btn.click()
                await page.wait_for_timeout(5000)
                await page.mouse.wheel(0, 200)
                await page.wait_for_timeout(1000)
            else:
                print("Chat input not found, scrolling page instead.")
                await page.mouse.wheel(0, 200)
                
        await record_auth_scene(9, "ailab", "http://localhost:5173/home?tab=ailab", actions_ailab)
        
        # Scene 10: Roadmaps
        async def actions_roadmaps(page):
            await page.wait_for_timeout(2000)
            flow_node = page.locator(".react-flow__node, .roadmap-node").first
            if await flow_node.count() > 0:
                print("Clicking roadmap node...")
                await flow_node.click()
                await page.wait_for_timeout(2000)
                await page.mouse.wheel(0, 100)
                await page.wait_for_timeout(1500)
            else:
                print("No roadmap nodes found.")
                await page.mouse.wheel(0, 150)
                
        await record_auth_scene(10, "roadmaps", "http://localhost:5173/home?tab=roadmap", actions_roadmaps)
        
        # Scene 11: Interviews
        async def actions_interviews(page):
            await page.mouse.wheel(0, 150)
            await page.wait_for_timeout(1500)
            room_link = page.locator("a[href*='/interview/room/'], a[href*='/interview/join/']").first
            if await room_link.count() > 0:
                print("Entering interview room...")
                await room_link.click()
                await page.wait_for_timeout(4000)
                await page.mouse.wheel(0, 100)
                await page.wait_for_timeout(1000)
            else:
                print("No active room found. Hovering interview list.")
                
        await record_auth_scene(11, "interviews", "http://localhost:5173/interview", actions_interviews)
        
        # Scene 12: Conclusion
        async def actions_conclusion(page):
            await page.mouse.wheel(0, 100)
            await page.wait_for_timeout(2000)
            await page.mouse.wheel(0, -100)
            
        await record_auth_scene(12, "conclusion", "http://localhost:5173/home", actions_conclusion)
        
        print("Closing browser...")
        await browser.close()

# Combine video and audio for each scene using ffmpeg
def merge_audio_video():
    print("--- MERGING AUDIO AND VIDEO ---")
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    
    for scene in SCENES:
        name = scene["name"]
        id_str = f"{scene['id']:02d}"
        
        video_src = os.path.join(VIDEO_DIR, f"{id_str}_{name}.webm")
        if scene["id"] == 0:
            video_src = os.path.join(VIDEO_DIR, "00_title.webm")
        elif scene["id"] == 1:
            video_src = os.path.join(VIDEO_DIR, "01_landing.webm")
        elif scene["id"] == 2:
            video_src = os.path.join(VIDEO_DIR, "02_login.webm")
            
        audio_src = os.path.join(AUDIO_DIR, f"{name}.mp3")
        output_dst = os.path.join(MERGED_DIR, f"{id_str}_{name}.mp4")
        
        if not os.path.exists(video_src):
            print(f"Warning: Video source {video_src} does not exist. Skipping.")
            continue
            
        print(f"Merging {name}...")
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

# Concatenate all scenes into a single final MP4
def concat_scenes(output_filename):
    print("--- CONCATENATING SCENES ---")
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    
    list_file_path = os.path.join(TEMP_DIR, "file_list.txt")
    with open(list_file_path, "w") as f:
        for scene in SCENES:
            name = scene["name"]
            id_str = f"{scene['id']:02d}"
            scene_path = os.path.join(MERGED_DIR, f"{id_str}_{name}.mp4")
            if os.path.exists(scene_path):
                safe_path = scene_path.replace("\\", "/")
                f.write(f"file '{safe_path}'\n")
                
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

# Run main flow
async def main():
    # 1. Voiceovers
    await generate_voiceovers()
    
    # 2. Recording
    await record_scenes()
    
    # 3. Merge Audio and Video
    merge_audio_video()
    
    # 4. Concatenate into Final Video
    output_target = "presentation/JudgeX_Demo.mp4"
    os.makedirs(os.path.dirname(output_target), exist_ok=True)
    
    concat_scenes(output_target)
    
    # Also save to the root directory for easy download
    root_target = "JudgeX_Demo.mp4"
    shutil.copy(output_target, root_target)
    print(f"Copied final video to root: {os.path.abspath(root_target)}")

if __name__ == "__main__":
    asyncio.run(main())
