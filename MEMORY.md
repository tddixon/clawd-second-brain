# MEMORY.md - Clawd's Long-Term Memory

*Curated memories and learnings. Updated periodically from daily notes.*

---

## About Trevor

- Owner of **Nomads** - hostel chain in Thailand
- Core work: Marketing, Coding, Systems Management
- Struggles with: Task management, project oversight
- Location: Thailand (UTC+7)

## Current Projects (as of 2025-06-25)

### 🔥 Urgent
1. **MEWS Booking Engine Integration** - Custom booking for Nomads Asia Website
2. **SEO & Content Strategy** - Keyword research, blogs, content

### Active
3. **Nomads Asia Website** - Next.js, Convex, Claude Code
4. **RFID Wristband Payment System** - Poster POS + MEWS integration
5. **Nomads Bangkok Opening** - New location
6. **Social Media Marketing** - Ongoing

## Development Workflow Rules

### 🚨 Git Operations - NON-NEGOTIABLE
1. **NEVER push to main branch**
2. **ALWAYS create a branch before starting any development work**
3. **ONLY create pull requests** — let Trevor test and review
4. No direct commits to main under any circumstances

**Example flow:**
```bash
git checkout -b feature/mews-booking-engine
# do development work
git add .
git commit -m "..."
git push origin feature/mews-booking-engine
# Trevor creates PR and reviews
```

---

## Systems & Tools

### 🧠 Life Knowledge Graph (NEW - 2026-01-29)

**Purpose:** Self-maintaining, compounding knowledge graph that evolves automatically as Trevor's life changes.

**Three-Layer Architecture:**

**Layer 1: Knowledge Graph (`/life/areas/`)**
- Entity-based storage (people, companies, projects)
- Atomic facts (`items.json`) — timestamped, discrete units
- Living summaries (`summary.md`) — rewritten weekly
- Superseding, not deleting — full history preserved

**Layer 2: Daily Notes (`memory/YYYY-MM-DD.md`)**
- Raw event logs — what happened, when
- Source for fact extraction

**Layer 3: Tacit Knowledge (`MEMORY.md`)**
- Patterns, preferences, lessons learned
- Curated distillation from other layers

**Automation:**
- **Every ~30 min:** Sub-agent scans conversations → extracts atomic facts
- **Weekly (Sunday):** Synthesize summaries, prune stale context, mark historical facts
- **No manual cleanup needed** — system maintains itself

**Entity Structure:**
```
/life/areas/
├── people/           # People in Trevor's life
│   ├── sarah/
│   │   ├── summary.md     # Living snapshot
│   │   └── items.json    # Atomic facts
│   └── [person-name]/
├── companies/        # Companies worked with
│   ├── nomads/
│   │   ├── summary.md
│   │   └── items.json
│   └── [company-name]/
├── projects/         # Active projects (alongside Second Brain)
│   ├── mews-booking-engine/
│   ├── klaviyo-mews-integration/
│   ├── nomads-bangkok-opening/
│   └── [project-name]/
│       ├── summary.md
│       └── items.json
└── tasks/            # High-priority tasks (alongside Second Brain)
    ├── nomads-bangkok-cashflow-forecast/
    └── [task-name]/
        ├── summary.md
        └── items.json
```

**Fact Schema (items.json):**
```json
{
  "id": "entity-001",
  "fact": "Fact description",
  "timestamp": "2026-01-29",
  "status": "active | superseded",
  "supersededBy": "fact-002"  // If superseded
}
```

**Why This Matters:**
- No stale context — knowledge updates automatically
- Full history preserved — nothing is deleted, only superseded
- Context stays lean — summaries, not hundreds of raw facts
- Compounds over time — every conversation adds signal

**Integration with Second Brain:**
The knowledge graph **complements** the Obsidian Second Brain:

| System | Purpose | Focus |
|--------|---------|-------|
| **Second Brain** | Day-to-day task management | Tactical: What to do today |
| **Knowledge Graph** | High-level tracking + history | Strategic: Why, how it evolved |

**Sync points:**
- Tasks created in Second Brain → Facts extracted to knowledge graph
- Project milestones → Updated in both systems
- Weekly synthesis → Updates MEMORY.md + Second Brain project files

**Result:** Dual memory system — tactical (what to do) + strategic (why we're doing it)

**Location:** `/home/desktop/clawd/life/`
**Documentation:** `/home/desktop/clawd/life/README.md`

---

### 🆕 PRIMARY SYSTEM: Obsidian Second Brain
**Vault Path:** `/home/desktop/obsidian-second-brain`  
**TaskNotes API:** `http://127.0.0.1:8090/api`

**This is now the source of truth for:**
- All tasks (replaces Todoist/ClickUp for Trevor's personal work)
- All projects (GTD project management)
- All notes & knowledge (PKM)
- Daily planning (morning/evening routines)

**System Components:**
- **GTD** - 5-stage workflow (Capture, Clarify, Organize, Reflect, Engage)
- **PARA** - Folder organization (Projects, Areas, Resources, Archives)
- **TaskNotes** - Single source of truth for tasks (HTTP API)
- **Zettelkasten** - Atomic notes with bidirectional linking

**Core Workflows:**
1. **Capture** - "capture this" → Quick entry with auto-detection
2. **Process Inbox** - "process inbox" → GTD clarify + organize
3. **Daily Planning** - "plan my day" → Top 3 selection with scoring
4. **Daily Closeout** - "close out day" → Review + sync + tomorrow prep

**Critical Rules:**
- Tasks must be concrete actions (no "think about", require "Call John at 555-1234")
- Inbox must have <5 items before daily planning
- Health check TaskNotes API before operations
- Use wikilink format: `["[[Project Name]]"]`
- Source tags enable sync-back: `#source/projects/filename`

**Skills Location:** `/home/desktop/obsidian-second-brain/.skills/second-brain/`

### Legacy Systems (Still in Use)
- **Gmail + Google Calendar** - Communication & scheduling
- **Poster POS** - Hostel point of sale
- **MEWS** - Property Management System
- **Convex** - Backend for website

---

## Learnings & Notes

### 2025-06-25 - Day One
- First session, established relationship
- Trevor needs systematic support, not just ad-hoc help
- Built comprehensive PKM system design (see projects/pkm-system/)
- Created API integrations and Clawdbot skills for productivity system

### 2026-01-26 - Complete Setup Day

**Infrastructure:**
- VPS: Hetzner (ubuntu-desktop on Tailscale)
- Remote access: https://ubuntu-desktop/ via Tailscale Serve
- Telegram paired (user ID: 8495717970)

**PKM System Deployed:**
- Obsidian vault: `/home/desktop/obsidian-vault/` (PARA structure)
- Todoist: Connected for task capture
- ClickUp: Connected (Team: 25694066, Space: Personal)
- **Exa AI: ✅ ACTIVE** - Advanced research (9 tools)
- Brave Search: API configured (fallback)
- Skills: 6 custom skills (PKM + Research) + 7 bundled skills

**Ready to use:**
- "process inbox" - route items from all sources
- "plan my day" - generate daily plans
- "add task: X" - smart task creation
- "create project: X" - structured project setup
- "research X" - Exa AI research (preferred) or Brave Search fallback
- "weather in X" - weather lookups

**Search Strategy (3 engines):**
1. **Exa AI (primary)** - High-quality research, company intel, LinkedIn, code (needs API key)
2. **Desearch AI (alternative)** - Privacy-focused, decentralized, fact-checking (no key needed)
3. **Brave Search (fallback)** - Quick lookups, real-time news

### 2026-01-26 - Model Strategy
**Available Models:**
- Opus (anthropic/claude-opus-4-5) - alias: `/opus`
- Sonnet (anthropic/claude-sonnet-4-5) - alias: `/sonnet` (default)
- GLM-4.7 (zai/glm-4.7) - alias: `/glm` (fallback)

**When to Use:**
- **Opus**: Complex coding, architecture, deep technical work, critical integrations
- **Sonnet**: Day-to-day tasks, content writing, general problem-solving (DEFAULT)
- **GLM-4.7**: Research, data gathering, simple edits, cost-saving

**Subagent Strategy:**
- I decide which model each subagent uses based on task complexity
- Heavy tasks → Opus subagents
- Standard tasks → Sonnet subagents  
- Research/simple tasks → GLM subagents

**Main Session Strategy:**
- Default to Sonnet for speed/efficiency
- Switch to Opus when encountering complex problems
- Use GLM for quick research/lookups

### 2026-01-27 - Obsidian Second Brain Training

**Major System Update:**
Trevor introduced the new **Obsidian Second Brain** vault as the primary PKM system.

**What I Learned:**
- Comprehensive GTD-powered PKM system with 4 core workflows
- TaskNotes plugin provides HTTP API for task management
- Skills are embedded in the vault at `.skills/second-brain/`
- System combines GTD + PARA + TaskNotes + Zettelkasten methodologies
- Mobile capture via Todoist sync (15-min intervals) planned
- Clawdbot compatibility with file-based fallback workflows

**Skills Mastered:**
1. **Capture** - Smart task/note detection with natural language date parsing
2. **Process Inbox** - GTD clarification with automatic project creation
3. **Daily Planning** - Algorithmic task scoring with 4-criteria selection
4. **Daily Closeout** - Source tag sync-back to project files

**Technical Details:**
- Vault: `/home/desktop/obsidian-second-brain`
- API: `http://127.0.0.1:8090/api` (requires Obsidian + TaskNotes running)
- Fallback: Direct file writes to `Tasks/` folder when API unavailable
- Source tags: `#source/projects/filename` enable closeout sync-back
- Health check required before all API operations

**Critical Rules I Must Follow:**
- Reject vague actions ("think about" → "Call John at 555-1234")
- Enforce <5 inbox items before daily planning
- Always health check API first
- Use wikilink format for projects: `["[[Project Name]]"]`
- Only create concrete, actionable tasks

**Documentation Created:**
- Detailed learning log: `/home/desktop/clawd/memory/2026-01-27-obsidian-pkm.md`
- Updated TOOLS.md with vault path, API details, and workflows
- This entry in MEMORY.md

**This is now our PRIMARY system** - all task/project/note operations go through these workflows.

### 2026-01-29 - Knowledge Graph System Implementation

**Major System Upgrade:**
Implemented a self-maintaining, compounding knowledge graph that evolves automatically.

**What Was Built:**
- Three-layer memory architecture (Knowledge Graph + Daily Notes + Tacit Knowledge)
- Entity-based storage with atomic facts and living summaries
- Superseding system (facts update, nothing deleted)
- Automated fact extraction (every 30 minutes)
- Weekly synthesis (Sundays 9 AM UTC)

**Entities Created:**
- **People:** sarah (superseded - former manager)
- **Companies:** nomads (hostel chain)
- **Projects:** mews-booking-engine, klaviyo-mews-integration, nomads-bangkok-opening
- **Tasks:** nomads-bangkok-cashflow-forecast

**Automation:**
- Cron job: `life-fact-extraction` (every 30 min)
- Cron job: `life-weekly-synthesis` (Sunday 9 AM)

**Integration:**
Works alongside Obsidian Second Brain:
- Second Brain = Tactical (what to do today)
- Knowledge Graph = Strategic (why, how it evolved)

**Key Learnings:**
- Facts are atomic, timestamped units in `items.json`
- Summaries are weekly-rewritten snapshots in `summary.md`
- Superseding preserves full history while keeping context current
- Dual memory system enables both tactical execution and strategic understanding

**Files Created:**
- `/home/desktop/clawd/life/` - Root directory
- `life/README.md` - System documentation
- `life/.skills/fact-extractor.md` - Extraction template
- `life/.skills/weekly-synthesis.md` - Synthesis template
- Entity folders with `summary.md` + `items.json` for people, companies, projects, tasks

**This system now compounds forever** - every conversation adds signal, every week distills it.

---

*Last updated: 2026-01-29*
