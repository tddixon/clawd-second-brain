# Fact Extraction Sub-Agent

**Purpose:** Extract atomic facts from conversation history and store in knowledge graph.

**Run Frequency:** Every ~30 minutes via cron

---

## Task

1. Read recent conversation history (last 30 minutes)
2. Extract facts about:
   - **People:** Names mentioned, relationships, interactions
   - **Companies:** Work updates, projects, status changes
   - **Projects:** Progress, blockers, outcomes, milestones
   - **Tasks:** New tasks created, status changes, completions, priorities
   - **Decisions:** Choices made with rationale

3. For each fact:
   - Check if entity exists in `/life/areas/`
   - Create entity folder if needed
   - Add fact to `items.json` with proper ID, timestamp
   - Mark previous related facts as superseded if this contradicts

4. Generate IDs using pattern: `{entity-name}-{number}`

---

## Output

No output to user. This is a background maintenance task.

---

**Template Created:** 2026-01-29
