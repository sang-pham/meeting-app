import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useLocation, useHistory } from 'react-router-dom';
import { socketClient } from "../../utils";
import Peer from "simple-peer";
import './meeting.css';
import { Row, Col, Button } from "react-bootstrap";
import Video from "../../components/MeetingVideo";
import MeetingChatBox from "../../components/MeetingChatBox";
import MeetingUserList from "../../components/MeetingUserList";
import { isAuthenticated } from '../../store/reducers/user.reducer';
import {
    getTeamMessages,
    getTeamInfo,
} from '../../store/reducers/team.reducer'

function useQuery() {
    return new URLSearchParams(useLocation().search);
}


const Meeting = (props) => {
    let query = useQuery()
    const history = useHistory()
    const { teamId, meetingId } = useParams()
    const dispatch = useDispatch()
    const userReducer = useSelector(state => state.userReducer)
    const teamReducer = useSelector(state => state.teamReducer)
    const meetingReducer = useSelector(state => state.meetingReducer)
    const [peers, setPeers] = useState([]);
    const [isVideoActive, setIsVideoActive] = useState(query.get('video') == 'true' || false);
    const [isAudioActive, setIsAudioActive] = useState(query.get('audio') == 'true' || false);
    const [isEnableVideo, setIsEnableVideo] = useState(false);
    const [isEnableAudio, setIsEnableAudio] = useState(false);
    const [isMeetingEnd, setIsMeetingEnd] = useState(false);
    const userVideo = useRef();
    let peersRef = useRef([]);

    // const meetingId = props.match.params.meetingId;

    function getConnectedDevices(type, callback) {
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const filtered = devices.filter(device => device.kind === type);
                callback(filtered);
            });
    }

    useEffect(() => {
        if (!userReducer.loaded) {
            dispatch(isAuthenticated())
        }
        dispatch(getTeamInfo({ teamId }))

        socketClient.emit("join-meeting", { teamId, meetingId, userId: userReducer.user.id })

        getConnectedDevices('videoinput', (cameras) => {
            if (cameras.length) setIsEnableVideo(true);
        })

        getConnectedDevices('audioinput', (audios) => {
            if (audios.length) setIsEnableAudio(true);
        })

        // window.addEventListener('beforeunload', (ev) => {
        //     ev.preventDefault();
        //     console.log(meetingId, userReducer.user.id)
        //     socketClient.connect()
        //     //disconnect: true
        //     socketClient.emit('out-meeting', {
        //         userId: userReducer.user.id,
        //         meetingId
        //     })
        //     // socketClient.disconnect()
        //     return ev.returnValue = 'Are you sure you want to close?';
        // })

        return () => {
            setIsEnableAudio(false);
            setIsEnableVideo(false);
        }
    }, []);

    useEffect(() => {
        if (teamReducer.teamLoaded) {
            dispatch(getTeamMessages({
                teamId,
                offset: 0,
                num: 15
            }))

            let members = teamReducer.team.members
            if (localStorage.getItem('user')) {
                let userId = JSON.parse(localStorage.getItem('user')).id
                let member = members.find(member => member.id === userId)
                if (!member) {
                    history.push('/notfound')
                }
            } else {
                history.push('/notfound')
            }

            let meetings = teamReducer.team.meetings
            let meeting = meetings.find(meeting => meeting.id == meetingId)
            if (!meeting) {
                history.push(`/notfound`)
            }
            if (!meeting.active) {
                setIsMeetingEnd(true)
            }
            if (meeting.active) {
                (isEnableVideo || isEnableAudio) && navigator.mediaDevices.getUserMedia({ video: isEnableVideo, audio: isEnableAudio })
                    .then(stream => {
                        userVideo.current.srcObject = stream;
                        // socketClient.emit("join-meeting", meetingId);
                        socketClient.on("all-users", users => {
                            console.log(users);
                            const peers = [];
                            users.forEach(userID => {
                                const peer = createPeer(userID, socketClient.id, stream);
                                peersRef.current.push({
                                    peerID: userID,
                                    peer,
                                })
                                peers.push({
                                    peerID: userID,
                                    peer,
                                });
                            })
                            setPeers(peers);
                        })

                        // socketClient.on("joined-meeting", ({ signal, callerID }) => {
                        //     const peer = addPeer(signal, callerID, stream);
                        //     peersRef.current.push({
                        //         peerID: callerID,
                        //         peer,
                        //     })
                        //     setPeers(peers => [...peers, {
                        //         peerID: callerID,
                        //         peer,
                        //     }]);
                        // });

                        socketClient.on("receiving-returned-signal", ({ signal, callerID, userId }) => {
                            const item = peersRef.current.find(p => p.peerID === userId);
                            item.peer.signal(signal);
                        });



                        socketClient.on("disconnected-meeting", userId => {
                            console.log('disssconneccctteee')
                            const item = peersRef.current.find(p => p.peerID === userId);
                            item.peer.destroy()
                            console.log(item);
                            setPeers(peers => {
                                return peers.filter(p => p.peerID !== userId);
                            })

                        })
                    })
                    .catch(error => {
                        console.error('Error accessing media devices.', error);
                    })
                    .finally(() => {
                        if (isEnableVideo && !isVideoActive) {
                            userVideo.current && userVideo.current.srcObject.getVideoTracks().forEach(track => {
                                track.enabled = false
                            })
                        }
                        if (isEnableAudio && !isAudioActive) {
                            userVideo.current && userVideo.current.srcObject.getAudioTracks().forEach(track => {
                                track.enabled = false
                            })
                        }
                    })
            }
        }
    }, [teamReducer.teamLoaded])

    const createPeer = (userToSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            //server emit user joined
            socketClient.emit("sending-signal", { signal, callerID, userToSignal })
        })

        return peer;
    }

    const addPeer = (incomingSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })

        peer.on("signal", signal => {
            socketClient.emit("returning-signal", { signal, callerID })
        })

        peer.signal(incomingSignal);

        return peer;
    }

    const handleActiveVideo = () => {
        userVideo.current.srcObject.getVideoTracks().forEach(track => {
            track.enabled = !track.enabled
        })

        setIsVideoActive(!isVideoActive);
    }

    const handleActiveAudio = () => {
        userVideo.current.srcObject.getAudioTracks().forEach(track => {
            track.enabled = !track.enabled
        })
        let checkAudioActive = userVideo.current.srcObject.getAudioTracks()[0].enabled;
        console.log(checkAudioActive);
        // userVideo.current.srcObject.getAudioTracks()[0].enabled = !checkAudioActive;

        setIsAudioActive(!isAudioActive);
    }

    const handleVisibleChat = () => {
        if (isOpenUsers) {
            setIsOpenUsers(false);
        }

        if (isOpenInfo) {
            setIsOpenInfo(false);
        }
        setIsOpenChat(!isOpenChat);
    }

    const handleVisibleUsers = () => {
        if (isOpenChat) {
            setIsOpenChat(false);
        }

        if (isOpenInfo) {
            setIsOpenInfo(false);
        }
        setIsOpenUsers(!isOpenUsers);
    }

    const handleVisibleInfo = () => {
        if (isOpenUsers) {
            setIsOpenUsers(false);
        }

        if (isOpenChat) {
            setIsOpenChat(false);
        }
        setIsOpenInfo(!isOpenInfo);
    }

    const handleEndMeeting = () => {
        peers.map(peer => {
            peer.peer.destroy();
        })
        console.log(userVideo.current.srcObject)
        userVideo.current.srcObject.getTracks().forEach((track) => {
            console.log(track)
            track.stop();
        });
        socketClient.emit('disconnect-meeting');
        window.open("", "_self").close();
    }

    const [isOpenInfo, setIsOpenInfo] = useState(false);

    const [isOpenUsers, setIsOpenUsers] = useState(false);

    const [isOpenChat, setIsOpenChat] = useState(false);


    return (
        !isMeetingEnd ? <div className="room-meeting">
            <div className="room-content">
                <div className="users-content">
                    <div className="user-frame">
                        <video width="100%" height="100%" ref={userVideo} muted autoPlay />
                        {/* {!isVideoActive && <div style={{ width: "320px", height: "320px", color: "white", border: "2px solid white", textAlign: "center" }}>{socketClient.id}</div>} */}
                    </div>

                    {peers.length > 0 && peers.map((peerObj) => {
                        return (
                            <div key={peerObj.peerID} className="user-frame">
                                <Video peer={peerObj.peer} peerId={peerObj.peerID} />
                            </div>
                        );
                    })}

                </div>
                {isOpenChat && <MeetingChatBox chatVisible={handleVisibleChat} />}

                {isOpenUsers && <MeetingUserList usersVisible={handleVisibleUsers} members={meetingReducer.meeting.members} />}

                {isOpenInfo &&
                    <Col className="meeting-chatbox" md="4">
                        <div className="chatbox-header">
                            Info
                            <span>
                                <Button variant="outline-light" onClick={handleVisibleInfo}>
                                    <i style={{ color: "black" }} className="fas fa-times"></i>
                                </Button>
                            </span>
                        </div>
                        <div className="chatbox-content">

                        </div>
                    </Col>
                }

            </div>
            <Row className="btn-list">
                <Col md={{ span: 3, offset: 5 }} >
                    {
                        !isEnableVideo ?
                            <Button variant="outline-light" onClick={handleActiveVideo}
                                disabled={!isEnableVideo}
                            >
                                <i className="fas fa-video-slash"></i>
                            </Button>
                            :
                            <Button variant="outline-light" onClick={handleActiveVideo}>
                                {!isVideoActive ? <i className="fas fa-video-slash"></i> : <i className="fas fa-video"></i>}
                            </Button>
                    }

                    {
                        !isEnableAudio ?
                            <Button variant="outline-light" disabled={!isEnableAudio} onClick={handleActiveAudio}>
                                <i className="fas fa-microphone-slash"></i>
                            </Button>
                            :
                            <Button variant="outline-light" onClick={handleActiveAudio}>
                                {!isAudioActive ? <i className="fas fa-microphone-slash"></i> : <i className="fas fa-microphone"></i>}
                            </Button>
                    }

                    <Button variant="danger" onClick={handleEndMeeting}>
                        {/* <Link to="/"><i style={{ color: "white" }} className="fas fa-phone" ></i></Link> */}
                        <i style={{ color: "white" }} className="fas fa-phone" ></i>
                    </Button>
                </Col>

                <Col md={{ span: 2, offset: 2 }} >
                    <Button variant="outline-light" onClick={handleVisibleInfo} >
                        {isOpenInfo ? <i className="fas fa-question-circle"></i> : <i className="far fa-question-circle"></i>}
                    </Button>

                    <Button variant="outline-light" onClick={handleVisibleUsers} >

                        {isOpenUsers ? <i className="fas fa-user"></i> : <i className="far fa-user"></i>}
                    </Button>

                    <Button variant="outline-light" onClick={handleVisibleChat}>
                        {isOpenChat ? <i className="fas fa-comment-dots"></i> : <i className="far fa-comment-dots"></i>}
                    </Button>
                </Col>
            </Row>
        </div> : <div style={{
            background: "#202124",
            width: '100vw',
            height: '100vh',
            position: 'absolute',
            top: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column'
        }}>
            <h1 style={{ color: '#fff' }}>Meeting has already ended</h1>
            <div>
                <Button variant="primary" onClick={e => {
                    e.preventDefault()
                    window.open("", "_self").close();
                }}>
                    Close
                </Button>
            </div>
        </div>
    );
};

export default Meeting;