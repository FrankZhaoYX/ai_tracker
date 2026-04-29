import { Router } from 'express'
import { prisma } from '../db/prisma.js'

export const settingsRouter = Router()

settingsRouter.get('/', async (_req, res) => {
  const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } })
  res.json(settings)
})

settingsRouter.post('/', async (req, res) => {
  const { cronExpression, alertThreshold, emailEnabled, notifyEmail } = req.body as {
    cronExpression?: string
    alertThreshold?: number
    emailEnabled?: boolean
    notifyEmail?: string
  }

  const settings = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {
      ...(cronExpression !== undefined && { cronExpression }),
      ...(alertThreshold !== undefined && { alertThreshold }),
      ...(emailEnabled !== undefined && { emailEnabled }),
      ...(notifyEmail !== undefined && { notifyEmail }),
    },
    create: {
      id: 'singleton',
      cronExpression: cronExpression ?? '*/30 * * * *',
      alertThreshold: alertThreshold ?? 80,
      emailEnabled: emailEnabled ?? false,
      notifyEmail: notifyEmail ?? '',
    },
  })

  res.json(settings)
})
