@echo off
echo Installing required Python packages...
pip install requests beautifulsoup4

echo.
echo Running image downloader script...
python download_images.py

echo.
echo Done!
pause
