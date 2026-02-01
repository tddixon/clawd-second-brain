# HEARTBEAT.md - Checkpoint Loop

## CHECKPOINT LOOP (every 30 min or on trigger)

1. **Context getting full?** → Flush summary to memory/YYYY-MM-DD.md
2. **Learned something permanent?** → Write to MEMORY.md
3. **New capability or workflow?** → Save to skills/
4. **Before restart?** → Dump anything important

## TRIGGERS (don't just wait for timer)

- After major learning = write immediately
- After completing task = checkpoint
- Context getting full = forced flush

## Compound Engineering (Automated)

- **Hourly (every hour)**: Brief snapshot appended to memory/YYYY-MM-DD.md
- **Nightly (10:30 PM)**: Full review of day's sessions, extract learnings, update MEMORY.md
- **Weekly (Sunday 9 AM)**: Knowledge graph synthesis, prune stale context

The compound effect: Every day I get smarter from yesterday's work.

## Remember

Context dies on restart. Memory files don't.
