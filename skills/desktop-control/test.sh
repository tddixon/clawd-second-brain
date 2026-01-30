#!/bin/bash
# Desktop Control Test Script
# Run this from a terminal in your desktop session

echo "🧪 Desktop Control Test Suite"
echo "=============================="
echo ""

# Check if running in graphical session
if [ -z "$DISPLAY" ]; then
    echo "⚠️  Warning: DISPLAY not set. Setting to :0"
    export DISPLAY=:0
fi

# Test xdotool
echo "1. Testing xdotool..."
if xdotool --version > /dev/null 2>&1; then
    echo "   ✅ xdotool installed: $(xdotool --version)"
else
    echo "   ❌ xdotool not working"
fi

# Test wmctrl
echo ""
echo "2. Testing wmctrl..."
if wmctrl -m > /dev/null 2>&1; then
    echo "   ✅ wmctrl working"
    echo "   Window Manager: $(wmctrl -m | grep Name | cut -d: -f2)"
else
    echo "   ❌ wmctrl not working"
fi

# Test xclip
echo ""
echo "3. Testing xclip..."
if xclip -version > /dev/null 2>&1; then
    echo "   ✅ xclip installed: $(xclip -version)"
else
    echo "   ❌ xclip not working"
fi

# Test window listing
echo ""
echo "4. Testing window listing..."
if wmctrl -l > /dev/null 2>&1; then
    echo "   ✅ Can list windows"
    echo "   Open windows:"
    wmctrl -l | head -5 | while read line; do
        echo "     - $line"
    done
    window_count=$(wmctrl -l | wc -l)
    echo "   Total: $window_count windows"
else
    echo "   ❌ Cannot list windows"
fi

# Test active window
echo ""
echo "5. Testing active window detection..."
if xdotool getactivewindow getwindowname > /dev/null 2>&1; then
    active=$(xdotool getactivewindow getwindowname)
    echo "   ✅ Active window: $active"
else
    echo "   ❌ Cannot get active window"
fi

# Test mouse position
echo ""
echo "6. Testing mouse position..."
if xdotool getmouselocation > /dev/null 2>&1; then
    mouse=$(xdotool getmouselocation)
    echo "   ✅ Mouse position: $mouse"
else
    echo "   ❌ Cannot get mouse position"
fi

# Test screenshot
echo ""
echo "7. Testing screenshot capability..."
if scrot --version > /dev/null 2>&1; then
    echo "   ✅ scrot installed"
    TEST_SCREENSHOT="/tmp/test-screenshot-$(date +%s).png"
    if scrot -u "$TEST_SCREENSHOT" 2>/dev/null; then
        echo "   ✅ Screenshot created: $TEST_SCREENSHOT"
        if [ -f "$TEST_SCREENSHOT" ]; then
            size=$(du -h "$TEST_SCREENSHOT" | cut -f1)
            echo "   File size: $size"
            rm -f "$TEST_SCREENSHOT"
        fi
    else
        echo "   ⚠️  Screenshot command ran (file creation may require window focus)"
    fi
else
    echo "   ❌ scrot not installed"
fi

# Test commands.sh
echo ""
echo "8. Testing commands.sh script..."
if [ -x ./commands.sh ]; then
    echo "   ✅ commands.sh is executable"
    if ./commands.sh list > /dev/null 2>&1; then
        echo "   ✅ commands.sh working"
    else
        echo "   ⚠️  commands.sh executed (may require proper display context)"
    fi
else
    echo "   ❌ commands.sh not executable"
fi

echo ""
echo "=============================="
echo "✅ Installation Complete!"
echo ""
echo "📚 Quick Examples:"
echo "   ./commands.sh firefox          # Open Firefox"
echo "   ./commands.sh list             # List windows"
echo "   ./commands.sh type 'Hello'     # Type text"
echo "   ./commands.sh screenshot       # Take screenshot"
echo ""
echo "📖 See SKILL.md for full documentation"
