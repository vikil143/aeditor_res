const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { z } = require('zod')
const { PrismaClient } = require('@prisma/client')

dotenv.config()

const app = express()
const prisma = new PrismaClient()

const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'replace_me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const docSchema = z.object({
  title: z.string().min(1),
  language: z.string().min(1),
  content: z.string(),
})

const issueToken = (userId) => {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

const authRequired = async (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing token' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.sub
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

app.post('/auth/register', async (req, res) => {
  const parsed = authSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const { email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true, createdAt: true },
  })

  const token = issueToken(user.id)
  return res.json({ user, token })
})

app.post('/auth/login', async (req, res) => {
  const parsed = authSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const matches = await bcrypt.compare(password, user.passwordHash)
  if (!matches) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = issueToken(user.id)
  return res.json({
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
    token,
  })
})

app.get('/auth/me', authRequired, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, createdAt: true },
  })
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  return res.json({ user })
})

app.get('/docs', authRequired, async (req, res) => {
  const docs = await prisma.document.findMany({
    where: { ownerId: req.userId },
    orderBy: { updatedAt: 'desc' },
  })
  return res.json({ docs })
})

app.post('/docs', authRequired, async (req, res) => {
  const parsed = docSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const doc = await prisma.document.create({
    data: {
      ...parsed.data,
      ownerId: req.userId,
    },
  })
  return res.status(201).json({ doc })
})

app.put('/docs/:id', authRequired, async (req, res) => {
  const parsed = docSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const existing = await prisma.document.findFirst({
    where: { id: req.params.id, ownerId: req.userId },
  })
  if (!existing) {
    return res.status(404).json({ error: 'Document not found' })
  }

  const doc = await prisma.document.update({
    where: { id: existing.id },
    data: parsed.data,
  })
  return res.json({ doc })
})

app.delete('/docs/:id', authRequired, async (req, res) => {
  const existing = await prisma.document.findFirst({
    where: { id: req.params.id, ownerId: req.userId },
  })
  if (!existing) {
    return res.status(404).json({ error: 'Document not found' })
  }

  await prisma.document.delete({ where: { id: existing.id } })
  return res.status(204).send()
})

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
