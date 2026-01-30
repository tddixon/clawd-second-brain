---
name: desktop-control
description: |
  Control Linux desktop - open applications, manage windows, type text, click buttons.
  Works with Ubuntu XFCE4 using xdotool, wmctrl, and X11 automation tools.
triggers: "open app", "switch to", "launch", "type in", "click", "window", "screenshot"
---

# Desktop Control Skill

Control Ubuntu 24.04 XFCE4 desktop using X11 automation tools.

## Prerequisites

**Installed:** ✅
- xdotool (keyboard/mouse automation)
- wmctrl (window management)
- xclip (clipboard)
- scrot (screenshots)
- imagemagick (image processing)
- xautomation (visual automation)

## Environment Setup

**CRITICAL:** All commands need DISPLAY environment variable set:

```bash
export DISPLAY=:0
export XAUTHORITY=/home/desktop/.Xauthority
```

Or run commands with inline environment:
```bash
DISPLAY=:0 xdotool type "Hello"
```

## Core Capabilities

### 1. Launch Applications

**XFCE4 Application Launcher:**
```bash
DISPLAY=:0 xdotool key alt+F2
sleep 0.5
DISPLAY=:0 xdotool type "firefox"
DISPLAY=:0 xdotool key Return
```

**Direct Launch:**
```bash
DISPLAY=:0 firefox &
DISPLAY=:0 obsidian &
DISPLAY=:0 thunar /path/to/folder &
DISPLAY=:0 xfce4-terminal &
```

**XFCE4-specific:**
```bash
DISPLAY=:0 thunar ~/Documents &              # File manager
DISPLAY=:0 xfce4-terminal --command="htop" & # Terminal with command
DISPLAY=:0 xfce4-appfinder &                 # App finder
DISPLAY=:0 xfce4-settings-manager &          # Settings
```

---

### 2. Window Management

**List Windows:**
```bash
DISPLAY=:0 wmctrl -l
# Output: window_id desktop title
```

**Focus Window by Title:**
```bash
DISPLAY=:0 wmctrl -a "Firefox"
DISPLAY=:0 wmctrl -a "Obsidian"
DISPLAY=:0 wmctrl -a "Terminal"
```

**Close Window:**
```bash
DISPLAY=:0 wmctrl -c "Window Title"
```

**Maximize Window:**
```bash
DISPLAY=:0 wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz
```

**Minimize Window:**
```bash
DISPLAY=:0 wmctrl -r :ACTIVE: -b add,hidden
```

**Move Window:**
```bash
# Format: wmctrl -r "Title" -e gravity,x,y,width,height
DISPLAY=:0 wmctrl -r "Firefox" -e 0,100,100,800,600
```

**Arrange Windows:**
```bash
# Left half
DISPLAY=:0 wmctrl -r "Firefox" -e 0,0,0,960,1080

# Right half
DISPLAY=:0 wmctrl -r "Obsidian" -e 0,960,0,960,1080
```

**Show Desktop:**
```bash
DISPLAY=:0 wmctrl -k on
```

**Switch Workspace:**
```bash
DISPLAY=:0 wmctrl -s 0  # Workspace 1
DISPLAY=:0 wmctrl -s 1  # Workspace 2
```

---

### 3. Keyboard Automation

**Type Text:**
```bash
DISPLAY=:0 xdotool type "Text to type"
DISPLAY=:0 xdotool type --delay 100 "Slower typing"
```

**Press Keys:**
```bash
DISPLAY=:0 xdotool key Return         # Enter
DISPLAY=:0 xdotool key ctrl+s         # Save
DISPLAY=:0 xdotool key ctrl+c         # Copy
DISPLAY=:0 xdotool key ctrl+v         # Paste
DISPLAY=:0 xdotool key alt+Tab        # Switch window
DISPLAY=:0 xdotool key ctrl+alt+t     # Open terminal
DISPLAY=:0 xdotool key F5             # Refresh
DISPLAY=:0 xdotool key Escape         # Escape
```

**Key Combinations:**
```bash
DISPLAY=:0 xdotool key ctrl+shift+t   # New terminal tab
DISPLAY=:0 xdotool key alt+F4         # Close window
DISPLAY=:0 xdotool key super+d        # Show desktop
```

**Complex Sequences:**
```bash
# Open terminal, type command, execute
DISPLAY=:0 xdotool key ctrl+alt+t
sleep 0.5
DISPLAY=:0 xdotool type "cd ~/clawd && ls -la"
DISPLAY=:0 xdotool key Return
```

---

### 4. Mouse Control

**Get Mouse Position:**
```bash
DISPLAY=:0 xdotool getmouselocation
# Output: x:500 y:300 screen:0 window:123456
```

**Move Mouse:**
```bash
DISPLAY=:0 xdotool mousemove 500 500
DISPLAY=:0 xdotool mousemove --sync 500 500  # Wait for completion
```

**Click:**
```bash
DISPLAY=:0 xdotool click 1  # Left click
DISPLAY=:0 xdotool click 2  # Middle click
DISPLAY=:0 xdotool click 3  # Right click
```

**Double Click:**
```bash
DISPLAY=:0 xdotool click --repeat 2 1
```

**Drag:**
```bash
DISPLAY=:0 xdotool mousedown 1
DISPLAY=:0 xdotool mousemove 600 600
DISPLAY=:0 xdotool mouseup 1
```

**Move Relative:**
```bash
DISPLAY=:0 xdotool mousemove_relative 100 0   # Move 100px right
DISPLAY=:0 xdotool mousemove_relative 0 100   # Move 100px down
```

---

### 5. Clipboard Operations

**Copy to Clipboard:**
```bash
echo "Hello from Clawdbot" | DISPLAY=:0 xclip -selection clipboard
```

**Paste from Clipboard:**
```bash
DISPLAY=:0 xclip -selection clipboard -o
```

**Copy File Content:**
```bash
cat /path/to/file.txt | DISPLAY=:0 xclip -selection clipboard
```

**Use in Workflow:**
```bash
# Copy text and paste into active window
echo "Text" | DISPLAY=:0 xclip -selection clipboard
DISPLAY=:0 xdotool key ctrl+v
```

---

### 6. Screenshots

**Full Screen:**
```bash
DISPLAY=:0 scrot ~/screenshot.png
```

**Active Window:**
```bash
DISPLAY=:0 scrot -u ~/window-screenshot.png
```

**Select Region (Interactive):**
```bash
DISPLAY=:0 scrot -s ~/region-screenshot.png
```

**With Delay:**
```bash
DISPLAY=:0 scrot -d 5 ~/screenshot-5sec.png
```

**Thumbnail:**
```bash
DISPLAY=:0 scrot -t 20 ~/screenshot.png
# Creates screenshot.png and screenshot-thumb.png
```

---

### 7. Window Information

**Get Active Window:**
```bash
DISPLAY=:0 xdotool getactivewindow
# Returns: window ID
```

**Get Window Name:**
```bash
DISPLAY=:0 xdotool getactivewindow getwindowname
# Returns: window title
```

**Get Window Geometry:**
```bash
DISPLAY=:0 xwininfo -id $(DISPLAY=:0 xdotool getactivewindow)
```

**Find Window by Name:**
```bash
DISPLAY=:0 xdotool search --name "Firefox"
# Returns: window IDs matching "Firefox"
```

---

## Common Workflows

### Open Application and Navigate

```bash
#!/bin/bash
export DISPLAY=:0

# Open Firefox (or focus if already open)
wmctrl -a "Firefox" || firefox &
sleep 2

# Open new tab
xdotool key ctrl+t
sleep 0.5

# Navigate to URL
xdotool type "nomads.com"
xdotool key Return
```

### Switch to Application and Type

```bash
#!/bin/bash
export DISPLAY=:0

# Focus Obsidian
wmctrl -a "Obsidian"
sleep 0.5

# Search for note
xdotool key ctrl+o
sleep 0.5
xdotool type "Nomads Bangkok"
xdotool key Return
```

### Take Screenshot and Copy Path

```bash
#!/bin/bash
export DISPLAY=:0

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SCREENSHOT="/tmp/screenshot-${TIMESTAMP}.png"

# Take screenshot
scrot -u "$SCREENSHOT"

# Copy path to clipboard
echo "$SCREENSHOT" | xclip -selection clipboard

echo "Screenshot saved: $SCREENSHOT"
```

### Fill Form

```bash
#!/bin/bash
export DISPLAY=:0

# Focus browser
wmctrl -a "Firefox"
sleep 0.5

# Fill form fields
xdotool type "trevor@nomads.com"
xdotool key Tab
xdotool type "password123"
xdotool key Tab
xdotool key Return
```

### Arrange Workspace

```bash
#!/bin/bash
export DISPLAY=:0

# Left half - Browser
wmctrl -r "Firefox" -e 0,0,0,960,1080

# Right half - Editor
wmctrl -r "Obsidian" -e 0,960,0,960,1080

# Or maximize both on different workspaces
wmctrl -r "Firefox" -t 0 -b add,maximized_vert,maximized_horz
wmctrl -r "Obsidian" -t 1 -b add,maximized_vert,maximized_horz
```

---

## Best Practices

### 1. Always Set DISPLAY

```bash
export DISPLAY=:0
# Or inline: DISPLAY=:0 command
```

### 2. Add Delays

```bash
xdotool key ctrl+t
sleep 0.5  # Wait for new tab
xdotool type "url"
```

### 3. Check if Window Exists

```bash
if wmctrl -l | grep -q "Firefox"; then
    wmctrl -a "Firefox"
else
    firefox &
fi
```

### 4. Focus Before Typing

```bash
wmctrl -a "Window Title"
sleep 0.5
xdotool type "text"
```

### 5. Error Handling

```bash
if ! DISPLAY=:0 wmctrl -a "App"; then
    echo "Error: Could not focus App"
    exit 1
fi
```

---

## Helper Functions

### Focus or Launch App

```bash
focus_or_launch() {
    local app_name="$1"
    local app_command="$2"
    
    export DISPLAY=:0
    
    if ! wmctrl -a "$app_name"; then
        $app_command &
        sleep 2
    fi
}

# Usage:
focus_or_launch "Firefox" "firefox"
focus_or_launch "Obsidian" "obsidian"
```

### Type in Active Window

```bash
type_in_active() {
    export DISPLAY=:0
    xdotool type "$1"
}

# Usage:
type_in_active "Hello from Clawdbot"
```

### Click at Coordinates

```bash
click_at() {
    export DISPLAY=:0
    xdotool mousemove "$1" "$2"
    xdotool click 1
}

# Usage:
click_at 500 300
```

---

## Integration with Clawdbot

### Command Pattern

When user says: "open Firefox"
```bash
DISPLAY=:0 wmctrl -a "Firefox" || DISPLAY=:0 firefox &
```

When user says: "switch to Obsidian"
```bash
DISPLAY=:0 wmctrl -a "Obsidian"
```

When user says: "type this text"
```bash
DISPLAY=:0 xdotool type "this text"
```

When user says: "take screenshot"
```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DISPLAY=:0 scrot -u "/tmp/screenshot-${TIMESTAMP}.png"
echo "Screenshot saved: /tmp/screenshot-${TIMESTAMP}.png"
```

---

## Troubleshooting

### Display Not Found

**Error:** `Cannot open display`

**Fix:**
```bash
export DISPLAY=:0
export XAUTHORITY=/home/desktop/.Xauthority
```

### Permission Denied

**Error:** `No protocol specified`

**Fix:**
```bash
xhost +local:
```

### Window Not Found

**Error:** Window title doesn't match

**Solution:** List windows and find exact title
```bash
DISPLAY=:0 wmctrl -l
```

### Commands Too Fast

**Issue:** Actions happen before window is ready

**Fix:** Add sleep delays
```bash
command1
sleep 0.5
command2
```

---

## Limitations

1. **Requires X11:** Works with XFCE4 on X11, not Wayland
2. **Window Focus:** Must focus window before typing
3. **Timing Sensitive:** Needs delays between actions
4. **Display Access:** Requires DISPLAY environment variable
5. **User Context:** Only controls windows owned by user `desktop`

---

## Advanced Features

### Image Recognition (xautomation)

```bash
# Find image on screen
DISPLAY=:0 xte 'mouseclick 1'
```

### Pixel Color Detection

```bash
# Get pixel color at position
DISPLAY=:0 import -window root -crop 1x1+500+300 txt:- | grep -o '#[0-9A-F]*'
```

### Screen Recording

```bash
# Record screen (requires ffmpeg)
ffmpeg -video_size 1920x1080 -framerate 25 -f x11grab -i :0.0 output.mp4
```

---

## Reference

**Installed Tools:**
- xdotool 3.20160805.1
- wmctrl 1.07
- xclip 0.13
- scrot 1.10
- imagemagick 6.9.12
- xautomation 1.09

**Documentation:**
- `man xdotool`
- `man wmctrl`
- `man xclip`
- `man scrot`

**See Also:**
- RECOMMENDATION.md - Complete guide
- install.sh - Installation script
