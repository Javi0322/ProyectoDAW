const express = require('express')
const { requireAuth } = require('../middleware/auth.middleware')
const { uploadAvatar } = require('../middleware/upload.middleware')
const { getMe, uploadAvatarController } = require('../controllers/me.controller')

const router = express.Router()

router.get('/', requireAuth, getMe)
router.post('/avatar', requireAuth, uploadAvatar, uploadAvatarController)

module.exports = router
