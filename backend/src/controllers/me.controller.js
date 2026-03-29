const fs = require('fs')
const path = require('path')
const { prisma } = require('../prisma/client')
const { dest } = require('../middleware/upload.middleware')

async function getMe(req, res) {
  const userId = Number(req.user.sub)
  if (!userId) {
    return res.status(401).json({ ok: false, error: 'invalid token payload' })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      active: true,
      avatarUrl: true,
      createdAt: true,
    },
  })

  if (!user) {
    return res.status(404).json({ ok: false, error: 'User not found' })
  }

  return res.json({ ok: true, user })
}

async function uploadAvatarController(req, res) {
  const userId = Number(req.user.sub)

  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'no_file_uploaded' })
  }

  const avatarUrl = `${process.env.BACKEND_URL}/avatars/${req.file.filename}`

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  })

  if (user && user.avatarUrl) {
    const oldPath = user.avatarUrl.replace(process.env.BACKEND_URL, '')
    const oldBase = path.basename(oldPath)
    const resolved = path.resolve(dest, oldBase)
    if (resolved.startsWith(path.resolve(dest) + path.sep)) {
      fs.unlink(resolved, () => {})
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: { id: true, avatarUrl: true },
  })

  return res.json({ ok: true, user: { avatarUrl: updated.avatarUrl } })
}

module.exports = { getMe, uploadAvatarController }
