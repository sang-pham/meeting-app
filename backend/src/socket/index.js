const users = {};
const socketToMeeting = {};

const { getMemberTeam, sendMessage } = require('../controllers/team.controller');
const { getMemberMeeting, addMemberMeeting,
    joinMeeting, outMeeting, getUserMeeting } = require('../controllers/meeting.controller')
const { setConversation, setMessage } = require('../controllers/conversation.controller');



const socketServer = (socket) => {
    // socket.on("join-meeting", meetingId => {
    //     if (users[meetingId]) {

    //         users[meetingId].push(socket.id);
    //     } else {
    //         users[meetingId] = [socket.id];
    //     }
    //     socket.join(meetingId);
    //     socketToMeeting[socket.id] = meetingId;
    //     const usersInThisRoom = users[meetingId].filter(id => id !== socket.id);
    //     console.log(socket.id);
    //     socket.emit("all-users", usersInThisRoom);



    //     socket.on('disconnect-meeting', () => {
    //         const meetingId = socketToMeeting[socket.id];
    //         let room = users[meetingId];
    //         if (room) {
    //             room = room.filter(id => id !== socket.id);
    //             users[meetingId] = room;
    //             socket.broadcast.to(meetingId).emit('disconnected-meeting', socket.id);
    //         }
    //     })

    //     socket.on('send-message-team', ({ message, userId }) => {
    //         socket.broadcast.to(meetingId).emit('receive-message-team', { message, userId });
    //     })
    // });
    //team
    socket.on('send-message-team', async ({ teamId, senderId, content, image }) => {
        console.log(image)
        let members = await getMemberTeam({ teamId });
        members = members.filter(m => m.id !== senderId);
        const message = await sendMessage({ teamId, senderId, content, image })
        socket.emit('sent-message-team', { messageId: message.id, content, teamId, senderId, photo: message.photo })
        console.log('sent-message-team', socket.id)
        for (let m of members) {
            socket.to(m.id).emit('receive-message-team', { messageId: message.id, teamId, senderId, content, photo: message.photo });
        }
    })


    //meeting
    socket.on("join-meeting", async ({ teamId, meetingId, userId }) => {
        let user = await getUserMeeting({ meetingId, userId })
        if (!user) {
            user = await addMemberMeeting({ meetingId, userId });
        } else {
            if (!user.inMeeting) {
                await joinMeeting({ meetingId, userId })
            }
        }
        let members = await getMemberMeeting({ meetingId }); // luon lay in Meeting
        user = members.find(m => m.userId === user.userId)
        socket.meetingId = meetingId

        socket.emit('joined-meeting', { members, meetingId })

        for (let m of members) {
            socket.to(m.userId).emit('user-join-meeting', { teamId, meetingId, user });
        }
    });
    socket.on('out-meeting', async ({ userId, meetingId }) => {
        console.log(`out meeting ${userId} ${meetingId}`)
    })

    // socket.on("sending-signal", ({ signal, callerID, userToSignal }) => {
    //     socket.to(userToSignal).emit('joined-meeting', { signal, callerID });
    // })

    // socket.on("returning-signal", ({ signal, callerID }) => {
    //     socket.to(callerID).emit('receiving-returned-signal', { signal, userId: socket.id });
    // });

    //conversation

    socket.on('conversation-sendMessage', async ({ content, senderId, receiverId, conversationId, image }) => {
        const converId = await setConversation({ senderId, receiverId, conversationId });
        const message = await setMessage({ content, conversationId: converId, senderId, image });

        if (message) {
            socket.emit('conversation-sentMessage', { messageId: message.id, content, senderId, receiverId, conversationId: converId, photo: message.photo, createdAt: message.createdAt })
            socket.to(receiverId).emit('conversation-receiveMessage', { messageId: message.id, content, senderId, receiverId, conversationId: converId, photo: message.photo, createdAt: message.createdAt });
        }
    })

    socket.on('conversation-call', ({ conversationId, participantId }) => {
        socket.to(participantId).emit('conversation-calling', { conversationId, senderId, receiverId })
    })

    //disconnect
    socket.on('disconnect', async () => {
        // const meetingId = socketToMeeting[socket.id];
        // let room = users[meetingId];
        // if (room) {
        //     room = room.filter(id => id !== socket.id);
        //     users[meetingId] = room;
        //     socket.broadcast.to(meetingId).emit('disconnected-meeting', socket.id);
        // }
        console.log(`disconnect with meetingId: ${socket.meetingId} ${socket.id}`)
        if (socket.meetingId) {
            let { message } = await outMeeting({
                meetingId: socket.meetingId,
                userId: socket.id
            })
            if (message) {
                let members = await getMemberMeeting({ meetingId: socket.meetingId });
                for (let m of members) {
                    socket.to(m.userId).emit('user-out-meeting', { meetingId: socket.meetingId, userId: socket.id });
                }
            }
        }
    });
}

module.exports = socketServer;