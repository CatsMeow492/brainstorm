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

const program = new Command()

program
  .name('brainstorm')
  .description('Interactive brainstorming CLI (local-first, OpenAI optional)')
  .option('-p, --prompt <text>', 'Initial prompt to start with')
  .option('-m, --model <name>', 'OpenAI model name (e.g., gpt-4o-mini)')
  .option('--local', 'Force local agent even if OPENAI_API_KEY is set')
  .parse(process.argv)

const options = program.opts()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const store = new SessionStore(projectRoot)

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

async function main() {
  const agent = chooseAgent()
  const session = createEmptySession({ title: options.prompt || 'Brainstorm Session' })

  if (options.prompt) {
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

    session.messages.push({ role: 'user', text: trimmed })
    const reply = await agent.generate({ prompt: trimmed, context: session.messages })
    session.messages.push(reply)

    console.log('\n' + chalk.cyan(reply.text) + '\n')
  }
}

main().catch(err => {
  console.error(chalk.red('Error:'), err)
  process.exit(1)
})
