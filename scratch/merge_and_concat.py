import os
import subprocess
import imageio_ffmpeg
import shutil

# Setup directories
TEMP_DIR = "temp_assets"
VIDEO_DIR = os.path.join(TEMP_DIR, "videos")
AUDIO_DIR = os.path.join(TEMP_DIR, "audios")
MERGED_DIR = os.path.join(TEMP_DIR, "merged")
os.makedirs(MERGED_DIR, exist_ok=True)

# Define scenes matching the filenames
SCENES = [
    "00_title",
    "01_landing",
    "02_login",
    "03_dashboard",
    "04_problems",
    "05_solve",
    "06_submissions",
    "07_contests",
    "08_courses",
    "09_ailab",
    "10_roadmaps",
    "11_interviews",
    "12_conclusion"
]

def merge_audio_video():
    print("--- MERGING AUDIO AND VIDEO ---")
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    
    for scene in SCENES:
        video_src = os.path.join(VIDEO_DIR, f"{scene}.webm")
        audio_src = os.path.join(AUDIO_DIR, f"{scene}.mp3")
        output_dst = os.path.join(MERGED_DIR, f"{scene}.mp4")
        
        if not os.path.exists(video_src):
            print(f"Error: Video source {video_src} does not exist. Skipping.")
            continue
        if not os.path.exists(audio_src):
            print(f"Error: Audio source {audio_src} does not exist. Skipping.")
            continue
            
        print(f"Merging {scene}...")
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
    # Write using forward slashes and absolute paths for Windows compatibility
    abs_merged_dir = os.path.abspath(MERGED_DIR)
    
    with open(list_file_path, "w", encoding="utf-8") as f:
        for scene in SCENES:
            scene_path = os.path.join(abs_merged_dir, f"{scene}.mp4")
            if os.path.exists(scene_path):
                safe_path = scene_path.replace("\\", "/")
                f.write(f"file '{safe_path}'\n")
            else:
                print(f"Warning: Merged scene {scene_path} does not exist, omitting from final video.")
                
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

def main():
    # 1. Merge all
    merge_audio_video()
    
    # 2. Concatenate
    output_target = "presentation/JudgeX_Demo.mp4"
    os.makedirs(os.path.dirname(output_target), exist_ok=True)
    concat_scenes(output_target)
    
    # 3. Copy to root
    root_target = "JudgeX_Demo.mp4"
    shutil.copy(output_target, root_target)
    print(f"Copied final video to root: {os.path.abspath(root_target)}")

if __name__ == "__main__":
    main()
