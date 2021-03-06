const { Router } = require('express')
const { signup, getUserInfo, updateUserInfo, getUserAvatar,
  requestJoinTeam, getJoinedTeams, getRequestingTeams,
  outTeam, cancelJoinRequest, confirmInvitations,
  removeInvitations, getInvitations, getNotifications,
  searchUsers, saveFeedback } = require('../controllers/user.controller')
const { requireSignin } = require('../controllers/auth.controller')

const router = Router()

router.route('/api/signup')
  .post(signup)

router.route('/api/users/teams/:teamId')
  .post(requireSignin, requestJoinTeam)

router.route('/api/users/search')
  .post(requireSignin, searchUsers)

router.route('/api/users/:userId/teams')
  .get(requireSignin, getJoinedTeams)

router.route('/api/users/:userId/notifications')
  .get(requireSignin, getNotifications)

router.route('/api/users/:userId/confirm-invitations')
  .put(requireSignin, confirmInvitations)

router.route('/api/users/:userId/remove-invitations')
  .put(requireSignin, removeInvitations)

router.route('/api/users/:userId/teams/:teamId')
  .delete(requireSignin, outTeam)

router.route('/api/users/:userId/requesting-teams')
  .get(requireSignin, getRequestingTeams)

router.route('/api/users/:userId/invitations')
  .get(requireSignin, getInvitations)

router.route('/api/users/:userId/cancel-request')
  .put(requireSignin, cancelJoinRequest)

router.route('/api/users/:userId')
  .get(requireSignin, getUserInfo)
  .put(requireSignin, updateUserInfo)

router.route('/api/user/avatar/:userId')
  .get(getUserAvatar)

router.route('/api/user/:userId/feedback')
  .post(requireSignin, saveFeedback)


module.exports = router