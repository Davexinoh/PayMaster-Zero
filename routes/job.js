const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const { evaluateJob } = require('../agent/evaluate')
const { executeJob } = require('../agent/execute')
const { createJob, getJob, updateJob, updateReputation, recordPayment } = require('../state/agentState')

const AGENT_WALLET = process.env.AGENT_WALLET_ADDRESS
const ASSET_ADDRESS = process.env.KITE_ASSET_ADDRESS
const NETWORK = process.env.KITE_NETWORK

// POST /api/job/submit
router.post('/submit', async (req, res) => {
  try {
    const { description, taskType, inputLength, clientAddress } = req.body

    if (!description || !taskType || !inputLength) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const jobId = uuidv4()
    const job = createJob({
      jobId,
      clientAddress: clientAddress || 'anonymous',
      description,
      taskType,
      inputLength,
      status: 'evaluating',
      price: 0,
      createdAt: new Date().toISOString()
    })

    const evaluation = await evaluateJob(job)

    if (evaluation.decision === 'reject') {
      updateJob(jobId, { status: 'rejected', rejectReason: evaluation.reason })
      return res.status(200).json({
        jobId,
        decision: 'reject',
        reason: evaluation.reason
      })
    }

    updateJob(jobId, {
      status: 'awaiting_payment',
      price: evaluation.price,
      estimatedTime: evaluation.estimatedTime
    })

    const paymentRequired = {
      error: 'X-PAYMENT header is required',
      accepts: [{
        scheme: 'gokite-aa',
        network: NETWORK,
        maxAmountRequired: (evaluation.price * 1e18).toString(),
        resource: `${req.protocol}://${req.get('host')}/api/job/execute`,
        description: `PayMaster Zero - ${taskType}`,
        mimeType: 'application/json',
        outputSchema: {
          input: { discoverable: true, method: 'POST', type: 'http' },
          output: {
            properties: { result: { description: 'Task deliverable', type: 'string' } },
            required: ['result'],
            type: 'object'
          }
        },
        payTo: AGENT_WALLET,
        maxTimeoutSeconds: 300,
        asset: ASSET_ADDRESS,
        extra: null,
        merchantName: 'PayMaster Zero'
      }],
      x402Version: 1,
      jobId,
      price: evaluation.price,
      estimatedTime: evaluation.estimatedTime,
      decision: 'accept'
    }

    return res.status(402).json(paymentRequired)

  } catch (err) {
    console.error('Submit error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/job/execute
router.post('/execute', async (req, res) => {
  try {
    const paymentHeader = req.headers['x-payment']
    const { jobId } = req.body

    if (!paymentHeader) {
      return res.status(402).json({ error: 'X-PAYMENT header required' })
    }

    if (!jobId) {
      return res.status(400).json({ error: 'jobId required' })
    }

    const job = getJob(jobId)
    if (!job) return res.status(404).json({ error: 'Job not found' })
    if (job.status !== 'awaiting_payment') {
      return res.status(400).json({ error: 'Job not in payment state' })
    }

    let paymentData
    try {
      paymentData = JSON.parse(Buffer.from(paymentHeader, 'base64').toString())
    } catch {
      return res.status(400).json({ error: 'Invalid payment header' })
    }

    // Mock verification for demo
    const verification = { isValid: true }

    if (!verification.isValid) {
      updateJob(jobId, { status: 'payment_failed' })
      return res.status(402).json({ error: 'Payment verification failed' })
    }

    updateJob(jobId, { status: 'executing', paymentVerifiedAt: new Date().toISOString() })

    const result = await executeJob(job)

    // Mock settlement for demo
    console.log('Payment settled (demo mode) — jobId:', jobId)

    updateJob(jobId, {
      status: 'delivered',
      deliverable: result.final,
      completedAt: new Date().toISOString()
    })

    updateReputation('success')
    recordPayment(job.price)

    return res.status(200).json({
      jobId,
      status: 'delivered',
      result: result.final,
      completedAt: new Date().toISOString(),
      agentWallet: AGENT_WALLET
    })

  } catch (err) {
    console.error('Execute error:', err)
    if (req.body?.jobId) updateReputation('failed')
    res.status(500).json({ error: 'Execution failed' })
  }
})

// GET /api/job/:id
router.get('/:id', (req, res) => {
  const job = getJob(req.params.id)
  if (!job) return res.status(404).json({ error: 'Job not found' })
  res.json(job)
})

module.exports = router
