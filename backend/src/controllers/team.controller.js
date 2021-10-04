const formidable = require('formidable')
const fs = require('fs')
const { v4 } = require('uuid')
const { QueryTypes } = require('sequelize')
const sequelize = require('../models')
const Team = require('../models/team')
const User = require('../models/user')
const Message = require('../models/message')

const getTeamInfo = async (req, res) => {
  let { teamId } = req.params
  const teams = await sequelize.query(
    "SELECT t.name, t.teamType, t.id, t.hostId, COUNT(*) as numOfMembers " +
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
      let fileType = files.coverPhoto.path.split('.')[files.coverPhoto.path.split('.').length - 1]
      coverPhoto = `${v4()}.${fileType}`
      let writeStream = fs.createWriteStream(`./src/public/teams-coverphotos/${coverPhoto}`)
      fs.createReadStream(files.coverPhoto.path).pipe(writeStream)
    } else {
      coverPhoto = ''
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
    fs.createReadStream(`./src/public/teams-coverphotos/${team.coverPhoto}`).pipe(res)
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
    const requestUsers = await sequelize.query(
      "CALL getTeamRequestMembers(:teamId)",
      {
        replacements: {
          teamId
        }
      }
    )
    return res.status(200).json({ requestUsers })
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error })
  }
}

const getTeamInvitedUsers = async (req, res) => {
  let { teamId } = req.params
  try {
    const invitedUsers = await sequelize.query(
      "CALL getTeamInvitedUsers(:teamId)",
      {
        replacements: {
          teamId
        }
      }
    )
    return res.status(200).json({ invitedUsers })
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
  try {
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
    } else {
      return res.status(400).json({ error: 'Some thing wrong' })
    }
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error })
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
  try {
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
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error })
  }
}

const removeMembers = async (req, res) => {
  let { teamId } = req.params
  let { users } = req.body
  let stringifyUsers = ''
  users.forEach(userId => stringifyUsers += `${userId},`)
  console.log(stringifyUsers)
  try {
    await sequelize.query(
      "DELETE FROM users_teams ut " +
      "WHERE ut.teamId = :teamId AND FIND_IN_SET(ut.userId, :users);",
      {
        replacements: {
          teamId,
          users: stringifyUsers
        },
        type: QueryTypes.DELETE
      }
    )
    return res.status(200).json({
      message: 'Remove members successfully'
    })
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error })
  }
}

const removeTeam = async (req, res) => {
  let { teamId } = req.params
  try {
    let team = await Team.findOne({
      where: {
        id: teamId
      },
      attributes: ['coverPhoto']
    })
    fs.unlink(`./src/public/teams-coverphotos/${team.coverPhoto}`, (err) => {
      if (err) {
        console.log(err)
        throw err
      }
    })
    await sequelize.query(
      "DELETE FROM teams WHERE id = :teamId",
      {
        replacements: {
          teamId
        },
        type: QueryTypes.DELETE
      }
    )
    return res.status(200).json({ message: 'Delete team successfully' })
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error })
  }
}

const inviteUsers = async (req, res) => {
  let { users } = req.body
  let { teamId } = req.params
  let stringifyUsers = ''
  users.forEach(userId => stringifyUsers += `${userId},`)
  console.log(stringifyUsers)
  try {
    const messages = await sequelize.query(
      "CALL inviteUsers(:teamId, :users)",
      {
        replacements: {
          users: stringifyUsers,
          teamId
        }
      }
    )
    console.log(messages[0])
    if (messages[0]) {
      return res.status(200).json(messages[0])
    } else {
      return res.status(400).json({ error: 'Some thing wrong' })
    }
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error })
  }
}

const removeInvitations = async (req, res) => {
  let { teamId } = req.params
  let { users } = req.body
  try {
    if (!users || users.length === 0) {
      throw 'Error with removing empty user list'
    }
    let stringifyUsers = ''
    users.forEach(userId => stringifyUsers += `${userId},`)
    console.log(stringifyUsers)
    await sequelize.query(
      "DELETE FROM invited_users_teams iut " +
      "WHERE iut.teamId = :teamId AND FIND_IN_SET(iut.invitedUserId, :users);",
      {
        replacements: {
          teamId,
          users: stringifyUsers
        },
        type: QueryTypes.DELETE
      }
    )
    return res.status(200).json({
      message: 'Remove invitations successfully'
    })
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error })
  }
}

const searchTeams = async (req, res) => {
  let userId = req.auth.id
  let { name } = req.body
  try {
    let teams = await sequelize.query(
      "SELECT t.name, t.id, t.hostId FROM teams t " +
      "WHERE t.name LIKE :name AND t.teamType = 'public' " +
      "AND t.id NOT IN (SELECT teamId FROM users_teams WHERE userId = :userId " +
      " UNION SELECT teamId FROM invited_users_teams WHERE invitedUserId = :userId " +
      " UNION SELECT teamId FROM request_users_teams WHERE requestUserId = :userId);",
      {
        replacements: {
          userId, name: `%${name}%`
        },
        type: QueryTypes.SELECT
      }
    )
    return res.status(200).json({ teams })
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error })
  }
}

const updateBasicTeamInfo = async (req, res) => {
  let { teamId } = req.params
  const form = formidable.IncomingForm()
  form.keepExtensions = true
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.log(err)
      return res.status(400).json({ error: err })
    }
    try {
      let coverPhoto
      if (files.coverPhoto) {
        let fileType = files.coverPhoto.path.split('.')[files.coverPhoto.path.split('.').length - 1]
        coverPhoto = `${v4()}.${fileType}`
        fs.createReadStream(files.coverPhoto.path)
          .pipe(fs.createWriteStream(`./src/public/teams-coverphotos/${coverPhoto}`))
      } else {
        coverPhoto = ''
      }
      let name = fields.name || ''
      let teamType = fields.teamType || ''
      let team = await Team.findOne({
        where: {
          id: teamId
        },
        attributes: ['coverPhoto']
      })
      if (files.coverPhoto) {
        fs.unlink(`./src/public/teams-coverphotos/${team.coverPhoto}`, (err) => {
          if (err) {
            console.log(err)
            throw err
          }
        })
      }
      const result = await sequelize.query(
        'CALL updateBasicTeamInfo(:teamId, :teamName, :coverPhoto, :teamType)',
        {
          replacements: {
            teamId,
            teamName: name,
            coverPhoto,
            teamType
          }
        }
      )
      let _team = result[0]
      return res.status(200).json({ team: _team })
    } catch (error) {
      console.log(error)
      if (error.name === 'SequelizeDatabaseError') {
        if (error.parent.errno == 1406) {
          return res.status(400).json({
            error: 'Too large image to update'
          })
        }
      }
      return res.status(400).json({
        error
      })
    }
  })
}

const sendMessage = async (req, res) => {
  let { content } = req.body
  let { id } = req.auth
  let { teamId } = req.params

  try {
    const message = await Message.create({
      content,
      userId: id,
      teamId
    })
    return res.status(201).json({ message })
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error })
  }
}

const getTeamMessages = async (req, res) => {
  let { offset, num } = req.query
  let { teamId } = req.params
  try {
    if (isNaN(offset) || isNaN(num)) {
      let numOfMessages = await sequelize.query(
        "SELECT COUNT(*) as num FROM messages m WHERE m.teamId = :teamId",
        {
          replacements: {
            teamId
          },
          type: QueryTypes.SELECT
        }
      )
      let messages = await sequelize.query(
        "CALL getTeamMessages(:teamId, 0, 0)",
        {
          replacements: {
            teamId
          }
        }
      )
      return res.status(200).json({
        numOfMessages: numOfMessages[0].num,
        messages
      })
    } else {
      console.log('call here')
      let messages = await sequelize.query(
        "CALL getTeamMessages(:teamId, :offset, :num)",
        {
          replacements: {
            teamId, offset: Number(offset), num: Number(num)
          }
        }
      )
      return res.status(200).json({
        messages
      })
    }
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error })
  }
}

module.exports = {
  getTeamInfo, createTeam, getTeamCoverPhoto,
  getTeamMembers, getTeamRequestUsers,
  confirmUserRequests, removeUserRequests, removeMembers,
  removeTeam, inviteUsers, removeInvitations,
  getTeamInvitedUsers, searchTeams, updateBasicTeamInfo,
  sendMessage, getTeamMessages
}