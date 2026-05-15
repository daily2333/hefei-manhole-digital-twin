@echo off
REM Batch export script for draw.io diagrams
REM Requires draw.io desktop installed: https://github.com/jgraph/drawio-desktop/releases

set DRAWIO="C:\Program Files\draw.io\draw.io.exe"
set INPUT_DIR=%~dp0
set OUTPUT_DIR=%~dp0

echo ========================================
echo Draw.io Diagram Export Tool
echo ========================================
echo.

REM Check if draw.io exists
if not exist %DRAWIO% (
    echo ERROR: draw.io not found at %DRAWIO%
    echo Please install draw.io from: https://github.com/jgraph/drawio-desktop/releases
    pause
    exit /b 1
)

echo Exporting diagrams to PNG and SVG formats...
echo.

REM Export each file
for %%f in ("%INPUT_DIR%*.drawio") do (
    echo Processing: %%~nf.drawio
    
    REM Export PNG with embedded XML
    %DRAWIO% -x -f png -e -s 2 -o "%OUTPUT_DIR%%%~nf.drawio.png" "%%f"
    
    REM Export SVG with embedded XML
    %DRAWIO% -x -f svg -e -o "%OUTPUT_DIR%%%~nf.svg" "%%f"
    
    echo   - PNG: %%~nf.drawio.png
    echo   - SVG: %%~nf.svg
    echo.
)

echo ========================================
echo Export complete!
echo ========================================
echo.
echo Total files exported:
dir /b "%OUTPUT_DIR%*.png" 2>nul | find /c /v "" 
echo PNG files
dir /b "%OUTPUT_DIR%*.svg" 2>nul | find /c /v ""
echo SVG files
echo.
pause
