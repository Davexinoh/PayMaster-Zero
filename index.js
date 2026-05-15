require('dotenv').config()
const express = require('express')
const cors = require('cors')
const jobRoutes = require('./routes/job')
const agentRoutes = require('./routes/agent')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    agent: 'PayMaster Zero',
    network: process.env.KITE_NETWORK,
    wallet: process.env.AGENT_WALLET_ADDRESS
  })
})

app.use('/api/job', jobRoutes)
app.use('/api/agent', agentRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`PayMaster Zero online — port ${PORT}`)
  console.log(`Agent wallet: ${process.env.AGENT_WALLET_ADDRESS}`)
  console.log(`Network: ${process.env.KITE_NETWORK}`)
})