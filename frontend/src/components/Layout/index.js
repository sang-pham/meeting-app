import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, useRouteMatch, useHistory } from 'react-router-dom'
import Navbar from '../Navbar';
import { Avatar, Snackbar, IconButton, Tooltip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import MessageIcon from '@mui/icons-material/Message';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import { socketClient, baseURL } from '../../utils';
import { sendMessageCv, conversationCalling, cancelCall, removeMessageCv } from '../../store/reducers/conversation.reducer';
import {
  sendMessage, updateMeetingState, setMeetingActive, endActiveMeeting,
  clearMeetingJoined, getCurrentMeeting
} from '../../store/reducers/team.reducer';
import {
  getMeetingMembers, userJoinMeeting, userOutMeeting,
  sendMeetingMessage, meetingUserAudio
} from '../../store/reducers/meeting.reducer'
import './layout.css'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
// import Avatar from '../Avatar/index'

export default function Layout({ children }) {
  const dispatch = useDispatch();
  const team = useSelector(state => state.teamReducer.team)
  const userReducer = useSelector(state => state.userReducer)
  const meeting = useSelector(state => state.meetingReducer.meeting)
  let params = (useRouteMatch('/teams/:teamId/meeting/:meetingId') || {}).params
  const meetingId = params && Number(params.meetingId)
  const conversationCall = useSelector(state => state.conversationReducer.conversationCall);
  const [isSkConnected, setIsSkConnected] = useState(false);

  useEffect(() => {
    socketClient.auth = { userId: userReducer.user.id };
    socketClient.connect();
    setIsSkConnected(true);

    dispatch(getCurrentMeeting())

    //conversation
    socketClient.on('conversation-receiveMessage', ({ messageId, content, senderId, receiverId, conversationId, files, photos, createdAt }) => {
      dispatch(sendMessageCv({ messageId, content, senderId, receiverId, conversationId, files, photos, createdAt }));
    })

    socketClient.on('conversation-removed-message', ({ conversationId, messageId, receiverId, senderId }) => {
      dispatch(removeMessageCv({ conversationId, messageId, receiverId, senderId }))
    })

    socketClient.on('conversation-calling', ({ conversationId, senderId, senderName, receiverId }) => {
      //todo
      console.log('converstation calling')
      dispatch(conversationCalling({ conversationId, senderId, senderName, receiverId }))
    })

    socketClient.on('cancel-call', ({ conversationId, senderId, receiverId }) => {
      dispatch(cancelCall({ conversationId, senderId, receiverId }))
    })

    //teams
    socketClient.on('new-meeting-created', ({ meeting }) => {
      dispatch(setMeetingActive({
        meeting
      }))
    })

    socketClient.on('receive-message-team', ({ messageId, teamId, senderId, content, files, photos, createdAt }) => {
      dispatch(sendMessage({
        messageId, content, senderId, teamId, photos, files, isMessage: true, createdAt
      }))
    })

    //meetings
    //receive event when new user join meeting => emit state audio for new user 
    socketClient.on('user-join-meeting', ({ teamId, meetingId, user, isAudioActive }) => {
      dispatch(userJoinMeeting({ teamId, meetingId, user, isAudioActive }))
      socketClient.emit('', {

      })
    })

    socketClient.on('joined-meeting', ({ members, meetingId, teamId, isAudioActive }) => {
      dispatch(getMeetingMembers({
        members,
        meetingId,
        teamId,
        isAudioActive,
        userId: userReducer.user.id
      }))
    })

    socketClient.on('sent-message-meeting', ({ messageId, meetingId, senderId, content, photos, files, createdAt, teamId }) => {
      dispatch(sendMeetingMessage({
        messageId, content, senderId, meetingId, photos, files, createdAt
      }))
    })

    socketClient.on('receive-message-meeting', ({ messageId, meetingId, senderId, content, photos, files, teamId, createdAt }) => {
      dispatch(sendMeetingMessage({
        messageId, content, senderId, meetingId, photos, teamId, files, createdAt
      }))
    })

    socketClient.on('meeting-user-audio-changed', ({ userChangeAudio, isAudioActive, meetingId }) => {
      dispatch(meetingUserAudio({
        meetingId, userChangeAudio, isAudioActive
      }))
    })

    socketClient.on('user-out-meeting', ({ meetingId, userId }) => {
      dispatch(userOutMeeting({
        meetingId, userId
      }))
    })

    socketClient.on('own-out-meeting', ({ meetingId }) => {
      dispatch(clearMeetingJoined({ meetingId }))
    })

    socketClient.on('end-meeting', ({ meeting }) => {
      dispatch(endActiveMeeting({ meeting }))
    })

    socketClient.on("disconnect", () => {
      socketClient.connect();
      console.log('try to auto reconnect')
    });

    socketClient.on('connect_error', (error) => {
      console.log(error)
      setIsSkConnected(false)
    });

    socketClient.on('error', (error) => {
      console.log(error)
      setIsSkConnected(false)
    });

    console.log(socketClient);

    return () => {
      socketClient.disconnect();
    }
  }, [])

  const reconnectAction = (
    <React.Fragment>
      <Button color="secondary" size="small" onClick={e => {
        socketClient.connect();
        setIsSkConnected(true);
      }}>
        CONNECT
      </Button>

    </React.Fragment>
  )

  useEffect(() => {
    if (!socketClient.connected) {
      socketClient.connect();
    }
  }, [socketClient.connected])

  const handleCancelCall = () => {
    dispatch(cancelCall({
      conversationId: conversationCall.conversationId
    }))
    socketClient.emit('conversation-cancel-call', {
      conversationId: conversationCall.conversationId,
      senderId: userReducer.user.id, receiverId: conversationCall.senderId
    })
  };

  const handleAcceptCall = () => {
    dispatch(cancelCall({
      conversationId: conversationCall.conversationId
    }))
  };

  return (
    <>
      {!meetingId ? <>
        <Navbar />
        <div className="layout">
          <div className="list-selection">
            <NavLink exact to='/home' activeClassName="btn-active">
              <button className="btn-default" >
                <Tooltip title='Home' placement='right'>
                  <HomeIcon />
                </Tooltip>
              </button>
            </NavLink>
            <NavLink to='/conversations' activeClassName="btn-active">
              <button className="btn-default" >
                <Tooltip title='Messages' placement='right'>
                  <MessageIcon />
                </Tooltip>
              </button>

            </NavLink>
            <NavLink to='/teams' activeClassName="btn-active">
              <button className="btn-default">
                <Tooltip title='Teams' placement='right'>
                  <PeopleAltIcon />
                </Tooltip>
              </button>
            </NavLink>
            <NavLink to='/setting' activeClassName="btn-active">
              <button className="btn-default" >
                <Tooltip title='Setting' placement='right'>
                  <SettingsIcon />
                </Tooltip>
              </button>
            </NavLink>
          </div>
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>

            <div className="content-layout">
              {children}
            </div>
          </div>

          <Snackbar
            open={!isSkConnected}
            autoHideDuration={6000}
            message="Try to connect network"
            action={reconnectAction}
          />


          <Dialog
            fullWidth={true}
            maxWidth="xs"
            open={conversationCall.isRinging}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">
              Calling...
            </DialogTitle>
            <DialogContent>
              <div>
                <Avatar src={`${baseURL}/api/user/avatar/${conversationCall.senderId}`}
                  alt="user avatar"
                  style={{
                    width: '40px',
                    height: '40px',
                  }} />
                <span style={{ fontSize: '18px', fontWeight: 500 }}>{conversationCall.senderName}</span> is calling you...
              </div>

            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelCall} variant="contained" color="error">Reject</Button>
              <Button onClick={handleAcceptCall} variant="contained">
                Accept
              </Button>
            </DialogActions>
          </Dialog>

        </div>
      </> :
        <div>
          {children}
        </div>}
    </>
  )
}
