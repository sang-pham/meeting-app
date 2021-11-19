const userSockets = {

};

const { getMemberTeam, sendMessage, socketInviteUsers } = require('../controllers/team.controller');
const { getActiveMemberMeeting, addMemberMeeting,
    joinMeeting, outMeeting, getUserMeeting, getMeetingInfo,
    updateMeetingState, sendMessageMeeting } = require('../controllers/meeting.controller')
const { setConversation, setMessage, removeMessageCv } = require('../controllers/conversation.controller');
const { createNofication } = require('../controllers/notification.controller')



const socketServer = (socket) => {
    if (!userSockets[socket.userId]) {
        userSockets[socket.userId] = [socket.id]
    } else {
        userSockets[socket.userId].push(socket.id)
    }


    //**********************************TEAM*************************************//

    socket.on('send-message-team', async ({ teamId, senderId, content, files }) => {
        let members = await getMemberTeam({ teamId });
        members = members.filter(m => m.id !== senderId);
        const message = await sendMessage({ teamId, senderId, content, files })
        socket.emit('receive-message-team', { messageId: message.id, content, teamId, senderId, files: message.files, photos: message.photos, createdAt: message.createdAt })
        for (let m of members) {
            if (userSockets[m.id] && userSockets[m.id].length) {
                for (const socketId of userSockets[m.id]) {
                    socket.to(socketId).emit('receive-message-team', { messageId: message.id, teamId, senderId, content, files: message.files, photos: message.photos, createdAt: message.createdAt });
                }
            }
        }
    })

    socket.on('team-invite-users', async ({ teamId, users }) => {
        let result = await socketInviteUsers({ teamId, users })
        if (result.message && result.message === 'success') {
            socket.emit('team-invite-user-success', { users, teamId })
            let { hostName, teamName, hostId } = result
            let createdBy = socket.userId
            let relativeLink = `/teams/${teamId}`
            let content = `${hostName} has invited you to join ${teamName}`
            let noti
            for (const user of users) {
                noti = await createNofication({ userId: user.id, content, relativeLink, createdBy, teamId })
                for (const socketId of userSockets[user.id]) {
                    console.log(socketId, user.id)
                    socket.to(socketId).emit('receive-team-invitation', { noti, teamId, teamName, hostId })
                }
            }
        }
    })

    //**********************************TEAM*************************************//


    //**********************************MEETING*************************************//

    socket.on('new-meeting', async ({ meeting }) => {
        let { teamId } = meeting
        let members = await getMemberTeam({ teamId });
        for (let m of members) {
            if (userSockets[m.id] && userSockets[m.id].length) {
                for (const socketId of userSockets[m.id]) {
                    socket.to(socketId).emit('new-meeting-created', { meeting });
                }
            }
        }
    })

    socket.on("join-meeting", async ({ teamId, meetingId, userId, isAudioActive }) => {
        socket.join(`meeting-${meetingId}`);
        console.log('rooms', socket.rooms);
        let user = await getUserMeeting({ meetingId, userId })
        if (!user) {
            user = await addMemberMeeting({ meetingId, userId });
        } else {
            if (!user.inMeeting) {
                await joinMeeting({ meetingId, userId })
            }
        }
        let members = await getActiveMemberMeeting({ meetingId }); // luon lay in Meeting
        user = members.find(m => m.userId === user.userId)
        socket.meetingId = meetingId

        socket.emit('joined-meeting', { members, meetingId, teamId, isAudioActive })

        console.log(`meeting ${members}`)

        for (let m of members) {
            console.log(userSockets[m.userId])
            if (userSockets[m.userId] && userSockets[m.userId].length) {
                for (const socketId of userSockets[m.userId]) {
                    socket.to(socketId).emit('user-join-meeting', { teamId, meetingId, user, isAudioActive });
                }
            }
        }
    });

    socket.on('send-message-meeting', async ({ teamId, senderId, content, file, meetingId }) => {
        let members = await getActiveMemberMeeting({ meetingId });
        members = members.filter(m => m.id !== senderId);
        const message = await sendMessageMeeting({ senderId, content, file, meetingId })
        socket.emit('sent-message-meeting', {
            messageId: message.id, content, meetingId, senderId,
            photos: message.photos, teamId, files: message.files, createdAt: message.createdAt
        })

        socket.to(`meeting-${meetingId}`).emit('receive-message-meeting', {
            messageId: message.id, meetingId, senderId, content,
            photos: message.photos, files: message.files, createdAt: message.createdAt
        })
    })

    socket.on('meeting-audio-change', async ({ meetingId, userId, isAudioActive }) => {
        socket.to(`meeting-${meetingId}`).emit('meeting-user-audio-changed', {
            isAudioActive, userChangeAudio: userId, meetingId
        })
    })

    //**********************************MEETING*************************************//



    //**********************************CONVERSATION*************************************//

    socket.on('conversation-sendMessage', async ({ content, senderId, receiverId, conversationId, files }) => {
        const converId = await setConversation({ senderId, receiverId, conversationId });
        console.log(files);
        const message = await setMessage({ content, conversationId: converId, senderId, files });
        if (message) {
            socket.emit('conversation-receiveMessage', {
                messageId: message.id, content, senderId, receiverId,
                conversationId: converId, files: message.files, photos: message.photos,
                createdAt: message.createdAt
            })
            if (userSockets[receiverId] && userSockets[receiverId].length) {
                for (const socketId of userSockets[receiverId]) {
                    socket.to(socketId).emit('conversation-receiveMessage', {
                        messageId: message.id, content, senderId, receiverId,
                        conversationId: converId, files: message.files, photos: message.photos,
                        createdAt: message.createdAt
                    });
                }
            }
        }
    })

    socket.on('conversation-remove-message', async ({ conversationId, messageId, senderId, receiverId }) => {
        let report = await removeMessageCv({ conversationId, messageId, senderId });
        if (report) {
            if (userSockets[receiverId] && userSockets[receiverId].length) {
                for (const socketId of userSockets[receiverId]) {
                    socket.to(socketId).emit('conversation-removed-message', { conversationId, messageId, senderId })
                }
            }
            socket.emit('conversation-removed-message', { conversationId, messageId, senderId })
        }
    })

    socket.on('conversation-call', ({ conversationId, senderId, senderName, receiverId }) => {
        console.log(senderName);
        if (userSockets[receiverId] && userSockets[receiverId].length) {
            for (const socketId of userSockets[receiverId]) {
                socket.to(socketId).emit('conversation-calling', { conversationId, senderId, senderName, receiverId })
            }
        }
    })

    socket.on('conversation-cancel-call', ({ conversationId, senderId, receiverId }) => {
        if (userSockets[receiverId] && userSockets[receiverId].length) {
            for (const socketId of userSockets[receiverId]) {
                socket.to(socketId).emit('cancel-call', { conversationId, senderId, receiverId })
            }
        }
    })

    //**********************************CONVERSATION*************************************//

    //disconnect
    socket.on('disconnect', async () => {
        console.log(`disconnect with meetingId: ${socket.meetingId} ${socket.id}`)
        if (socket.meetingId) {
            let { message } = await outMeeting({
                meetingId: socket.meetingId,
                userId: socket.userId
            })
            let meeting
            if (message) {
                let members = await getActiveMemberMeeting({ meetingId: socket.meetingId });
                if (members.length === 0) {
                    console.log('all out meeting')
                    members = await updateMeetingState({ meetingId: socket.meetingId })
                    meeting = await getMeetingInfo({ meetingId: socket.meetingId })
                    console.log(members)
                    for (let m of members) {
                        if (userSockets[m.userId]) {
                            for (const socketId of userSockets[m.userId]) {
                                socket.to(socketId).emit('end-meeting', {
                                    meeting
                                })
                            }
                        }

                    }
                } else {
                    for (const socketId of userSockets[socket.userId]) {
                        socket.to(socketId).emit('own-out-meeting', {
                            meetingId: socket.meetingId
                        })
                    }
                    socket.to(`meeting-${socket.meetingId}`).emit('user-out-meeting', { meetingId: socket.meetingId, userId: socket.userId });
                }
            }
            delete socket.meetingId;
            socket.leave(`meeting-${socket.meetingId}`)
        }
        userSockets[socket.userId] = userSockets[socket.userId].filter(socketId => socketId != socket.id)
    });
}

module.exports = socketServer;