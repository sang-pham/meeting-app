import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './conversations.css';
import { axiosAuth } from '../../utils';
import { getConversations, createConversation, clearConversation } from '../../store/reducers/conversation.reducer';
import { Switch, Route, useParams, useHistory } from "react-router-dom";
import Avatar from '../../components/Avatar';
import ConversationChat from './ConversationChat';
import ConversationLink from './ConversationLink';
import SearchIcon from '@mui/icons-material/Search';
import LoadingButton from '@mui/lab/LoadingButton';
import _ from 'lodash'


export default function Conversations(props) {
    const [textSearch, setTextSearch] = useState('');
    const [searchUsers, setSearchUsers] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const user = useSelector(state => state.userReducer.user);
    const settingReducer = useSelector(state => state.settingReducer)
    const conversations = useSelector(state => state.conversationReducer.conversations);
    const dispatch = useDispatch();
    const history = useHistory();
    useEffect(() => {
        dispatch(getConversations());
        return () => {
            dispatch(clearConversation())
        }
    }, [])

    const searchDebounce = useCallback(_.debounce(async (searchUserName) => {
        if (searchUserName !== '') {
            let response = await axiosAuth.post('/api/users/search', {
                text: searchUserName
            })
            setSearchUsers(response.data.users)
            setSearchLoading(false);
        }
    }, 300), [])

    const onSearch = (event) => {
        let searchUserName = event.target.value.trim();
        setTextSearch(event.target.value)
        searchDebounce(searchUserName)
        setSearchLoading(true)
        setSearchUsers([]);
    }

    const handleChooseUser = (userFind) => {
        setSearchUsers([]);
        setTextSearch('');


        const participant = conversations.find(conv => conv.participantId === userFind.id);
        if (!participant) {
            dispatch(createConversation({ conversationId: null, participantId: userFind.id, participantName: userFind.userName }));
        }


        history.replace(`/conversations/${userFind.id}`);
    }

    return (
        <div className="conversation-page"
            onClick={e => {
                // e.preventDefault();
                // e.stopPropagation();
                setSearchUsers([])
                setTextSearch('')
            }}
        >
            <div className="conversation-list">
                <div className="search-user" style={{
                    border: '1px solid var(--gray-shadow)'
                }}>
                    <SearchIcon style={{ color: 'var(--icon-color)' }} />
                    <input
                        placeholder="Search"
                        className="input-search"
                        aria-label="Search"
                        onChange={onSearch}
                        onClick={e => {
                            e.stopPropagation();
                        }}
                        value={textSearch}
                    />
                    {textSearch.length > 0 &&
                        <div className="search-list" >
                            {
                                searchUsers.length > 0 ?
                                    searchUsers.map(userFind => {
                                        return (
                                            <div key={userFind.id} className="user-find" onClick={event => handleChooseUser(userFind, event)}>
                                                <Avatar width="40px" height="40px" userId={userFind.id} />
                                                <div style={{ marginLeft: "15px", display: 'flex', flexDirection: 'column' }}>
                                                    <span>{userFind.userName}</span>
                                                    <span style={{ opacity: '0.7' }}>{userFind.email}</span>
                                                </div>
                                            </div>
                                        )
                                    })
                                    :
                                    <>
                                        <LoadingButton loading={searchLoading} variant="text" />
                                        <div style={{ display: searchLoading && 'none', fontWeight: '600' }}>
                                            <span>No user found</span>
                                        </div>
                                    </>
                            }

                        </div>
                    }
                </div>

                <div className="conversation-user">
                    {
                        conversations.map(conv => {
                            return <ConversationLink
                                key={conv.participantId}
                                conversation={conv}
                                user={user}
                            />
                        })
                    }
                </div>
            </div >
            <div className="conversation-content">
                {props.params === '/conversations' ?
                    <div className="conversation-welcome">
                        <h3>{settingReducer.darkMode ? 'Wake up and start conversation now' : 'Start conversation with friends'}</h3>
                        <img width="600" height="600" src={settingReducer.darkMode ? 'conversation.svg' : 'conversation1.svg'} />
                    </div>
                    :
                    <Switch>
                        {
                            conversations.map(conver => {
                                return (
                                    <Route path={`/conversations/${conver.participantId}`} key={conver.participantId}>
                                        <ConversationChat
                                            conversation={conver}
                                            user={user}
                                        />
                                    </Route>
                                )
                            })
                        }
                    </Switch>
                }

            </div>
        </div >
    )
}


