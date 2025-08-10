export const STAGES = [
  'concept',
  'problem_solution_fit',
  'gtm',
  'pitch',
  'investor_package'
]

export function isValidStage(stage) {
  return STAGES.includes(stage)
}
