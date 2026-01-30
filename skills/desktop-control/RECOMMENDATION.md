# Linux Desktop Control for Clawdbot

Comprehensive guide for enabling Clawdbot to control your Ubuntu 24.04 XFCE4 desktop.

## 🖥️ Your System

**OS:** Ubuntu 24.04.3 LTS (Noble Numbat)
**Desktop:** XFCE4
**Display Server:** X11
**User:** desktop

---

## 🎯 Recommended Tool Stack

### Tier 1: Essential (Install These First)

#### 1. **xdotool** ⭐ (Most Important)

**What it does:**
- Simulate keyboard input (type text, press keys)
- Simulate mouse clicks and movement
- Find and focus windows
- Resize/move windows
- Get window information

**Install:**
```bash
sudo apt install xdotool
```

**Example commands I can run:**
```bash
# Type text
xdotool type "Hello from Clawdbot"

# Press keys
xdotool key ctrl+alt+t  # Open terminal
xdotool key Return      # Press Enter
xdotool key alt+Tab     # Switch windows

# Click mouse
xdotool click 1         # Left click
xdotool mousemove 500 500  # Move mouse to coordinates

# Window management
xdotool search --name "Firefox" windowactivate  # Focus Firefox
xdotool getactivewindow getwindowname          # Get active window name

# Complex sequences
xdotool key ctrl+t type "firefox" key Return   # Open new terminal, type, enter
```

**Use cases:**
- Open applications via keyboard shortcuts
- Type into applications
- Navigate menus
- Switch between windows
- Fill forms
- Automate repetitive tasks

---

#### 2. **wmctrl** ⭐

**What it does:**
- List all open windows
- Switch to specific windows
- Close windows
- Minimize/maximize windows
- Move windows between workspaces

**Install:**
```bash
sudo apt install wmctrl
```

**Example commands:**
```bash
# List all windows
wmctrl -l

# Focus window by title
wmctrl -a "Firefox"

# Close window
wmctrl -c "Window Title"

# Maximize window
wmctrl -r "Firefox" -b add,maximized_vert,maximized_horz

# Move window
wmctrl -r "Firefox" -e 0,100,100,800,600  # x,y,width,height

# Switch workspace
wmctrl -s 2  # Switch to workspace 2
```

**Use cases:**
- Window management
- Application switching
- Workspace navigation
- Window positioning

---

#### 3. **xclip**

**What it does:**
- Read/write clipboard content
- Paste content from command line

**Install:**
```bash
sudo apt install xclip
```

**Example commands:**
```bash
# Copy text to clipboard
echo "Hello" | xclip -selection clipboard

# Paste from clipboard
xclip -selection clipboard -o

# Copy file content
cat file.txt | xclip -selection clipboard
```

**Use cases:**
- Copy/paste automation
- Transfer data between applications
- Quick text manipulation

---

### Tier 2: Advanced (Optional but Powerful)

#### 4. **xprop & xwininfo** (Already Installed ✓)

**What they do:**
- Get detailed window information
- Inspect window properties
- Find window IDs and classes

**Example commands:**
```bash
# Get active window info
xprop -root _NET_ACTIVE_WINDOW

# Get window geometry
xwininfo -name "Firefox"

# Click on window to inspect
xprop | grep CLASS
```

---

#### 5. **Python PyAutoGUI** (Recommended for Complex Automation)

**What it does:**
- High-level GUI automation
- Screen capture
- Image recognition
- Keyboard/mouse control
- Cross-platform

**Install:**
```bash
sudo apt install python3-pip
pip3 install pyautogui pillow
```

**Example Python script:**
```python
import pyautogui

# Get screen size
width, height = pyautogui.size()

# Move mouse
pyautogui.moveTo(100, 100, duration=1)

# Click
pyautogui.click()

# Type
pyautogui.write('Hello World', interval=0.1)

# Press keys
pyautogui.hotkey('ctrl', 'c')

# Screenshot
screenshot = pyautogui.screenshot()

# Find image on screen (image recognition!)
button_location = pyautogui.locateOnScreen('button.png')
if button_location:
    pyautogui.click(button_location)
```

**Use cases:**
- Visual automation (find buttons by image)
- Complex multi-step workflows
- Screen capture and analysis
- When xdotool isn't enough

---

#### 6. **DBus** (Already Available ✓)

**What it does:**
- Control desktop applications via inter-process communication
- Launch applications
- Send notifications
- Control media players

**Example commands:**
```bash
# Send notification
gdbus call --session \
  --dest org.freedesktop.Notifications \
  --object-path /org/freedesktop/Notifications \
  --method org.freedesktop.Notifications.Notify \
  "Clawdbot" 0 "" "Hello" "Message from Clawdbot" [] {} 5000

# Open file manager
dbus-send --session \
  --dest=org.freedesktop.FileManager1 \
  --type=method_call /org/freedesktop/FileManager1 \
  org.freedesktop.FileManager1.ShowFolders \
  array:string:"file:///home/desktop" string:""
```

---

#### 7. **xautomation**

**What it does:**
- Image-based automation
- Find images on screen and click them
- Visual scripting

**Install:**
```bash
sudo apt install xautomation
```

**Example:**
```bash
# Find image and click it
xte 'mouseclick 1'

# Capture region
xwd -root | xwdtopnm | pnmtopng > screenshot.png
```

---

### Tier 3: Application-Specific

#### 8. **XFCE4-specific Commands**

Since you're running XFCE4, these work out of the box:

```bash
# Panel management
xfce4-panel --restart

# Desktop settings
xfconf-query -c xfce4-desktop -l

# File manager
thunar /home/desktop/Documents

# Terminal
xfce4-terminal --command="htop"

# Application finder
xfce4-appfinder

# Settings
xfce4-settings-manager
```

---

## 🚀 Quick Setup Script

Save this and run it to install everything:

```bash
#!/bin/bash
# Clawdbot Desktop Control Setup

echo "Installing desktop automation tools..."

# Essential tools
sudo apt update
sudo apt install -y \
  xdotool \
  wmctrl \
  xclip \
  xautomation \
  scrot \
  imagemagick

# Python automation (optional)
echo "Install PyAutoGUI? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
  pip3 install pyautogui pillow pyscreeze
fi

echo "✅ Desktop control tools installed!"
echo ""
echo "Test with:"
echo "  xdotool --version"
echo "  wmctrl -m"
echo "  xclip -version"
```

---

## 🎮 What I Can Do With These Tools

### Level 1: Basic Control (xdotool + wmctrl)

**Launch Applications:**
```bash
# Open Firefox
xdotool key alt+F2 type "firefox" key Return

# Open terminal
xdotool key ctrl+alt+t

# Open file manager
thunar &
```

**Window Management:**
```bash
# List all windows
wmctrl -l

# Focus Obsidian
wmctrl -a "Obsidian"

# Maximize current window
wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz

# Close window
wmctrl -c "Window Title"
```

**Keyboard Automation:**
```bash
# Type in active window
xdotool type "Text to type"

# Press shortcuts
xdotool key ctrl+s  # Save
xdotool key ctrl+w  # Close tab
xdotool key alt+Tab # Switch window

# Complex sequences
xdotool key ctrl+t sleep 0.5 type "ls -la" key Return
```

**Mouse Control:**
```bash
# Get mouse position
xdotool getmouselocation

# Move mouse
xdotool mousemove 500 500

# Click
xdotool click 1  # Left
xdotool click 2  # Middle
xdotool click 3  # Right

# Drag
xdotool mousedown 1 mousemove 600 600 mouseup 1
```

---

### Level 2: Advanced Automation (Python + PyAutoGUI)

**Find and Click Buttons:**
```python
# Find button by image and click it
button = pyautogui.locateOnScreen('save_button.png')
if button:
    pyautogui.click(button)
```

**Form Fill:**
```python
# Fill form automatically
pyautogui.click(username_field)
pyautogui.write('trevor@nomads.com')
pyautogui.press('tab')
pyautogui.write('password123')
pyautogui.press('enter')
```

**Screen Analysis:**
```python
# Take screenshot and analyze
screenshot = pyautogui.screenshot()
# Check for specific color at position
pixel = screenshot.getpixel((100, 100))
```

---

### Level 3: Application Integration (DBus)

**Notifications:**
```bash
# Send desktop notification
notify-send "Clawdbot" "Task completed!" -i info
```

**File Manager:**
```bash
# Open folder in file manager
thunar /home/desktop/Documents &

# Or via DBus
dbus-send --session --dest=org.xfce.Thunar \
  /org/xfce/FileManager \
  org.xfce.FileManager.DisplayFolder \
  string:"/home/desktop/Documents" \
  string:"" string:""
```

---

## 🛠️ Skill Creation Recommendations

### Option 1: Shell Script Skill (Quick & Simple)

Create `/home/desktop/clawd/skills/desktop-control/SKILL.md`:

```markdown
---
name: desktop-control
description: Control Linux desktop - launch apps, manage windows, automate UI
triggers: "open app", "switch to", "click", "type in"
---

# Desktop Control Skill

Control Ubuntu XFCE4 desktop via xdotool, wmctrl, and shell commands.

## Capabilities

- Launch applications
- Switch windows
- Type text
- Click buttons
- Manage windows
- Navigate desktop

## Commands

See desktop-commands.sh for implementation
```

### Option 2: Python Skill (Advanced)

Create a Python script with PyAutoGUI for visual automation.

### Option 3: Node.js Skill (Most Powerful)

Use Robotjs or nut.js for full desktop automation with JavaScript.

---

## 📋 Installation Checklist

**Essential (Install These):**
- [ ] xdotool - `sudo apt install xdotool`
- [ ] wmctrl - `sudo apt install wmctrl`
- [ ] xclip - `sudo apt install xclip`

**Optional (Recommended):**
- [ ] PyAutoGUI - `pip3 install pyautogui`
- [ ] xautomation - `sudo apt install xautomation`
- [ ] scrot (screenshots) - `sudo apt install scrot`

**Already Have:**
- [x] xwininfo
- [x] xprop
- [x] gdbus
- [x] dbus-send

---

## 🎯 Example Use Cases

### "Open Obsidian and navigate to project"
```bash
wmctrl -a "Obsidian" || obsidian &
sleep 2
xdotool key ctrl+o
sleep 0.5
xdotool type "Nomads Bangkok"
xdotool key Return
```

### "Take screenshot of active window"
```bash
active_window=$(xdotool getactivewindow)
scrot -u -o /tmp/screenshot.png
```

### "Switch to Firefox and open new tab"
```bash
wmctrl -a "Firefox"
sleep 0.5
xdotool key ctrl+t
xdotool type "nomads.com"
xdotool key Return
```

### "Minimize all windows"
```bash
wmctrl -k on  # Show desktop
```

### "Arrange windows side-by-side"
```bash
# Left half
wmctrl -r "Firefox" -e 0,0,0,960,1080

# Right half
wmctrl -r "Obsidian" -e 0,960,0,960,1080
```

---

## ⚠️ Important Considerations

### 1. **Display Server Access**

Commands need DISPLAY environment variable:
```bash
export DISPLAY=:0
xdotool type "test"
```

### 2. **User Permissions**

Clawdbot runs as user `desktop`, so it can only control windows owned by that user.

### 3. **Focus Matters**

Many commands require window to be focused:
```bash
wmctrl -a "Window"  # Focus first
sleep 0.5           # Wait for focus
xdotool type "text" # Then type
```

### 4. **Timing is Critical**

Add delays between commands:
```bash
xdotool key ctrl+t
sleep 0.5  # Wait for new tab
xdotool type "url"
```

### 5. **Screen Resolution**

Get screen size first:
```bash
xdpyinfo | grep dimensions
```

---

## 🚀 Next Steps

1. **Install essential tools** (xdotool, wmctrl, xclip)
2. **Test basic commands** manually
3. **Create desktop-control skill** with common operations
4. **Add to Clawdbot** skills directory
5. **Test from Telegram** via Clawdbot commands

---

## 📚 Resources

- xdotool manual: `man xdotool`
- wmctrl manual: `man wmctrl`
- PyAutoGUI docs: https://pyautogui.readthedocs.io/
- XFCE commands: https://docs.xfce.org/

---

**Ready to give Clawdbot desktop superpowers!** 🚀

Let me know when tools are installed and I'll create the skill.
