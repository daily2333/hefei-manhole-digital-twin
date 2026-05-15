# PowerShell export script for draw.io diagrams
# Requires draw.io desktop installed: https://github.com/jgraph/drawio-desktop/releases

$DRAWIO = "C:\Program Files\draw.io\draw.io.exe"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Draw.io Diagram Export Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if draw.io exists
if (-not (Test-Path $DRAWIO)) {
    Write-Host "ERROR: draw.io not found at $DRAWIO" -ForegroundColor Red
    Write-Host "Please install draw.io from: https://github.com/jgraph/drawio-desktop/releases" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Exporting diagrams to PNG and SVG formats..." -ForegroundColor Green
Write-Host ""

# Get all .drawio files
$drawioFiles = Get-ChildItem -Path $ScriptDir -Filter "*.drawio"

$totalFiles = $drawioFiles.Count
$currentFile = 0

foreach ($file in $drawioFiles) {
    $currentFile++
    $percentComplete = [math]::Round(($currentFile / $totalFiles) * 100)
    
    Write-Progress -Activity "Exporting Diagrams" -Status "Processing $($file.Name)" -PercentComplete $percentComplete
    Write-Host "[$currentFile/$totalFiles] Processing: $($file.Name)" -ForegroundColor Yellow
    
    $baseName = $file.BaseName
    $pngPath = Join-Path $ScriptDir "$baseName.drawio.png"
    $svgPath = Join-Path $ScriptDir "$baseName.svg"
    
    # Export PNG with embedded XML
    & $DRAWIO -x -f png -e -s 2 -o $pngPath $file.FullName
    Write-Host "  - PNG: $baseName.drawio.png" -ForegroundColor Gray
    
    # Export SVG with embedded XML
    & $DRAWIO -x -f svg -e -o $svgPath $file.FullName
    Write-Host "  - SVG: $baseName.svg" -ForegroundColor Gray
    
    Write-Host ""
}

Write-Progress -Activity "Exporting Diagrams" -Completed

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Export complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$pngCount = (Get-ChildItem -Path $ScriptDir -Filter "*.png").Count
$svgCount = (Get-ChildItem -Path $ScriptDir -Filter "*.svg").Count

Write-Host "Total files exported:" -ForegroundColor White
Write-Host "  $pngCount PNG files" -ForegroundColor Green
Write-Host "  $svgCount SVG files" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
