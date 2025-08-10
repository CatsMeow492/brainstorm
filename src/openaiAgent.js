import { randomUUID } from 'node:crypto'
import OpenAI from 'openai'

export class OpenAIAgent {
  constructor(options = {}) {
    this.id = options.id ?? randomUUID()
    this.name = options.name ?? 'OpenAI Brainstormer'
    const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set')
    }
    this.client = new OpenAI({ apiKey })
    this.model = options.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  }

  async generate({ prompt, context = [] }) {
    const system = [
      'You are a pragmatic product/engineering brainstorming partner.',
      'Favor concrete next steps, trade-off analysis, and lean experiments.',
      'Prefer bullet points, crisp writing, and numbered lists.'
    ].join(' ')

    const messages = [
      { role: 'system', content: system },
      ...context.map(c => ({ role: c.role ?? 'user', content: c.text })),
      { role: 'user', content: prompt }
    ]

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.7,
    })

    const text = response.choices?.[0]?.message?.content?.trim() ?? ''

    return { id: randomUUID(), role: 'assistant', text }
  }
}
