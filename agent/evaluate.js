const { getState, MIN_PROFIT_THRESHOLD, MIN_REPUTATION } = require('../state/agentState')

const PRICING = { short: 2, medium: 5, long: 10 }
const COMPLEXITY = { short: 1, medium: 2, long: 3 }

async function evaluateJob(job) {
  const state = getState()

  if (state.reputation < MIN_REPUTATION) {
    return { decision: 'reject', reason: 'Agent reputation too low', price: 0 }
  }

  const price = PRICING[job.inputLength]

  if (!price || price < MIN_PROFIT_THRESHOLD) {
    return { decision: 'reject', reason: 'Job value below threshold', price: 0 }
  }

  return {
    decision: 'accept',
    price,
    estimatedTime: COMPLEXITY[job.inputLength] * 15 + ' seconds',
    confidence: 90,
    reason: 'Job accepted'
  }
}

module.exports = { evaluateJob }
