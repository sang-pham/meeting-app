const formidable = require('formidable')
const fs = require('fs')
const sequelize = require('../models')
const Team = require('../models/team')
const User = require('../models/user')

const getTeamInfo = async (req, res) => {
  let { teamId } = req.params
  const teams = await sequelize.query(
    "SELECT t.name, t.teamType, COUNT(*) as numOfMembers " +
    "FROM teams t " +
    "LEFT JOIN users_teams ut ON t.id = ut.teamId " +
    "WHERE t.id = :teamId",
    {
      replacements: {
        teamId
      },
      raw: true,
      type: sequelize.QueryTypes.SELECT
    }
  )
  return res.status(200).json({
    team: teams[0]
  })
}

const createTeam = async (req, res) => {
  let { id } = req.auth
  const form = formidable.IncomingForm()
  form.keepExtensions = true
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: err })
    }
    let { name } = fields
    let coverPhoto,
      teamType = fields.teamType || 'public'
    if (files.coverPhoto) {
      coverPhoto = fs.readFileSync(files.coverPhoto.path)
    }
    try {
      let teams = await Team.findAll({
        where: {
          hostId: id
        },
        attributes: ['name']
      })
      if (teams.length > 0) {
        let check = teams.some(team => team.name === name)
        if (check) {
          return res.status(400).json({
            error: `Team with name ${name} has been created by you, please choose other name`
          })
        }
      }
      let team = await Team.create({
        name,
        coverPhoto,
        teamType,
        hostId: id
      })
      team.coverPhoto = undefined
      return res.status(201).json({ team })
    } catch (error) {
      console.log(error)
      return res.status(400).json({ error })
    }
  })
}

const getTeamCoverPhoto = async (req, res) => {
  let { teamId } = req.params
  let team = await Team.findOne({
    where: {
      id: teamId
    },
    attributes: ['coverPhoto']
  })
  if (!team) {
    return res.status(400).json({ error: 'Team not found' })
  }
  if (team.coverPhoto) {
    return res.send(team.coverPhoto)
  }
}

const getTeamMembers = async (req, res) => {
  let { teamId } = req.params
  try {
    const members = await sequelize.query(
      "CALL getTeamMembers(:teamId)",
      {
        replacements: {
          teamId
        }
      }
    )
    return res.status(200).json({ members })
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error })
  }
}

const getTeamRequestUsers = async (req, res) => {
  let { teamId } = req.params
  try {
    const requestMembers = await sequelize.query(
      "CALL getTeamRequestMembers(:teamId)",
      {
        replacements: {
          teamId
        }
      }
    )
    return res.status(200).json({ requestMembers })
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error })
  }
}

const isAdmin = async (req, res, next) => {
  let { id } = req.auth
  let { teamId } = req.params
  try {
    let team = await Team.findOne({
      where: {
        id: teamId
      },
      attributes: ['hostId']
    })
    if (!team) {
      throw `Team not found`
    }
    if (team.hostId != id) {
      throw `You aren't the admin of this group`
    }
    req.hostId = team.hostId
    next()
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error })
  }
}

const confirmUserRequests = async (req, res) => {
  let { teamId } = req.params
  let { users } = req.body
  let stringifyUsers = ''
  users.forEach(userId => stringifyUsers += `${userId},`)
  console.log(stringifyUsers)
  const messages = await sequelize.query(
    "CALL removeRequestUsers(:users, :teamId, :confirmFlag)",
    {
      replacements: {
        users: stringifyUsers,
        teamId,
        confirmFlag: true
      }
    }
  )
  console.log(messages[0])
  if (messages[0]) {
    return res.status(200).json(messages[0])
  }
}

const removeUserRequests = async (req, res) => {
  let { teamId } = req.params
  let { users } = req.body
  if (users.indexOf(req.hostId) >= 0) {
    throw `You are the admin of this group, can't remove yourself!`
  }
  let stringifyUsers = ''
  users.forEach(userId => stringifyUsers += `${userId},`)
  console.log(stringifyUsers)
  const messages = await sequelize.query(
    "CALL removeRequestUsers(:users, :teamId, :confirmFlag)",
    {
      replacements: {
        users: stringifyUsers,
        teamId,
        confirmFlag: false
      }
    }
  )
  console.log(messages[0])
  if (messages[0]) {
    return res.status(200).json(messages[0])
  }
}

const removeMembers = async (req, res) => {
  let { teamId } = req.params
  let { users } = req.body
  let stringifyUsers = ''
  users.forEach(userId => stringifyUsers += `${userId},`)
  console.log(stringifyUsers)
  try {
    const result = await sequelize.query(
      "DELETE FROM users_teams ut " +
      "WHERE ut.teamId = :teamId AND FIND_IN_SET(ut.userId, :users);",
      {
        replacements: {
          teamId,
          users: stringifyUsers
        }
      }
    )
    console.log(result)
    if (result.length > 0) {
      return res.status(200).json({
        message: 'Remove members successfully'
      })
    }
    return res.status(200).json({ result })
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error })
  }
}

module.exports = {
  getTeamInfo, createTeam, getTeamCoverPhoto,
  getTeamMembers, getTeamRequestUsers, isAdmin,
  confirmUserRequests, removeUserRequests, removeMembers
}