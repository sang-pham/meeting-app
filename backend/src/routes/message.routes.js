const { Router } = require('express')
const { getImageMessage, getImageMessageMedia, getFileMessageMedia } = require('../controllers/message.controller')
const router = Router()

router.route('/api/messages/:messageId/image')
  .get(getImageMessage)

router.route('/api/messages/:messageId/:mediaId')
  .get(getImageMessageMedia)

router.route('/api/messages/files/:messageId/:mediaId')
  .get(getFileMessageMedia)



module.exports = router