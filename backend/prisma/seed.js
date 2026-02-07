const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

dotenv.config()

const prisma = new PrismaClient()

const usersSeed = [
  { email: 'alice@example.com', password: 'password123' },
  { email: 'bob@example.com', password: 'password123' },
]

const docsSeed = [
  {
    title: 'Getting Started',
    language: 'markdown',
    content: '# Welcome\n\nThis is a seeded document.',
  },
  {
    title: 'Ideas',
    language: 'plaintext',
    content: 'Write down your ideas here.',
  },
]

const run = async () => {
  for (const userSeed of usersSeed) {
    const existing = await prisma.user.findUnique({
      where: { email: userSeed.email },
      select: { id: true },
    })

    let userId = existing?.id
    if (!userId) {
      const passwordHash = await bcrypt.hash(userSeed.password, 10)
      const user = await prisma.user.create({
        data: { email: userSeed.email, passwordHash },
        select: { id: true },
      })
      userId = user.id
    }

    const existingDocs = await prisma.document.count({
      where: { ownerId: userId },
    })

    if (existingDocs === 0) {
      await prisma.document.createMany({
        data: docsSeed.map((doc) => ({ ...doc, ownerId: userId })),
      })
    }
  }
}

run()
  .then(async () => {
    await prisma.$disconnect()
    console.log('Seed completed.')
  })
  .catch(async (err) => {
    console.error('Seed failed:', err)
    await prisma.$disconnect()
    process.exit(1)
  })
