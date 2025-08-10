import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

export class SessionStore {
  constructor(rootDir) {
    this.rootDir = rootDir
    this.sessionsDir = path.join(rootDir, 'sessions')
  }

  async save(session) {
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
    for (const msg of session.messages) {
      const speaker = msg.role === 'assistant' ? 'Assistant' : 'You'
      lines.push(`## ${speaker}`)
      lines.push('')
      lines.push(msg.text)
      lines.push('')
    }
    return lines.join('\n')
  }
}

export function createEmptySession({ title }) {
  return {
    id: randomUUID(),
    title: title ?? 'Untitled',
    createdAt: new Date().toISOString(),
    messages: []
  }
}
