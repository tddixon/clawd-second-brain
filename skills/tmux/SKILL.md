---
name: tmux
description: Optimize tmux for mobile usage. Enable mouse support, touch navigation, simplified keyboard shortcuts, and mobile-friendly configuration.

---

# Tmux Skill - Mobile Optimization

Tmux optimization for mobile involves making it responsive to smaller screens, enabling mouse/touch navigation instead of complex keyboard combinations.

## Quick Setup

### Enable Mouse Support

```bash
# Add to ~/.tmux.conf
set-option -g mouse on
```

This enables:
- Touch-based pane resizing
- Window switching with tap
- Scrolling without keyboard
- Text selection

### Change the Prefix Key

The default `Ctrl+b` is difficult to type on a mobile keyboard. Change to a single key:

```bash
# Add to ~/.tmux.conf
set-option -g prefix C-a
```

Or for screen similarity:
```bash
set-option -g prefix Ctrl-a
```

### Optimize Split Pane Navigation

Using arrow keys on a mobile screen is slow. Use Vim-style keys to move between panes instantly:

```bash
# ~/.tmux.conf
bind h select-pane -L
bind j select-pane -D
bind k select-pane -U
bind l select-pane -R
```

**Alternative (no prefix):**
```bash
bind M-h select-pane -L
bind M-j select-pane -D
bind M-k select-pane -U
bind M-l select-pane -R
```

### Move Status Bar to Top

Keep it visible, as it can get hidden by mobile keyboards:

```bash
# ~/.tmux.conf
set -g status-position top
```

### Simple Status Bar

Remove unnecessary information to save screen space:

```bash
# ~/.tmux.conf
set -g status-left ""      # Hide hostname
set -g status-right ""     # Hide session name
set -g status-justify centre # Center align
```

### Auto-Renumber Windows

Keep window numbers sequential (easier on mobile):

```bash
# ~/.tmux.conf
set -g renumber-windows on
```

## Essential Mobile Plugins

**TPM** — Tmux Plugin Manager:
```bash
# Install TPM
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

# Install resurrect plugin (auto-save sessions)
~/.tmux/plugins/bin/install-plugins resurrect
```

## Mobile-Friendly Tools

### Android (Termux)

Edit `~/.termux/termux.properties` to add extra keys:

```properties
extra-keys=Ctrl,Esc
extra-keys=Alt,Enter
```

### iOS (Blink Shell)

Native touch support and large touch targets for TUI.

### Termux Properties

On Android, add extra keys for mobile keyboard:

```bash
echo 'extra-keys=Ctrl,Esc' >> ~/.termux/termux.properties
echo 'extra-keys=Alt,Enter' >> ~/.termux/termux.properties
```

### Muxile

Tool to view/control a tmux session via a web browser on your phone:
- https://github.com/muxile/muxile

## Summary Configuration

Create `~/.tmux.conf` with:

```conf
# Mouse support
set-option -g mouse on

# Prefix key (easier for mobile)
set-option -g prefix C-a

# Pane navigation (Vim-style)
bind h select-pane -L
bind j select-pane -D
bind k select-pane -U
bind l select-pane -R

# Status bar (top, simplified)
set -g status-position top
set -g status-left ""
set -g status-right ""
set -g status-justify centre

# Auto-renumber windows
set -g renumber-windows on

# Plugins
set -g @plugin 'tmux-plugins/tpm'
```

## Quick Commands

```bash
# Reload config after changes
tmux source-file ~/.tmux.conf

# List all sessions
tmux ls-sessions

# Kill all sessions
tmux kill-server
```

## References

- [TPM Plugin Manager](https://github.com/tmux-plugins/tpm)
- [Termux](https://wiki.termux.com/wiki/tmux)
- [Muxile](https://github.com/muxile/muxile)
