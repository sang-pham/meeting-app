import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Avatar, Button, Dialog, DialogActions,
  DialogTitle, Snackbar, Alert
} from '@mui/material'
import InviteUsersWrapper from '../../InviteUsersWrapper'
import { baseURL, socketClient } from '../../../utils'
import { cancelInviteUsers } from '../../../store/reducers/team.reducer'
import '../team-setting.css'

export default function TeamInvitedUsers() {
  const [isShow, setShow] = useState(false)
  const [selectedUser, setUser] = useState(null)
  const [message, setMessage] = useState({})
  const dispatch = useDispatch()
  const team = useSelector(state => state.teamReducer.team)

  useEffect(() => {
    if (selectedUser) {
      setMessage({
        type: 'success',
        content: 'Remove invitation successfully'
      })
      setUser(null)
    }
  }, [team.invitedUsers.length])

  const handleCancel = () => {
    // dispatch(cancelInviteUsers({
    //   userId: selectedUser,
    //   teamId: team.id
    // }))
    socketClient.emit('cancel-invitation', {
      userId: selectedUser,
      teamId: team.id
    })
    setShow(false)
  }

  const handleClose = () => setShow(false)

  return (
    <div>
      <InviteUsersWrapper />
      <div className='setting-user-list'>
        {team.invitedUsers.map(member => <div key={member.id} className='setting-user-item'>
          <div>
            <Avatar sx={{ width: '45px', height: '45px' }}
              src={`${baseURL}/api/user/avatar/${member.id}`} />
            <span>{member.userName}</span>
          </div>
          <Button variant='text'
            style={{ color: 'var(--icon-color)' }}
            onClick={e => {
              e.preventDefault()
              setShow(true)
              setUser(member.id)
            }} >Cancel</Button>
        </div>)}
      </div>
      <Dialog open={isShow} onClose={handleClose}>
        <DialogTitle style={{ backgroundColor: 'var(--primary-bg)' }}>Cancel invite this user ?</DialogTitle>
        <DialogActions style={{ backgroundColor: 'var(--primary-bg)' }}>
          <Button style={{ color: 'var(--icon-color)' }} onClick={handleClose}>Cancel</Button>
          <Button style={{ color: 'var(--icon-color)' }} onClick={handleCancel}>Confirm</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={message.content && message.content.length > 0} autoHideDuration={3000} onClose={e => setMessage({})}>
        <Alert severity={message.type}>
          {message.content}
        </Alert>
      </Snackbar>
    </div>
  )
}
