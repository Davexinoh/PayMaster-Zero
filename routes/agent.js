const express = require('express')
const router = express.Router()
const { getState } = require('../state/agentState')

// GET /api/agent/status
router.get('/status', (req, res) => {
  const state = getState()
  res.json({
    wallet: process.env.AGENT_WALLET_ADDRESS,
    network: process.env.KITE_NETWORK,
    reputation: state.reputation,
    balance: state.balance,
    totalEarned: state.totalEarned,
    jobsCompleted: state.jobsCompleted,
    jobsFailed: state.jobsFailed,
    status: state.reputation >= 20 ? 'active' : 'suspended'
  })
})

module.exports = router