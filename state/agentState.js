const agentState = {
  balance: 0,
  reputation: 100,
  jobsCompleted: 0,
  jobsFailed: 0,
  totalEarned: 0,
  jobs: {}
}

const MIN_PROFIT_THRESHOLD = 1
const MIN_REPUTATION = 20

function getState() {
  return agentState
}

function getJob(jobId) {
  return agentState.jobs[jobId] || null
}

function createJob(job) {
  agentState.jobs[job.jobId] = job
  return job
}

function updateJob(jobId, updates) {
  agentState.jobs[jobId] = { ...agentState.jobs[jobId], ...updates }
  return agentState.jobs[jobId]
}

function updateReputation(outcome) {
  if (outcome === 'success') {
    agentState.reputation = Math.min(100, agentState.reputation + 5)
    agentState.jobsCompleted++
  }
  if (outcome === 'failed') {
    agentState.reputation = Math.max(0, agentState.reputation - 15)
    agentState.jobsFailed++
  }
}

function recordPayment(amount) {
  agentState.balance += amount
  agentState.totalEarned += amount
}

module.exports = {
  getState,
  getJob,
  createJob,
  updateJob,
  updateReputation,
  recordPayment,
  MIN_PROFIT_THRESHOLD,
  MIN_REPUTATION
}