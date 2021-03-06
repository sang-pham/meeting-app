import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import InviteUsersWrapper from '../../InviteUsersWrapper'
import {
  Avatar, Button, Dialog, DialogActions,
  DialogTitle, Snackbar, Alert
} from '@mui/material'
import { removeMember } from '../../../store/reducers/team.reducer'
import { baseURL, socketClient } from '../../../utils'
import '../team-setting.css'

export default function TeamMembers() {
  const [isShow, setShow] = useState(false)
  const [selectedUser, setUser] = useState(null)
  const [message, setMessage] = useState({})
  const dispatch = useDispatch()
  const team = useSelector(state => state.teamReducer.team)
  const user = useSelector(state => state.userReducer.user)

  const handleRemove = () => {
    // dispatch(removeMember({
    //   userId: selectedUser,
    //   teamId: team.id
    // }))
    socketClient.emit('team-remove-member', {
      teamId: team.id,
      userId: selectedUser
    })
    setShow(false)
  }

  useEffect(() => {
    if (selectedUser) {
      setMessage({
        type: 'success',
        content: 'Remove member successfully'
      })
      setUser(null)
    }
  }, [team.members.length])

  const handleClose = () => setShow(false)

  return (
    <div>
      <InviteUsersWrapper />
      <div className='setting-user-list'>
        {team.members.map(member => <div key={member.id} className='setting-user-item'>
          <div>
            <Avatar sx={{ width: '45px', height: '45px' }}
              src={`${baseURL}/api/user/avatar/${member.id}`} />
            <span style={{
              fontSize: '16px',
              fontWeight: 500
            }}>{member.userName}</span>
          </div>
          {member.id !== user.id && <Button variant='text'
            style={{ color: 'var(--icon-color)' }}
            onClick={e => {
              e.preventDefault()
              setShow(true)
              setUser(member.id)
            }}>Remove</Button>}
        </div>)}
      </div>
      <Dialog open={isShow} onClose={handleClose}>
        <DialogTitle style={{ backgroundColor: 'var(--primary-bg)' }}>Remove this user from team?</DialogTitle>
        <DialogActions style={{ backgroundColor: 'var(--primary-bg)' }}>
          <Button style={{ color: 'var(--icon-color)' }} onClick={handleClose}>Cancel</Button>
          <Button style={{ color: 'var(--icon-color)' }} onClick={handleRemove}>Confirm</Button>
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
