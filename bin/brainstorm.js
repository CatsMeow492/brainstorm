#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LocalAgent } from '../src/localAgent.js'
import { OpenAIAgent } from '../src/openaiAgent.js'
import { SessionStore, createEmptySession } from '../src/session.js'
import { STAGES, isValidStage } from '../src/stages.js'
import { generateArtifact } from '../src/artifacts.js'

const program = new Command()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const store = new SessionStore(projectRoot)

function getOptions() {
  return program.opts()
}

program
  .name('brainstorm')
  .description('Interactive brainstorming CLI (local-first, OpenAI optional)')
  .option('-p, --prompt <text>', 'Initial prompt to start with')
  .option('-m, --model <name>', 'OpenAI model name (e.g., gpt-4o-mini)')
  .option('--local', 'Force local agent even if OPENAI_API_KEY is set')

program
  .command('new')
  .description('Create a new session (non-interactive)')
  .option('-p, --prompt <text>', 'Initial prompt')
  .action(async (cmdOpts) => {
    const agent = chooseAgent()
    const promptText = cmdOpts.prompt || getOptions().prompt
    const session = createEmptySession({ title: promptText || 'Brainstorm Session' })
    if (promptText) {
      session.messages.push({ role: 'user', text: promptText })
      const reply = await agent.generate({ prompt: promptText, context: session.messages })
      session.messages.push(reply)
    }
    await store.save(session)
    console.log(chalk.green(`Created session: ${session.id}`))
    console.log(chalk.gray(`Saved to sessions/${session.id}.{json,md}`))
    process.exit(0)
  })

program
  .command('list')
  .description('List saved sessions')
  .action(async () => {
    const list = await store.list()
    if (!list.length) {
      console.log(chalk.gray('No sessions found.'))
      process.exit(0)
    }
    for (const s of list) {
      console.log(`${chalk.bold(s.id)}  ${chalk.cyan(s.title)}  [${s.stage || 'concept'}]  ${new Date(s.createdAt).toLocaleString()}`)
    }
    process.exit(0)
  })

program
  .command('open')
  .description('Open an existing session interactively')
  .requiredOption('--id <sessionId>', 'Session id')
  .action(async (cmdOpts) => {
    const agent = chooseAgent()
    const session = await store.load(cmdOpts.id)
    const opts = getOptions()
    await interactiveLoop({ agent, session, initialPrompt: opts.prompt })
  })

program
  .command('advance')
  .description('Advance a session to a new stage')
  .requiredOption('--id <sessionId>', 'Session id')
  .requiredOption('--stage <stage>', `Target stage: one of ${STAGES.join(', ')}`)
  .action(async (cmdOpts) => {
    const session = await store.load(cmdOpts.id)
    if (!isValidStage(cmdOpts.stage)) {
      console.error(chalk.red(`Invalid stage: ${cmdOpts.stage}`))
      process.exit(1)
    }
    session.stage = cmdOpts.stage
    await store.save(session)
    console.log(chalk.green(`Session ${session.id} advanced to stage: ${session.stage}`))
    process.exit(0)
  })

program
  .command('generate')
  .description('Generate an artifact for a session')
  .requiredOption('--id <sessionId>', 'Session id')
  .requiredOption('--artifact <type>', 'Artifact type (e.g., lean-canvas)')
  .action(async (cmdOpts) => {
    const agent = chooseAgent()
    const session = await store.load(cmdOpts.id)
    const artifact = await generateArtifact({ type: cmdOpts.artifact, session, agent })
    session.artifacts = session.artifacts || []
    session.artifacts.push(artifact)
    await store.save(session)
    console.log(chalk.green(`Generated artifact: ${artifact.type} (${artifact.id})`))
    console.log(chalk.gray(`Saved to sessions/${session.id}.{json,md}`))
    process.exit(0)
  })

program.parse(process.argv)

function chooseAgent() {
  const forceLocal = !!options.local
  const hasKey = !!process.env.OPENAI_API_KEY
  if (!forceLocal && hasKey) {
    try {
      return new OpenAIAgent({ model: options.model })
    } catch (e) {
      console.error(chalk.yellow('Falling back to local agent:'), e.message)
      return new LocalAgent()
    }
  }
  return new LocalAgent()
}

async function interactiveLoop({ agent, session }) {
  if (session.messages.length === 0 && options.prompt) {
    session.messages.push({ role: 'user', text: options.prompt })
    const reply = await agent.generate({ prompt: options.prompt, context: session.messages })
    session.messages.push(reply)
    console.log('\n' + chalk.cyan(reply.text) + '\n')
  }

  while (true) {
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: chalk.green('You'),
      }
    ])

    const trimmed = (input || '').trim()
    if (trimmed === '') continue

    if (['/exit', '/quit'].includes(trimmed)) {
      await store.save(session)
      console.log(chalk.gray(`Saved to sessions/${session.id}.{json,md}`))
      break
    }

    if (trimmed === '/save') {
      await store.save(session)
      console.log(chalk.gray(`Saved to sessions/${session.id}.{json,md}`))
      continue
    }

    if (trimmed.startsWith('/advance ')) {
      const target = trimmed.split(' ')[1]
      if (!isValidStage(target)) {
        console.log(chalk.red(`Invalid stage. Valid: ${STAGES.join(', ')}`))
        continue
      }
      session.stage = target
      await store.save(session)
      console.log(chalk.green(`Advanced stage to: ${session.stage}`))
      continue
    }

    if (trimmed.startsWith('/generate ')) {
      const type = trimmed.split(' ')[1]
      try {
        const artifact = await generateArtifact({ type, session, agent })
        session.artifacts.push(artifact)
        await store.save(session)
        console.log(chalk.green(`Generated artifact: ${artifact.type}`))
      } catch (e) {
        console.log(chalk.red(`Failed to generate artifact: ${e.message}`))
      }
      continue
    }

    session.messages.push({ role: 'user', text: trimmed })
    const reply = await agent.generate({ prompt: trimmed, context: session.messages })
    session.messages.push(reply)

    console.log('\n' + chalk.cyan(reply.text) + '\n')
  }
}

async function main() {
  // If a subcommand was used, actions above already executed and exited.
  // Fallback: start a new interactive session.
  const agent = chooseAgent()
  const session = createEmptySession({ title: options.prompt || 'Brainstorm Session' })
  await interactiveLoop({ agent, session })
}

main().catch(err => {
  console.error(chalk.red('Error:'), err)
  process.exit(1)
})
