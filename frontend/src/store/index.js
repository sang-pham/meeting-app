import { configureStore } from '@reduxjs/toolkit';
import meetingReducer from './reducers/meeting.reducer';
import userReducer from './reducers/user.reducer';
import conversationReducer from './reducers/conversation.reducer';
import teamReducer from './reducers/team.reducer';
import notificationReducer from './reducers/notification.reducer';
import settingReducer from './reducers/setting.reducer';

const store = configureStore({
  reducer: {
    meetingReducer,
    userReducer,
    conversationReducer,
    teamReducer,
    notificationReducer,
    settingReducer
  }
})

export default store