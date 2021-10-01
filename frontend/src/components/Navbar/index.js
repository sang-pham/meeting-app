import React from 'react'
import { useSelector } from 'react-redux'
import { Container, Navbar as Nav, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { baseURL } from '../../utils'
import Dropdown from '../Dropdown'
import './navbar.css'

export default function Navbar() {
  let user = useSelector(state => state.userReducer.user)
  return (
    <Nav bg="dark" variant="dark" className="navbar">
      <Nav.Brand href="/" className="nav-brand">
        MEETING APP
      </Nav.Brand>

      <div className="navbar-btn">
        <Dropdown
          style={{ marginRight: '20px' }}
          icon={
            <button className="dropdown-btn" style={{ color: "white" }}>
              <i style={{ color: '#fff', cursor: 'pointer', fontSize: '20px' }} className="fas fa-bell"></i>
            </button>}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Link to="/profile">Profile</Link>
            <a href="#">Link 2</a>
            <a href="#">Link 3</a>
          </div>
        </Dropdown>

        <Dropdown
          style={{ marginRight: '30px' }}
          icon={
            <button style={{ background: 'transparent', border: 'none' }}>
              <div className='nav-user-avatar'
                style={{ backgroundImage: `url("${baseURL}/api/user/avatar/${user.id}")` }}>
              </div>
            </button>}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Link to="/profile">Profile</Link>
            <a href="#">Link 2</a>
            <a href="#">Link 3</a>
          </div>
        </Dropdown>

        <strong className="navbar-username">{user.firstName}</strong>
      </div>
    </Nav >

  )
}
