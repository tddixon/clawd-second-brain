# Life Knowledge Graph

A compounding knowledge graph that evolves automatically as your life changes.

---

## Three-Layer Architecture

### Layer 1: Knowledge Graph (`/life/areas/`)
Entity-based storage with atomic facts + living summaries.

```
/life/areas/
├── people/           # People in your life
├── companies/        # Companies you work with
├── projects/         # Active projects (alongside Second Brain)
├── tasks/            # High-priority tasks (alongside Second Brain)
└── entities/         # Other entities (locations, systems, etc.)
```

Each entity folder contains:
- `summary.md` — Living snapshot, rewritten weekly
- `items.json` — Atomic, timestamped facts

### Layer 2: Daily Notes (`memory/YYYY-MM-DD.md`)
Raw event logs — what happened, when.

### Layer 3: Tacit Knowledge (`MEMORY.md`)
Patterns, preferences, and lessons learned.

---

## How Facts Work

### Atomic Facts (`items.json`)

Every fact is a discrete, timestamped unit:

```json
{
  "id": "entity-001",
  "fact": "Fact description",
  "timestamp": "2026-01-29",
  "status": "active",
  "supersededBy": "fact-002"
}
```

### Superseding, Not Deleting

When reality changes, facts are marked superseded, not erased:

```json
// Old fact
{
  "id": "sarah-001",
  "fact": "Difficult manager",
  "timestamp": "2025-06-15",
  "status": "superseded",
  "supersededBy": "sarah-002"
}

// New fact
{
  "id": "sarah-002",
  "fact": "No longer works together - left company",
  "timestamp": "2026-01-15",
  "status": "active"
}
```

**Nothing is lost.** Full history is preserved. Context stays current.

---

## Automation

### Fact Extraction (Every ~30 minutes)
A sub-agent scans conversations and extracts:
- People mentioned
- Companies worked with
- Projects active
- Key decisions

### Weekly Synthesis (Sunday)
- Rewrites `summary.md` from raw facts
- Prunes stale context
- Marks historical facts as superseded
- Keeps graph lean and accurate

---

## Entity Schema

### Person
- Name, role, relationship
- Work/personal context
- Contact details (if stored)
- Relationship notes

### Company
- Industry, location
- Projects together
- Key contacts
- Status (active/inactive)

### Project
- Start/end dates
- Status (planning/active/blocked/completed)
- Dependencies
- Outcomes
- Tech stack
- Current phase/milestone

### Task
- Priority (high/normal/low)
- Due date
- Status (open/in-progress/done)
- Related project
- Time estimate
- Location in Second Brain (if applicable)

---

## Integration with Second Brain

The knowledge graph **complements** (not replaces) the Obsidian Second Brain:

- **Second Brain:** Day-to-day task management, GTD workflows, daily planning
- **Knowledge Graph:** High-level project tracking, historical context, entity relationships

**Sync points:**
- Tasks created in Second Brain → Facts extracted to knowledge graph
- Project milestones → Updated in both systems
- Weekly synthesis updates both MEMORY.md and relevant Second Brain project files

This creates a **dual memory system**:
- **Tactical (Second Brain):** What to do today, inbox processing, next actions
- **Strategic (Knowledge Graph):** Why we're doing it, how it evolved, entity relationships

---

*Last updated: 2026-01-29*
