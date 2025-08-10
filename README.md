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
