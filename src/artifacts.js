import { randomUUID } from 'node:crypto'

export async function generateArtifact({ type, session, agent }) {
  if (type === 'lean-canvas') {
    return await generateLeanCanvas({ session, agent })
  }
  throw new Error(`Unknown artifact type: ${type}`)
}

export async function generateLeanCanvas({ session, agent }) {
  const topic = session.title || (session.messages[0]?.text ?? 'Business idea')
  const prompt = `Create a Lean Canvas for the idea described below. Return ONLY a JSON object matching this TypeScript type:
  {
    "problem": string[];
    "customerSegments": string[];
    "existingAlternatives": string[];
    "solution": string[];
    "uniqueValueProp": string;
    "unfairAdvantage": string;
    "channels": string[];
    "keyMetrics": string[];
    "costStructure": string[];
    "revenueStreams": string[];
    "topAssumptions": string[];
  }
  Idea/context: ${topic}
  Recent notes:
  ${session.messages.slice(-6).map(m => `- (${m.role}) ${m.text}`).join('\n')}`

  let data = null
  let summary = ''

  try {
    const reply = await agent.generate({ prompt, context: session.messages })
    const text = reply?.text ?? ''
    try {
      data = JSON.parse(text)
    } catch {
      summary = text
      data = heuristicLeanCanvas(topic)
    }
  } catch (e) {
    summary = `Generation failed, using heuristic: ${e.message}`
    data = heuristicLeanCanvas(topic)
  }

  return {
    id: randomUUID(),
    type: 'lean-canvas',
    createdAt: new Date().toISOString(),
    source: agent?.name || 'unknown',
    data,
    summary
  }
}

function heuristicLeanCanvas(topic) {
  return {
    problem: [
      `Time-consuming workflows around ${topic}`,
      `High uncertainty about market and ICP for ${topic}`
    ],
    customerSegments: [
      'Early adopters',
      'SMB teams',
      'Indie makers'
    ],
    existingAlternatives: [
      'Generic tools',
      'Manual processes',
      'Spreadsheets'
    ],
    solution: [
      `A focused solution targeting core jobs related to ${topic}`
    ],
    uniqueValueProp: `Faster path to clarity for ${topic} with actionable outputs`,
    unfairAdvantage: 'Opinionated workflow and fast iteration',
    channels: ['Communities', 'Content', 'Founder-led sales'],
    keyMetrics: ['Activation', 'Weekly active users', 'Retention D30'],
    costStructure: ['Hosting', 'LLM usage', 'Founder time'],
    revenueStreams: ['Subscriptions', 'Consulting add-ons'],
    topAssumptions: ['ICP willingness to pay', 'Channel ROI']
  }
}
