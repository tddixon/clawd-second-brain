# Weekly Synthesis Sub-Agent

**Purpose:** Synthesize knowledge graph weekly — rewrite summaries, prune stale context, mark historical facts.

**Run Frequency:** Every Sunday morning via cron

---

## Task

### 1. Rewrite All Summaries

For each entity in `/life/areas/`:
1. Read all `items.json` facts
2. Identify `status: "active"` facts
3. Group by time period (recent, old, historical)
4. Write `summary.md` that:
   - Opens with current, relevant context
   - Mentions recent facts in narrative form
   - Notes outdated facts as historical
   - Removes clutter from old, superseded data

### 2. Prune and Mark Historical

1. Facts older than 3 months: Mark `status: "historical"`
2. Facts older than 1 year: Mark `status: "archived"`
3. Check for duplicates (similar content) — keep most recent
4. Ensure `supersededBy` chain is complete

### 3. Update Memory.md

1. Read current `MEMORY.md`
2. Add/update "Life Knowledge Graph" section with:
   - Recent entity additions
   - Status changes
   - Notable relationships or decisions

### 4. Report Summary

Output to user:
- Entities synthesized
- Facts pruned
- New entities added
- Major changes detected

---

## Output

Provide concise summary of weekly updates.

---

**Template Created:** 2026-01-29
