# TOKEN OPTIMIZATION STRATEGY

**Goal:** Minimize API costs while maintaining high quality across all tasks.

---

## Cost Hierarchy (Cheapest to Most Expensive)

1. **Free/Work Claude Code** - $0 (work account)
2. **Gemini CLI** - $0 (OAuth authenticated, free tier)
3. **OpenRouter Free Models** - $0 (if we set it up)
4. **Claude Sonnet 4.5** - $$$ (current main model)
5. **Claude Opus 4.5** - $$$$ (premium, rare use)

---

## Routing Rules

### Heavy Coding Tasks → Claude Code Wingman
**When:** Multi-file changes, refactoring, feature development, bug fixes, complex code generation

**Why:** Uses work's free Claude Code API (auto-mode picks Opus vs Sonnet automatically)

**How:**
```bash
~/code/claude-code-wingman/claude-wingman.sh \
  --session <project-name> \
  --workdir <directory> \
  --prompt "<detailed task>"
```

**Examples:**
- "Refactor the auth system"
- "Add pagination to the API"
- "Fix the database connection pooling issue"
- "Build a new dashboard component"

**Don't use for:** Quick file edits, single-line changes, reading code

---

### Research & Web Queries → Gemini CLI
**When:** Web searches, fact-checking, calculations, general knowledge, summaries

**Why:** Free (OAuth tier), very fast, good quality for factual queries

**How:**
```bash
gemini "query here"
```

**Examples:**
- "What's the latest Next.js version?"
- "Summarize this article: [URL]"
- "Calculate ROI for this marketing campaign"
- "How does PostgreSQL handle concurrent writes?"

**Don't use for:** Tasks requiring deep reasoning, code generation, or multi-step planning

---

### External Research Tasks → Sub-Agents with Cheap Models
**When:** Company research, price comparisons, competitive analysis, multi-source data gathering

**Why:** Offloads heavy token usage from main session, uses cheaper models when appropriate

**How:**
```
sessions_spawn with task description
- Uses web_search (built-in, free)
- Uses Gemini CLI for processing
- Main session only sees final summary
```

**Examples:**
- "Research top 10 suppliers for X"
- "Compare pricing for these 5 SaaS tools"
- "Find contact info for hostel vendors in Thailand"
- "Analyze competitor SEO strategy"

---

### Main Session (Claude Sonnet) → Conversations & Planning
**When:** Strategic thinking, complex decision-making, multi-domain problems, conversation

**Why:** Best quality for nuanced thinking, but expensive

**Keep for:**
- Planning and strategy discussions
- Complex decision-making
- Marketing copy and messaging
- Anything requiring deep context from conversation
- Quick answers that don't need external data

**Avoid using for:**
- Heavy coding (use Claude Code)
- Research (use Gemini or sub-agents)
- Repetitive tasks (automate with scripts)

---

### Claude Opus (Rare) → Only When Necessary
**When:** Extremely complex problems that Sonnet struggles with

**How:** Manual model override if needed

**Examples:**
- Novel architectural decisions
- Complex debugging that stumped Sonnet
- High-stakes copywriting (rare)

**Default:** Trust Claude Code auto-mode to pick Opus when appropriate for coding tasks

---

## Practical Workflow Examples

### Example 1: "Build a new feature for the booking system"
1. **Discuss approach** with me (Sonnet) - 500 tokens
2. **Spawn Claude Code** via wingman - $0 (work API)
3. **Monitor progress** - occasional tmux captures - 100 tokens
4. **Review & iterate** with me - 500 tokens

**Total:** ~1,100 tokens vs 10,000+ if I did all the coding

---

### Example 2: "Research competitors and write landing page copy"
1. **Spawn research sub-agent** - uses Gemini + web_search - 2,000 tokens
2. **Review research** with me - 500 tokens
3. **Write copy** with me (Sonnet) - 2,000 tokens

**Total:** ~4,500 tokens vs 15,000+ if I did all research in main session

---

### Example 3: "Quick question about React hooks"
1. **Ask Gemini** directly: `gemini "explain useEffect vs useLayoutEffect"` - $0
2. **Discuss application** with me if needed - 300 tokens

**Total:** ~300 tokens vs 1,000+ for Sonnet research

---

## How to Request Optimized Routing

**You don't need to specify!** I'll automatically route based on these rules.

But if you want to be explicit:
- "Use Claude Code for this" → Forces wingman
- "Quick Gemini check" → Forces Gemini CLI
- "Research this" → Implies sub-agent

---

## Monthly Cost Estimates

**Before optimization:**
- All tasks through Sonnet: ~$100-200/month

**After optimization:**
- Claude Code (work API): $0
- Gemini CLI: $0
- Sub-agents: ~$10-20/month
- Main conversations: ~$30-50/month

**Total: ~$40-70/month** (60-70% savings)

---

## Monitor Usage

Check token usage anytime:
```
/status
```

Or ask me: "How many tokens have we used today?"

---

## Update This Strategy

As you learn what works, update this file. Over time, we'll refine the routing rules based on actual usage patterns.
