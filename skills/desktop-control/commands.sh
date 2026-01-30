#!/bin/bash
# Desktop Control Commands Library
# Common operations for Clawdbot desktop automation

# Set display environment
export DISPLAY=:0
export XAUTHORITY=/home/desktop/.Xauthority

# ============================================
# APPLICATION LAUNCHING
# ============================================

launch_firefox() {
    wmctrl -a "Firefox" || firefox &
}

launch_obsidian() {
    wmctrl -a "Obsidian" || obsidian &
}

launch_terminal() {
    xfce4-terminal &
}

launch_file_manager() {
    local path="${1:-$HOME}"
    thunar "$path" &
}

# Generic launcher
launch_app() {
    local app_name="$1"
    local app_command="$2"
    
    if ! wmctrl -a "$app_name"; then
        $app_command &
        sleep 2
    fi
}

# ============================================
# WINDOW MANAGEMENT
# ============================================

list_windows() {
    wmctrl -l
}

focus_window() {
    local title="$1"
    wmctrl -a "$title"
}

close_window() {
    local title="$1"
    wmctrl -c "$title"
}

maximize_window() {
    wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz
}

minimize_window() {
    wmctrl -r :ACTIVE: -b add,hidden
}

show_desktop() {
    wmctrl -k on
}

# Arrange windows side-by-side
arrange_split() {
    local left_window="$1"
    local right_window="$2"
    
    # Left half
    wmctrl -r "$left_window" -e 0,0,0,960,1080
    
    # Right half
    wmctrl -r "$right_window" -e 0,960,0,960,1080
}

# ============================================
# KEYBOARD & TYPING
# ============================================

type_text() {
    xdotool type "$1"
}

type_slow() {
    xdotool type --delay 100 "$1"
}

press_key() {
    xdotool key "$1"
}

press_enter() {
    xdotool key Return
}

press_tab() {
    xdotool key Tab
}

press_escape() {
    xdotool key Escape
}

# Common shortcuts
save_file() {
    xdotool key ctrl+s
}

copy_text() {
    xdotool key ctrl+c
}

paste_text() {
    xdotool key ctrl+v
}

new_tab() {
    xdotool key ctrl+t
}

close_tab() {
    xdotool key ctrl+w
}

switch_window() {
    xdotool key alt+Tab
}

# ============================================
# MOUSE CONTROL
# ============================================

get_mouse_position() {
    xdotool getmouselocation
}

move_mouse() {
    local x="$1"
    local y="$2"
    xdotool mousemove "$x" "$y"
}

click_mouse() {
    local button="${1:-1}"  # Default: left click
    xdotool click "$button"
}

click_at() {
    local x="$1"
    local y="$2"
    xdotool mousemove "$x" "$y"
    xdotool click 1
}

double_click() {
    xdotool click --repeat 2 1
}

right_click() {
    xdotool click 3
}

# ============================================
# CLIPBOARD
# ============================================

copy_to_clipboard() {
    echo "$1" | xclip -selection clipboard
}

paste_from_clipboard() {
    xclip -selection clipboard -o
}

copy_file_to_clipboard() {
    cat "$1" | xclip -selection clipboard
}

# ============================================
# SCREENSHOTS
# ============================================

screenshot_full() {
    local filename="${1:-/tmp/screenshot-$(date +%Y%m%d-%H%M%S).png}"
    scrot "$filename"
    echo "$filename"
}

screenshot_window() {
    local filename="${1:-/tmp/window-$(date +%Y%m%d-%H%M%S).png}"
    scrot -u "$filename"
    echo "$filename"
}

screenshot_region() {
    local filename="${1:-/tmp/region-$(date +%Y%m%d-%H%M%S).png}"
    scrot -s "$filename"
    echo "$filename"
}

# ============================================
# WINDOW INFORMATION
# ============================================

get_active_window_name() {
    xdotool getactivewindow getwindowname
}

get_active_window_id() {
    xdotool getactivewindow
}

find_window() {
    local name="$1"
    xdotool search --name "$name"
}

# ============================================
# COMPLEX WORKFLOWS
# ============================================

open_and_navigate_browser() {
    local url="$1"
    
    # Open or focus Firefox
    launch_firefox
    sleep 1
    
    # New tab
    new_tab
    sleep 0.5
    
    # Type URL and go
    type_text "$url"
    press_enter
}

open_file_in_obsidian() {
    local filename="$1"
    
    # Focus Obsidian
    launch_obsidian
    sleep 1
    
    # Open quick switcher
    xdotool key ctrl+o
    sleep 0.5
    
    # Type filename
    type_text "$filename"
    press_enter
}

search_and_replace() {
    local search_text="$1"
    local replace_text="$2"
    
    # Find
    xdotool key ctrl+h
    sleep 0.5
    
    # Type search
    type_text "$search_text"
    xdotool key Tab
    
    # Type replace
    type_text "$replace_text"
    xdotool key Tab
    
    # Replace all
    xdotool key alt+a
}

# ============================================
# UTILITY FUNCTIONS
# ============================================

wait_for_window() {
    local window_name="$1"
    local timeout="${2:-10}"
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        if wmctrl -l | grep -q "$window_name"; then
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done
    
    return 1
}

is_window_open() {
    local window_name="$1"
    wmctrl -l | grep -q "$window_name"
}

# ============================================
# MAIN COMMAND DISPATCHER
# ============================================

main() {
    local command="$1"
    shift
    
    case "$command" in
        # Apps
        firefox) launch_firefox ;;
        obsidian) launch_obsidian ;;
        terminal) launch_terminal ;;
        thunar|files) launch_file_manager "$@" ;;
        
        # Windows
        list) list_windows ;;
        focus) focus_window "$@" ;;
        close) close_window "$@" ;;
        maximize) maximize_window ;;
        minimize) minimize_window ;;
        desktop) show_desktop ;;
        split) arrange_split "$@" ;;
        
        # Keyboard
        type) type_text "$@" ;;
        press) press_key "$@" ;;
        enter) press_enter ;;
        tab) press_tab ;;
        escape) press_escape ;;
        save) save_file ;;
        copy) copy_text ;;
        paste) paste_text ;;
        
        # Mouse
        mouse) get_mouse_position ;;
        move) move_mouse "$@" ;;
        click) click_at "$@" ;;
        
        # Clipboard
        clip) copy_to_clipboard "$@" ;;
        
        # Screenshots
        screenshot) screenshot_full "$@" ;;
        screenshot-window) screenshot_window "$@" ;;
        screenshot-region) screenshot_region "$@" ;;
        
        # Info
        active) get_active_window_name ;;
        find) find_window "$@" ;;
        
        # Workflows
        browse) open_and_navigate_browser "$@" ;;
        open-note) open_file_in_obsidian "$@" ;;
        
        *)
            echo "Unknown command: $command"
            echo "Available commands:"
            echo "  Apps: firefox, obsidian, terminal, thunar"
            echo "  Windows: list, focus, close, maximize, minimize, desktop, split"
            echo "  Keyboard: type, press, enter, tab, escape, save, copy, paste"
            echo "  Mouse: mouse, move, click"
            echo "  Clipboard: clip"
            echo "  Screenshots: screenshot, screenshot-window, screenshot-region"
            echo "  Info: active, find"
            echo "  Workflows: browse, open-note"
            return 1
            ;;
    esac
}

# Run main if script is executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
