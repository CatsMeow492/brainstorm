import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

export class SessionStore {
  constructor(rootDir) {
    this.rootDir = rootDir
    this.sessionsDir = path.join(rootDir, 'sessions')
  }

  async save(session) {
    await this.#ensureDir()
    const fileBase = path.join(this.sessionsDir, `${session.id}`)
    const json = JSON.stringify(session, null, 2)
    const md = this.toMarkdown(session)
    await fs.writeFile(`${fileBase}.json`, json, 'utf8')
    await fs.writeFile(`${fileBase}.md`, md, 'utf8')
  }

  toMarkdown(session) {
    const lines = []
    lines.push(`# Brainstorm: ${session.title || session.id}`)
    lines.push('')
    lines.push(`Stage: ${session.stage || 'concept'}`)
    lines.push('')
    for (const msg of session.messages) {
      const speaker = msg.role === 'assistant' ? 'Assistant' : 'You'
      lines.push(`## ${speaker}`)
      lines.push('')
      lines.push(msg.text)
      lines.push('')
    }

    if (Array.isArray(session.artifacts) && session.artifacts.length) {
      lines.push('---')
      lines.push('')
      lines.push('## Artifacts')
      lines.push('')
      for (const art of session.artifacts) {
        lines.push(`### ${art.type} (${new Date(art.createdAt).toLocaleString()})`)
        if (art.summary) {
          lines.push('')
          lines.push(art.summary)
          lines.push('')
        }
        if (art.data) {
          lines.push('')
          lines.push('```json')
          lines.push(JSON.stringify(art.data, null, 2))
          lines.push('```')
          lines.push('')
        }
      }
    }
    return lines.join('\n')
  }

  async load(id) {
    const file = path.join(this.sessionsDir, `${id}.json`)
    const content = await fs.readFile(file, 'utf8')
    const session = JSON.parse(content)
    return session
  }

  async list() {
    await this.#ensureDir()
    const files = await fs.readdir(this.sessionsDir)
    const sessions = []
    for (const f of files) {
      if (!f.endsWith('.json')) continue
      try {
        const content = await fs.readFile(path.join(this.sessionsDir, f), 'utf8')
        const s = JSON.parse(content)
        sessions.push({ id: s.id, title: s.title, stage: s.stage, createdAt: s.createdAt })
      } catch {}
    }
    // sort newest first
    sessions.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    return sessions
  }

  async #ensureDir() {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true })
    } catch {}
  }
}

export function createEmptySession({ title }) {
  return {
    id: randomUUID(),
    title: title ?? 'Untitled',
    createdAt: new Date().toISOString(),
    stage: 'concept',
    messages: [],
    ideas: [],
    artifacts: [],
    experiments: [],
    competitors: [],
    scoring: null
  }
}
