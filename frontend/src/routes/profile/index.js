import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	Tabs, Tab, Typography, Box, Avatar, TextField,
	Button
} from '@mui/material';
import { baseURL } from '../../utils';
import { Link } from 'react-router-dom';
import { updateBasicUserInfo } from '../../store/reducers/user.reducer'
import { getJoinedTeams, getInvitedTeams, getRequestTeams } from '../../store/reducers/team.reducer'
import './profile.css';

function TabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`vertical-tabpanel-${index}`}
			aria-labelledby={`vertical-tab-${index}`}
			{...other}
		>
			{value === index && (
				<Box sx={{ p: 3 }}>
					<Typography>{children}</Typography>
				</Box>
			)}
		</div>
	);
}

function a11yProps(index) {
	return {
		id: `vertical-tab-${index}`,
		'aria-controls': `vertical-tabpanel-${index}`,
	};
}

export default function Profile() {
	const dispatch = useDispatch()
	const teamReducer = useSelector(state => state.teamReducer)
	const userReducer = useSelector(state => state.userReducer)
	const [currentTab, setCurrentTab] = useState(0);
	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [image, setImage] = useState('')
	const [imageUrl, setImageUrl] = useState('')

	useEffect(() => {
		setFirstName(userReducer.user.firstName)
		setLastName(userReducer.user.lastName)
		if (!teamReducer.joinedTeamLoaded) {
			dispatch(getJoinedTeams())
		}
		if (!teamReducer.requestTeamLoaded) {
			dispatch(getRequestTeams())
		}
		if (!teamReducer.invitedTeamLoaded) {
			dispatch(getInvitedTeams())
		}
	}, [])

	const handleTabChange = (event, newValue) => {
		setCurrentTab(newValue);
	};

	const handleImageChange = (e) => {
		setImage(e.target.files[0])
		let reader = new FileReader()
		let url = reader.readAsDataURL(e.target.files[0])
		reader.onloadend = e => {
			setImageUrl(reader.result)
		}
	}

	const cancelChange = () => {
		setFirstName(userReducer.user.firstName)
		setLastName(userReducer.user.lastName)
		setImageUrl('')
		setImage('')
	}

	const handleSave = () => {
		let formData = new FormData()
		formData.append('firstName', firstName)
		formData.append('lastName', lastName)
		formData.append('avatar', image)
		dispatch(updateBasicUserInfo({
			form: formData,
			userId: userReducer.user.id
		}))
	}

	const isDisableSave = () => {
		return firstName === userReducer.user.firstName && lastName === userReducer.user.lastName
			&& !imageUrl;
	}

	return (
		<div className='profile-layout'>
			<Tabs
				orientation="vertical"
				value={currentTab}
				onChange={handleTabChange}
				aria-label="Vertical tabs example"
				sx={{ borderRight: 1, borderColor: 'divider', height: 195 }}
			>
				<Tab label="Profile" {...a11yProps(0)} />
				<Tab label="Joined Teams" {...a11yProps(1)} />
				<Tab label="Invited Teams" {...a11yProps(2)} />
				<Tab label="Requesting Teams" {...a11yProps(3)} />
			</Tabs>
			<div style={{ minWidth: '500px', justifyContent: 'center' }}>
				<TabPanel value={currentTab} index={0}>
					<div>
						<div>
							<div className='profile-avatar-container'>
								<Avatar
									key={userReducer.user.avatar}
									alt="Remy Sharp"
									src={imageUrl || `${baseURL}/api/user/avatar/${userReducer.user.id}`}
									sx={{ width: 200, height: 200, margin: 'auto', border: '5px solid #f7f7f7' }} />
								<label className='new-avatar-btn' htmlFor='newAvatar'><i className="fas fa-camera"></i></label>
								<input id="newAvatar" type="file" accept='image/*' style={{ display: 'none' }}
									onChange={handleImageChange}></input>
							</div>
						</div>
						<TextField fullWidth label="Email" id="email" margin="dense"
							variant="standard" value={userReducer.user.email} disabled />
						<TextField fullWidth label="First Name" id="firstName" margin="dense"
							variant="standard" value={firstName} onChange={e => setFirstName(e.target.value)} />
						<TextField fullWidth label="Last Name" id="lastName" margin="dense"
							variant="standard" value={lastName} onChange={e => setLastName(e.target.value)} />
						<div style={{ marginTop: '15px', textAlign: 'right' }}>
							<Button variant="text" disabled={isDisableSave()} onClick={handleSave}>Save</Button>
							<Button variant="text" onClick={cancelChange}>Cancel</Button>
						</div>
					</div>
				</TabPanel>
				<TabPanel value={currentTab} index={1}>
					<div>
						{teamReducer.joinedTeams.length > 0 ?
							teamReducer.joinedTeams.map(team => {
								return <Link key={team.id} style={{ margin: '10px', display: 'flex', alignItems: 'center' }}
									to={`/teams/${team.id}`}>
									<Avatar alt="team coverphoto"
										src={`${baseURL}/api/team/coverphoto/${team.id}")`}
										sx={{ width: 50, height: 50, }} />
									<p style={{ margin: 0, marginLeft: '10px' }}>{team.name}</p>
								</Link>
							})
							: <h1>No team for show</h1>}
					</div>
				</TabPanel>
				<TabPanel value={currentTab} index={2}>
					<div>
						{teamReducer.invitedTeams.length > 0 ?
							teamReducer.invitedTeams.map(team => {
								return <Link key={team.id} style={{ margin: '10px', display: 'flex', alignItems: 'center' }}
									to={`/teams/${team.id}`}>
									<Avatar alt="team coverphoto"
										src={`${baseURL}/api/team/coverphoto/${team.id}")`}
										sx={{ width: 50, height: 50, }} />
									<p style={{ margin: 0, marginLeft: '10px' }}>{team.name}</p>
								</Link>
							})
							: <h1>No invited team for show</h1>}
					</div>
				</TabPanel>
				<TabPanel value={currentTab} index={3}>
					<div>
						{teamReducer.requestingTeams.length > 0 ?
							teamReducer.requestingTeams.map(team => {
								return <Link key={team.id} style={{ margin: '10px', display: 'flex', alignItems: 'center' }}
									to={`/teams/${team.id}`}>
									<Avatar alt="team coverphoto"
										src={`${baseURL}/api/team/coverphoto/${team.id}")`}
										sx={{ width: 50, height: 50, }} />
									<p style={{ margin: 0, marginLeft: '10px' }}>{team.name}</p>
								</Link>
							})
							: <h1>No request team for show</h1>}
					</div>
				</TabPanel>
			</div>
		</div>
	)
}
