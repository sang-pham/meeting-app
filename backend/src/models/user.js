const { DataTypes, Model, Sequelize } = require('sequelize')
const sequelize = require('./index')
const Conversation = require('./conversation');
const Team = require('./team');
const Meeting = require('./meeting');
const Message = require('./message');
const Notification = require('./notification');

class User extends Model {
  getFullName() {
    return [this.firstName, this.lastName].join(' ');
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING, //mean VARCHAR(255)
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  hash_password: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING,
  },
  status: {
    defaultValue: 'inactive',
    type: DataTypes.STRING(10)
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user'
  }
}, {
  sequelize,
  modelName: 'User',
  indexes: [
    { fields: ['firstName', 'lastName'] },
  ]
})

const Users_Conversations = sequelize.define('Users_Conversations', {
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true });

const Users_Meetings = sequelize.define('Users_Meetings', {
  inMeeting: {
    type: DataTypes.BOOLEAN, defaultValue: true
  }
})


User.belongsToMany(Conversation, {
  through: 'Users_Conversations',
  as: 'userConversations',
  foreignKey: 'userId',
})
Conversation.belongsToMany(User, {
  through: 'Users_Conversations',
  foreignKey: 'conversationId',
})

User.belongsToMany(Team, {
  through: 'Users_Teams',
  as: 'teams',
  foreignKey: 'userId'
})
Team.belongsToMany(User, {
  through: 'Users_Teams',
  as: 'members',
  foreignKey: 'teamId'
})

User.belongsToMany(Team, {
  through: 'Request_Users_Teams',
  as: 'requestingTeams',
  foreignKey: 'requestUserId'
})
Team.belongsToMany(User, {
  through: 'Request_Users_Teams',
  as: 'requestUsers',
  foreignKey: 'teamId'
})

User.belongsToMany(Team, {
  through: 'Invited_Users_Teams',
  as: 'invitedTeams',
  foreignKey: 'invitedUserId'
})
Team.belongsToMany(User, {
  through: 'Invited_Users_Teams',
  as: 'invitedUsers',
  foreignKey: 'teamId'
})

Meeting.belongsTo(User, {
  as: 'host',
  foreignKey: 'hostId'
})
Team.belongsTo(User, {
  as: 'host',
  foreignKey: 'hostId'
})

Meeting.belongsToMany(User, {
  through: 'Users_Meetings',
  as: 'members',
  foreignKey: 'meetingId'
})
User.belongsToMany(Meeting, {
  through: 'Users_Meetings',
  as: 'meetings',
  foreignKey: 'userId'
})

User.hasMany(Message, {
  as: 'messages',
  foreignKey: {
    name: 'userId',
    allowNull: false,
  }
})

Message.belongsTo(User, {
  as: 'user',
  foreignKey: {
    name: 'userId',
    allowNull: false
  }
})

User.hasMany(Notification, {
  as: 'notifications',
  foreignKey: {
    name: 'userId',
    allowNull: false
  }
})

Notification.belongsTo(User, {
  as: 'user',
  foreignKey: {
    name: 'userId',
    allowNull: false
  }
})

User.hasMany(Notification, {
  as: 'createdNotifications',
  foreignKey: {
    name: 'createdBy',
    allowNull: false
  }
})

Notification.belongsTo(User, {
  as: 'created',
  foreignKey: {
    name: 'createdBy',
    allowNull: false
  }
})

module.exports = User