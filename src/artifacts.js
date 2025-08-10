import { randomUUID } from 'node:crypto'

export async function generateArtifact({ type, session, agent }) {
  if (type === 'lean-canvas') {
    return await generateLeanCanvas({ session, agent })
  }
  if (type === 'gtm-plan') {
    return await generateGtmPlan({ session, agent })
  }
  if (type === 'one-pager') {
    return await generateOnePager({ session, agent })
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

export async function generateGtmPlan({ session, agent }) {
  const topic = session.title || (session.messages[0]?.text ?? 'Business idea')
  const prompt = `Create a concise GTM plan for the idea below. Return ONLY JSON:
  {
    "icp": { "persona": string, "companyProfile": string, "painPoints": string[] },
    "positioning": { "statement": string, "keyBenefits": string[] },
    "channels": Array<{ name: string, hypothesis: string, betSize: 'small'|'medium'|'large' }>,
    "pricing": { "model": string, "initialPrice": string, "assumptions": string[] },
    "milestones": Array<{ name: string, targetDate: string }>,
    "metrics": string[],
    "risks": string[]
  }
  Idea/context: ${topic}
  Recent notes:\n${session.messages.slice(-6).map(m => `- (${m.role}) ${m.text}`).join('\n')}`

  let data = null
  let summary = ''
  try {
    const reply = await agent.generate({ prompt, context: session.messages })
    const text = reply?.text ?? ''
    try {
      data = JSON.parse(text)
    } catch {
      summary = text
      data = heuristicGtm(topic)
    }
  } catch (e) {
    summary = `Generation failed, using heuristic: ${e.message}`
    data = heuristicGtm(topic)
  }
  return {
    id: randomUUID(),
    type: 'gtm-plan',
    createdAt: new Date().toISOString(),
    source: agent?.name || 'unknown',
    data,
    summary
  }
}

function heuristicGtm(topic) {
  return {
    icp: {
      persona: 'Founder or PM at early-stage startup',
      companyProfile: 'SaaS or tooling, 2–20 people',
      painPoints: ['Unclear positioning', 'Slow validation', 'Ad hoc planning']
    },
    positioning: {
      statement: `For builders, ${topic} accelerates going from idea to plan with actionable artifacts`,
      keyBenefits: ['Structure', 'Speed', 'Shareable outputs']
    },
    channels: [
      { name: 'Communities', hypothesis: 'Reach ICP where they hang', betSize: 'small' },
      { name: 'Content', hypothesis: 'SEO and templates attract intent', betSize: 'medium' },
      { name: 'Founder-led sales', hypothesis: 'High signal early feedback', betSize: 'small' }
    ],
    pricing: { model: 'Freemium → Pro subscription', initialPrice: '$15–$29/mo', assumptions: ['Activation to paid > 5%'] },
    milestones: [
      { name: 'MVP with Lean Canvas + GTM', targetDate: new Date(Date.now()+1000*60*60*24*21).toISOString() },
      { name: 'Public launch', targetDate: new Date(Date.now()+1000*60*60*24*45).toISOString() }
    ],
    metrics: ['WAU', 'Activation rate', 'Export count/user'],
    risks: ['LLM reliability', 'Narrow TAM if too niche']
  }
}

export async function generateOnePager({ session, agent }) {
  const topic = session.title || (session.messages[0]?.text ?? 'Business idea')
  const prompt = `Draft a crisp one-pager. Return ONLY JSON:
  {
    "problem": string,
    "audience": string,
    "solution": string,
    "whyNow": string,
    "differentiation": string,
    "nextSteps": string[]
  }
  Idea/context: ${topic}`

  let data = null
  let summary = ''
  try {
    const reply = await agent.generate({ prompt, context: session.messages })
    const text = reply?.text ?? ''
    try { data = JSON.parse(text) } catch { summary = text; data = heuristicOnePager(topic) }
  } catch (e) {
    summary = `Generation failed, using heuristic: ${e.message}`
    data = heuristicOnePager(topic)
  }
  return {
    id: randomUUID(),
    type: 'one-pager',
    createdAt: new Date().toISOString(),
    source: agent?.name || 'unknown',
    data,
    summary
  }
}

function heuristicOnePager(topic) {
  return {
    problem: `Turning ${topic} from concept into an executable plan is slow and unstructured`,
    audience: 'Solo founders and small product teams',
    solution: `A guided workspace that produces Lean Canvas, GTM plan, and exportable docs`,
    whyNow: 'LLMs enable fast structured drafting; many new builders entering market',
    differentiation: 'Opinionated workflow + high-quality exports; local-first',
    nextSteps: ['Ship MVP', 'Run 5 founder interviews', 'Launch in communities']
  }
}
