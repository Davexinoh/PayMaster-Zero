const Groq = require('groq-sdk')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function executeJob(job) {
  const prompt = `You are PayMaster Zero, an autonomous commercial agent.
Complete this task with precision. Your reputation depends on quality.

Task type: ${job.taskType}
Task: ${job.description}

Return only the deliverable. No preamble. No explanation.`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  })

  const output = response.choices[0].message.content

  return {
    draft: output,
    final: output,
    executedAt: new Date().toISOString()
  }
}

module.exports = { executeJob }
