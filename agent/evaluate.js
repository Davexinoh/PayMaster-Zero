const Groq = require('groq-sdk')
const { getState, MIN_PROFIT_THRESHOLD, MIN_REPUTATION } = require('../state/agentState')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const PRICING = {
  short: 2,
  medium: 5,
  long: 10
}

const COMPLEXITY = {
  short: 1,
  medium: 2,
  long: 3
}

async function evaluateJob(job) {
  const state = getState()

  if (state.reputation < MIN_REPUTATION) {
    return {
      decision: 'reject',
      reason: 'Agent reputation too low to accept new work',
      price: 0
    }
  }

  const price = PRICING[job.inputLength]

  if (price < MIN_PROFIT_THRESHOLD) {
    return {
      decision: 'reject',
      reason: 'Job value below profit threshold',
      price: 0
    }
  }

  const prompt = `You are PayMaster Zero, an autonomous commercial agent evaluating a job request.

Job type: ${job.taskType}
Description: ${job.description}
Complexity: ${job.inputLength}

Evaluate if this job is within your capability. Respond in JSON only:
{
  "capable": true or false,
  "confidence": 0-100,
  "reason": "one sentence"
}`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3
  })

  let assessment
  try {
    const text = response.choices[0].message.content
    const clean = text.replace(/```json|```/g, '').trim()
    assessment = JSON.parse(clean)
  } catch {
    assessment = { capable: true, confidence: 80, reason: 'Default acceptance' }
  }

  if (!assessment.capable) {
    return {
      decision: 'reject',
      reason: assessment.reason,
      price: 0
    }
  }

  return {
    decision: 'accept',
    price,
    estimatedTime: COMPLEXITY[job.inputLength] * 15 + ' seconds',
    confidence: assessment.confidence,
    reason: assessment.reason
  }
}

module.exports = { evaluateJob }