## Brainstorm CLI

A simple local-first brainstorming CLI with optional OpenAI support.

### Features
- Local brainstorming loop (no API) with idea expansion and prioritization prompts
- Optional OpenAI model via `OPENAI_API_KEY`
- Saves sessions to `sessions/` as JSON and Markdown

### Quick start
```bash
cd brainstorm
npm i
# optional
export OPENAI_API_KEY=sk-...
# or set in .env
npm start
```

### Usage
```bash
brainstorm                # interactive session
brainstorm -p "idea..."    # start with a prompt
brainstorm --model gpt-4o  # choose OpenAI model
brainstorm --local         # force local-only mode
```

### New CLI subcommands (MVP)
```bash
# list saved sessions
brainstorm list

# open an existing session interactively
brainstorm open --id <sessionId>

# advance a session's stage
brainstorm advance --id <sessionId> --stage <concept|problem_solution_fit|gtm|pitch|investor_package>

# generate an artifact (currently: lean-canvas)
brainstorm generate --id <sessionId> --artifact lean-canvas
```

## Living progress
This is a living README tracking scope and progress as we build from a simple CLI to a staged brainstorming workspace with visualizations and exportable artifacts.

### Goals
- Help move from raw ideas to GTM strategies, pitch, and investor packages
- Keep it local-first, with optional cloud LLMs
- Provide structured artifacts (Lean Canvas, GTM plan, one‑pager, etc.)

### Current status
- [x] Interactive CLI with local and OpenAI agents
- [x] Session save to `sessions/*.json|md`
- [x] Stages scaffold: `concept → …`
- [x] Artifact scaffold: `lean-canvas` generator (MVP)
- [x] CLI subcommands: `list`, `open`, `advance`, `generate`
- [ ] Web UI (Next.js) with visualizations
- [ ] GTM plan generator and export
- [ ] One‑pager export (Markdown/PDF)
- [ ] Pitch deck generator
- [ ] Investor memo

### Notes
- Schema and artifact data are stored in each session file to remain portable.
- When using OpenAI, generation prompts try to emit JSON first; if parsing fails, we store the raw text as an artifact summary.

