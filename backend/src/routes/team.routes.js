const { Router } = require('express')
const { requireSignin } = require('../controllers/auth.controller')
const { getTeamInfo, createTeam, getTeamCoverPhoto,
  getTeamMembers, getTeamRequestUsers, isAdmin,
  confirmUserRequests, removeUserRequests, removeMembers } = require('../controllers/team.controller')

const router = Router()

router.route('/api/teams/:teamId/members')
  .get(requireSignin, getTeamMembers)

router.route('/api/teams/:teamId/requestusers')
  .get(requireSignin, isAdmin, getTeamRequestUsers)

router.route('/api/teams/:teamId/confirm-requests')
  .put(requireSignin, isAdmin, confirmUserRequests)

router.route('/api/teams/:teamId/remove-requests')
  .put(requireSignin, isAdmin, removeUserRequests)

router.route('/api/teams/:teamId/remove-members')
  .put(requireSignin, isAdmin, removeMembers)

router.route('/api/teams/:teamId')
  .get(getTeamInfo)

router.route('/api/teams')
  .post(requireSignin, createTeam)

router.route('/api/team/coverphoto/:teamId')
  .get(getTeamCoverPhoto)

module.exports = router