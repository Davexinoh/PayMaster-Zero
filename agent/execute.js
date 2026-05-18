const Groq = require('groq-sdk')
const { GoogleGenerativeAI } = require('@google/generative-ai')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function executeJob(job) {
  const groqPrompt = `You are PayMaster Zero, an autonomous commercial agent.
Complete this task with precision. Your reputation depends on quality.

Task type: ${job.taskType}
Task: ${job.description}

Return only the raw deliverable. No preamble.`

  const groqResponse = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: groqPrompt }],
    temperature: 0.7
  })

  const groqOutput = groqResponse.choices[0].message.content

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const geminiPrompt = `You are a quality synthesis engine for PayMaster Zero, an autonomous AI agent.

A client paid for this task: "${job.description}"

Here is the draft output:
${groqOutput}

Refine and finalize this into a polished, client-ready deliverable. Return only the final output.`

  const geminiResult = await model.generateContent(geminiPrompt)
  const finalOutput = geminiResult.response.text()

  return {
    draft: groqOutput,
    final: finalOutput,
    executedAt: new Date().toISOString()
  }
}

module.exports = { executeJob }
