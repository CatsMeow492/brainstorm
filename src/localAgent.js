import { randomUUID } from 'node:crypto'

export class LocalAgent {
  constructor(options = {}) {
    this.id = options.id ?? randomUUID()
    this.name = options.name ?? 'Local Brainstormer'
  }

  async generate({ prompt, context = [] }) {
    const seedIdeas = [
      'List assumptions and unknowns; plan quick validations.',
      'Generate 3-5 user stories; identify core job-to-be-done.',
      'Map solution variants from scrappy to polished; compare trade-offs.',
      'Enumerate risks (technical, market, execution) and mitigations.',
      'Draft a one-pager: problem, audience, value, differentiation, next steps.'
    ]

    const fromContext = context.slice(-3).map((c, i) => `- Related note ${i + 1}: ${c.text}`)

    return {
      id: randomUUID(),
      role: 'assistant',
      text: [
        `Brainstorming on: ${prompt}`,
        '',
        'Consider:',
        ...seedIdeas.map(s => `- ${s}`),
        ...(fromContext.length ? ['','Context: ', ...fromContext] : []),
        '',
        'Next: choose one path and ask me to expand or prioritize.'
      ].join('\n')
    }
  }
}
