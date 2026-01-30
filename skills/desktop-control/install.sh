#!/bin/bash
# Clawdbot Desktop Control Setup
# Run this to install desktop automation tools

set -e

echo "🤖 Clawdbot Desktop Control Setup"
echo "=================================="
echo ""
echo "Installing tools for Linux desktop automation..."
echo ""

# Update package list
echo "📦 Updating package list..."
sudo apt update

# Install essential tools
echo ""
echo "🔧 Installing essential tools (xdotool, wmctrl, xclip)..."
sudo apt install -y xdotool wmctrl xclip

# Optional tools
echo ""
echo "📸 Installing optional tools (scrot, imagemagick, xautomation)..."
sudo apt install -y scrot imagemagick xautomation

# Python automation
echo ""
read -p "Install Python automation (PyAutoGUI)? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🐍 Installing PyAutoGUI..."
    pip3 install --user pyautogui pillow pyscreeze
    echo "✅ PyAutoGUI installed!"
else
    echo "⏭️  Skipping PyAutoGUI"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Installed tools:"
echo "  - xdotool: $(xdotool --version 2>&1 | head -1)"
echo "  - wmctrl: $(wmctrl -v 2>&1 | grep version)"
echo "  - xclip: $(xclip -version 2>&1)"
echo ""
echo "🧪 Test commands:"
echo "  xdotool getactivewindow getwindowname"
echo "  wmctrl -l"
echo "  echo 'test' | xclip -selection clipboard"
echo ""
echo "📚 See RECOMMENDATION.md for usage examples"
echo ""
echo "🎉 Clawdbot can now control your desktop!"
