import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Navbar as Nav, Col, Row } from 'react-bootstrap'
import { Link, useHistory } from 'react-router-dom'
import { baseURL } from '../../utils'
import Dropdown from '../Dropdown'
import './navbar.css'
import { cleanTeamState } from '../../store/reducers/team.reducer'
import { cleanUser } from '../../store/reducers/user.reducer'
import { getNotifs, cleanNotificationState } from '../../store/reducers/notification.reducer'

export default function Navbar() {
  let user = useSelector(state => state.userReducer.user);
  const dispatch = useDispatch()
  const history = useHistory()
  const [isDropdown, setIsDropdown] = useState(false);

  let notifications = useSelector(state => state.notificationReducer.notifications)
  let numOf_UnReadNotifications = useSelector(state => state.notificationReducer.numOf_UnReadNotifications)
  useEffect(() => {
    dispatch(getNotifs(0))
    dispatch(cleanNotificationState)
  }, [])

  const handleLogout = e => {
    e.preventDefault()
    window.localStorage.removeItem('user')
    history.push('/login')
    dispatch(cleanTeamState({
      removeAll: true
    }))
    dispatch(cleanUser())
  }

  const handleNotif = e => {
    e.preventDefault()
    dispatch(getNotifs(notifications.length))
  }

  return (
    <Nav bg="dark" variant="dark" className="navbar">
      <Nav.Brand href="/" className="nav-brand">
        MEETING APP
      </Nav.Brand>
      <div className="navbar-btn">
        {/* <Dropdown
          style={{ marginRight: '30px' }}
          icon={
            <i style={{ color: '#fff', cursor: 'pointer', fontSize: '20px' }} className="fas fa-bell"></i>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {noti}
          </div>
        </Dropdown>

        <Dropdown
          style={{ marginRight: '20px' }}
          icon={
            <div className='nav-user-avatar'
              style={{ backgroundImage: `url("${baseURL}/api/user/avatar/${user.id}")` }}>
            </div>
          }
        >

          <Link to="/profile">Profile</Link>
          <a href="#">Link 2</a>
          <a href="#">Link 3</a>

        </Dropdown> */}
        <div className="dropdown" >
          <button className="dropdown-btn" style={{ color: "white" }} >
            <i className="fas fa-bell"></i>
            <span className="position-absolute top-3 start-100 translate-middle badge rounded-pill bg-danger">{numOf_UnReadNotifications}</span>
          </button>
          <div className="dropdown-content" style={{ minWidth: '300px' }}>
            {notifications.map((notification) => {
              let imgSrc = `${baseURL}/api/user/avatar/${notification.createdBy}`
              let style = {}
              let color = "#85C1E9"
              if (notification.isRead == 1) {
                style = {
                  'borderLeft': "4px solid var(--white)",
                }
              } else if (notification.isRead == 0) {
                style = {
                  'borderLeft': "4px solid #85C1E9",
                }
              }
              // let teamId = notification.teamId
              return (
                <Link to={notification.relativeLink} key={notification.id} style={style}>
                  <div/>
                  <img className="notificationImg" src={imgSrc} />
                  {notification.content}
                </Link>
              )
            })}
            <a href='#' onClick={handleNotif}>Older notifications...</a>
          </div>
        </div>

        <div className="dropdown" >
          <button className="dropdown-btn" style={{ color: "white", padding: 0 }}>
            <div className='nav-user-avatar'
              style={{ backgroundImage: `url("${baseURL}/api/user/avatar/${user.id}")` }} >
            </div>
          </button>
          <div className="dropdown-content">
            <Link to="/profile">Profile</Link>
            <a href="#">Link 2</a>
            <span onClick={handleLogout}>Logout</span>
          </div>
        </div>

        <strong className="navbar-username">{user.firstName}</strong>
      </div>
    </Nav >

  )
}
