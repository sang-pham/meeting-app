import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, useParams, useRouteMatch, useLocation } from 'react-router-dom'
import { getNotifs } from '../../store/reducers/notification.reducer'
import Navbar from '../Navbar';
import { socketClient, broadcastLocal } from '../../utils';
import { sendMessageCv } from '../../store/reducers/conversation.reducer';
import { sendMessage, updateMeetingState, getCurrentMeeting, outJoinedMeeting } from '../../store/reducers/team.reducer';
import {
  getMeetingMembers, userJoinMeeting, userOutMeeting,
  sendMeetingMessage
} from '../../store/reducers/meeting.reducer'
import './layout.css'

export default function Layout({ children }) {
  const dispatch = useDispatch();
  const team = useSelector(state => state.teamReducer.team)
  const userReducer = useSelector(state => state.userReducer)
  let params = (useRouteMatch('/teams/:teamId/meeting/:meetingId') || {}).params
  const meetingId = params && Number(params.meetingId)
  useEffect(() => {
    socketClient.auth = { userId: userReducer.user.id };
    socketClient.connect();

    //conversation
    socketClient.on('conversation-receiveMessage', ({ messageId, content, senderId, receiverId, conversationId, photo, createdAt }) => {
      dispatch(sendMessageCv({ messageId, content, senderId, receiverId, conversationId, photo, createdAt }));
      broadcastLocal.postMessage({ messageId, content, senderId, receiverId, conversationId, photo, createdAt })
    })

    socketClient.on('conversation-sentMessage', ({ messageId, content, senderId, receiverId, conversationId, photo, createdAt }) => {
      dispatch(sendMessageCv({ messageId, content, senderId, receiverId, conversationId, photo, createdAt }));
    })

    socketClient.on('conversation-calling', ({ conversationId, senderId, receiverId }) => {
      //todo
    })

    //teams
    socketClient.on('sent-message-team', ({ messageId, teamId, senderId, content, photo }) => {
      dispatch(sendMessage({
        messageId, content, senderId, teamId, photo
      }))
      // broadcastLocal.postMessage({ messageId, teamId, senderId, content, photo })
    })

    socketClient.on('receive-message-team', ({ messageId, teamId, senderId, content, photo }) => {
      dispatch(sendMessage({
        messageId, content, senderId, teamId, photo
      }))
    })

    //meetings
    socketClient.on('user-join-meeting', ({ teamId, meetingId, user }) => {
      dispatch(userJoinMeeting({ teamId, meetingId, user }))
    })

    socketClient.on('joined-meeting', ({ members, meetingId, teamId }) => {
      dispatch(getMeetingMembers({
        members,
        meetingId,
        teamId
      }))
    })

    socketClient.on('sent-message-meeting', ({ messageId, meetingId, senderId, content, photo }) => {
      dispatch(sendMeetingMessage({
        messageId, content, senderId, meetingId, photo
      }))
      // broadcastLocal.postMessage({ messageId, meetingId, senderId, content, photo, teamId })
    })

    socketClient.on('receive-message-meeting', ({ messageId, meetingId, senderId, content, photo }) => {
      dispatch(sendMeetingMessage({
        messageId, content, senderId, meetingId, photo
      }))
    })

    socketClient.on('user-out-meeting', ({ meetingId, userId }) => {
      dispatch(userOutMeeting({
        meetingId, userId
      }))
    })

    socketClient.on('end-meeting', ({ meetingId }) => {
      console.log(`end meeting with id, ${meetingId}`)
      broadcastLocal.postMessage({
        messageType: 'end-meeting',
        meetingId
      })
    })

    broadcastLocal.onmessage = (message) => {
      console.log(message);
      if (message.data === 'own-out-meeting') {
        setTimeout(() => {
          dispatch(outJoinedMeeting({}))
        }, 2000)
      }
      if (message.messageType === 'end-meeting') {
        dispatch(updateMeetingState({
          meetingId
        }))
      } else if (message.data.conversationId) {
        dispatch(sendMessageCv(message.data))
      } else if (message.data.teamId) {
        dispatch(sendMessage(message.data))
      }
    }

    socketClient.on("disconnect", () => {
      console.log('disconnect', socketClient)
      socketClient.connect();
    });

    console.log('call layout')

    dispatch(getCurrentMeeting())

    return () => {
      socketClient.disconnect();
    }
  }, [])
  return (
    <>
      {!meetingId ? <>
        <Navbar />
        <div className="layout">
          <div className="list-selection">
            <div className="btn-list-selection">
              <NavLink exact to='/' activeClassName="btn-active">
                <button className="btn-default" ><i className="fas fa-home"></i></button>
              </NavLink>
            </div>
            {/* <div className="btn-list-selection">
              <NavLink to="/activities" activeClassName="btn-active">
                <button className="btn-default" >Activity</button>
              </NavLink>
            </div> */}
            <div className="btn-list-selection">
              <NavLink to='/conversations' activeClassName="btn-active">
                <button className="btn-default" ><i className="fas fa-comment-dots"></i></button>

              </NavLink>
            </div>
            <div className="btn-list-selection">
              <NavLink to='/teams' activeClassName="btn-active">
                <button className="btn-default"><i className="fas fa-users"></i></button>
              </NavLink>
            </div>
            <div className="btn-list-selection">
              <NavLink to='/setting' activeClassName="btn-active">
                <button className="btn-default" ><i className="fas fa-cog"></i></button>
              </NavLink>
            </div>
          </div>
          <div className="content-layout">
            {children}
          </div>
        </div>
      </> :
        <div>
          {children}
        </div>}
    </>
  )
}
