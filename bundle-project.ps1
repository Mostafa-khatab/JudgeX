# JudgeX Bundling Script
# This script creates a ZIP file of the project excluding node_modules and .git folders.

$sourceDir = Get-Location
$zipFileName = "JudgeX_Project_Bundle.zip"
$zipFile = Join-Path $sourceDir $zipFileName
$tempDir = Join-Path $env:TEMP "JudgeX_Temp_Bundle_$(Get-Random)"

Write-Host "Starting project bundle..." -ForegroundColor Cyan

# Cleanup old files
if (Test-Path $zipFile) { 
    Write-Host "Removing existing zip file..." -ForegroundColor Gray
    Remove-Item $zipFile 
}

# Create temp directory
New-Item -ItemType Directory -Path $tempDir -ErrorAction SilentlyContinue | Out-Null

Write-Host "Copying files (this might take a moment)..." -ForegroundColor Yellow

# Copy files excluding node_modules and .git
# We use a pattern matching approach to filter out unwanted directories
Get-ChildItem -Path $sourceDir -Recurse | Where-Object { 
    $_.FullName -notmatch "node_modules" -and 
    $_.FullName -notmatch "\\\.git" -and
    $_.Name -ne $zipFileName -and
    $_.Name -ne "bundle-project.ps1"
} | ForEach-Object {
    $relativePath = $_.FullName.Substring($sourceDir.Path.Length).TrimStart("\")
    $destPath = Join-Path $tempDir $relativePath
    
    if ($_.PSIsContainer) {
        New-Item -ItemType Directory -Path $destPath -Force | Out-Null
    } else {
        # Ensure parent directory exists (needed for deep files)
        $parentDir = Split-Path $destPath
        if (-not (Test-Path $parentDir)) { New-Item -ItemType Directory -Path $parentDir -Force | Out-Null }
        Copy-Item -Path $_.FullName -Destination $destPath -Force
    }
}

Write-Host "Creating ZIP archive..." -ForegroundColor Yellow
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -Force

# Cleanup temp dir
Write-Host "Cleaning up temporary files..." -ForegroundColor Gray
Remove-Item -Recurse -Force $tempDir

Write-Host "Success! Your project has been bundled into: $zipFile" -ForegroundColor Green
Write-Host "You can now send this ZIP file to your friend." -ForegroundColor Cyan
