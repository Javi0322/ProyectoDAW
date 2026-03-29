const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg':  '.jpg',
  'image/png':  '.png',
  'image/webp': '.webp',
}

const dest = path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'avatars')
fs.mkdirSync(dest, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dest),
  filename: (_req, file, cb) => {
    const ext = MIME_TO_EXT[file.mimetype]
    const name = `avatar-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`
    cb(null, name)
  },
})

const fileFilter = (_req, file, cb) => {
  if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('invalid_file_type'))
  }
}

const multerUpload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }).single('avatar')

function uploadAvatar(req, res, next) {
  multerUpload(req, res, (err) => {
    if (!err) return next()
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ ok: false, error: 'file_too_large' })
    if (err.message === 'invalid_file_type') return res.status(400).json({ ok: false, error: 'invalid_file_type' })
    next(err)
  })
}

module.exports = { uploadAvatar, dest }
