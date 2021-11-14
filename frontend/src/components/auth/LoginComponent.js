import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import {
    TextField, Button, Snackbar, Alert
} from '@mui/material';
import { useHistory } from "react-router";
import { Link, Redirect } from "react-router-dom";
import Loading from "../Loading";
import { isAuthenticated, signin } from "../../store/reducers/user.reducer";
import './auth.css'
// import "frontend/src/App.css";

export default function Login() {
    const userReducer = useSelector(state => state.userReducer)
    const dispatch = useDispatch()
    const history = useHistory()

    useEffect(() => {
        if (!userReducer.loaded) {
            dispatch(isAuthenticated())
        } else {
            if (userReducer.authenticated) {
                history.push('/home')
            } else if (userReducer.error) {
                setLoginError(userReducer.error)
            } else {
                if (!userReducer.authenticated) {
                    dispatch(isAuthenticated())
                }
            }
        }
    }, [userReducer.authenticated, userReducer.error, userReducer.loaded])

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(signin({ email, password }))
    }

    return (
        !userReducer.loaded ? <Loading />
            : (userReducer.authenticated ? <Redirect to="/home" />
                : <div className="auth-page">
                    <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Meeting App</h1>
                    <form onSubmit={handleSubmit} className="auth-form">
                        <TextField
                            type="email"
                            name="email"
                            value={email}
                            variant="standard"
                            required
                            label="Email"
                            onChange={(e) => setEmail(e.target.value)} />
                        <TextField
                            type="password"
                            name="password"
                            label="Password"
                            required
                            value={password}
                            variant="standard"
                            onChange={(e) => setPassword(e.target.value)} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <p style={{ marginBottom: 0 }}>
                                Don't have account?{"\t"}
                                <Link to="/signup" style={{ display: 'inline-block' }}>Sign up here</Link>
                            </p>
                            <Button type="submit" variant="contained"
                                disabled={!email || !password}>Log in</Button>
                        </div>
                    </form> <br /> <br />
                    <Snackbar open={loginError.length > 0} autoHideDuration={3000} onClose={e => setLoginError('')}>
                        <Alert severity="error">
                            {loginError}
                        </Alert>
                    </Snackbar>
                </div>
            )
    )
}