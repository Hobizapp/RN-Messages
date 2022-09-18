import { createReducer, createActions } from 'reduxsauce';
import Immutable from 'seamless-immutable';

const { Types, Creators } = createActions({
  getUserListConversationRequest: ['data', 'token'],
  getUserListConversationSuccess: ['conversation'],
  getUserListConversationFailure: ['message'],

  getUserChatRequest: ['data', 'token'],
  getUserChatSuccess: ['userChat'],
  getUserChatFailure: ['message'],

  sendMessageRequest: ['data', 'token'],
  sendMessageSuccess: ['data'],
  sendMessageFailure: ['message'],

  sendGroupMessageRequest: ['data', 'token'],
  sendGroupMessageSuccess: ['data'],
  sendGroupMessageFailure: ['message'],

  getUserGroupChatRequest: ['data', 'token'],
  getUserGroupChatSuccess: ['userGroupChat'],
  getUserGroupChatFailure: ['message'],

  markMessageReadRequest: ['data', 'token'],
  markMessageReadSuccess: [''],
  markMessageReadFailure: [''],

  receivedNewMessage: ['newMessage'],

  deleteMessageRequest: ['data', 'token'],
  deleteMessageSuccess: ['message'],
  deleteMessageFailure: ['message'],

  muteChatRequest: ['data', 'token'],
  muteChatSuccess: ['message'],
  muteChatFailure: ['message'],
});

export const MessageTypes = Types;
export default Creators;

/* ------------- Initial State ------------- */

export const INITIAL_STATE = Immutable({
  conversation: '',
  messages: '',
  message: '',
  userChat: '',
  userGroupChat: '',
  fetching: false,
  chatFetching: false,
  error: null,
  newMessage: '',
  deleteMessage: '',
  deleteSuccess: false,
  messageData: '',
  messageSent: false,
  groupMessageData: '',
  groupMessageSent: false,
  muteMessage: '',
});

/* ------------- Selectors ------------- */

export const MessageSelectors = {
  selectHobbies: state => state.user,
};

/* ------------- Reducers ------------- */

//  redux for get list of conversation
export const getUserListConversationRequest = (state, action) => {
  const { data, token } = action;
  return state.merge({
    fetching: true, error: false, message: '', data, token,
  });
};

export const getUserListConversationSuccess = (state, action) => {
  const { conversation } = action;
  return state.merge({ fetching: false, error: false, conversation });
};

export const getUserListConversationFailure = (state, action) => {
  const { message } = action;
  return state.merge({ fetching: false, error: false, message });
};

//  redux for get user chat
export const getUserChatRequest = (state, action) => {
  const { data, token } = action;
  return state.merge({
    chatFetching: true, fetching: true, error: false, message: '', data, token,
  });
};

export const getUserChatSuccess = (state, action) => {
  const { userChat } = action;
  return state.merge({ chatFetching: false, fetching: false, error: false, userChat });
};

export const getUserChatFailure = (state, action) => {
  const { message } = action;
  return state.merge({ chatFetching: false, fetching: false, error: false, message });
};

//  redux for sent message
export const sendMessageRequest = (state, action) => {
  const { data, token } = action;
  return state.merge({
    fetching: true, error: false, message: '', data, token, messageData: '', messageSent: false
  });
};

export const sendMessageSuccess = (state, action) => {
  const { data } = action;
  return state.merge({ fetching: false, error: false, messageData: data });
};

export const sendMessageFailure = (state, action) => {
  const { message } = action;
  return state.merge({ fetching: false, error: false, message, messageData: '', messageSent: false });
};

//  redux for sent group message
export const sendGroupMessageRequest = (state, action) => {
  const { data, token } = action;
  return state.merge({
    fetching: true, error: false, message: '', data, token, groupMessageData: '', groupMessageSent: false
  });
};

export const sendGroupMessageSuccess = (state, action) => {
  const { data } = action;
  return state.merge({ fetching: false, error: false, groupMessageSent: true, groupMessageData: data });
};

export const sendGroupMessageFailure = (state, action) => {
  const { message } = action;
  return state.merge({ fetching: false, error: false, message, groupMessageData: '', groupMessageSent: false });
};


//  redux for get user group chat
export const getUserGroupChatRequest = (state, action) => {
  const { data, token } = action;
  return state.merge({
    chatFetching: true, fetching: true, error: false, message: '', data, token,
  });
};

export const getUserGroupChatSuccess = (state, action) => {
  const { userGroupChat } = action;
  return state.merge({ chatFetching: false, fetching: false, error: false, userGroupChat });
};

export const getUserGroupChatFailure = (state, action) => {
  const { message } = action;
  return state.merge({ chatFetching: false, fetching: false, error: false, message });
};

//  redux for sent group message
export const markMessageReadRequest = (state, action) => {
  const { data, token } = action;
  return state.merge({
    fetching: true, error: false, message: '', data, token,
  });
};

export const markMessageReadSuccess = (state, action) => {
  return state.merge({ fetching: false, error: false });
};

export const markMessageReadFailure = (state, action) => {
  const { message } = action;
  return state.merge({ fetching: false, error: false, message });
};

export const receivedNewMessage = (state, action) => {
  const { newMessage } = action;
  return state.merge({ fetching: false, error: false, newMessage });
};

//  redux for sent message
export const deleteMessageRequest = (state, action) => {
  const { data, token } = action;
  return state.merge({
    fetching: true, error: false, message: '', data, token, deleteMessage: '', deleteSuccess: false
  });
};

export const deleteMessageSuccess = (state, action) => {
  const { message } = action;
  return state.merge({ fetching: false, error: false, deleteMessage: message, deleteSuccess: true });
};

export const deleteMessageFailure = (state, action) => {
  const { message } = action;
  return state.merge({ fetching: false, error: false, deleteMessage: message, deleteSuccess: false });
};

export const muteChatRequest = (state, action) => {
  const { data, token } = action;
  return state.merge({
    fetching: true, error: false,
  });
};

export const muteChatSuccess = (state, action) => {
  const { message } = action;
  return state.merge({ fetching: false, error: false,  muteMessage: message});
};

export const muteChatFailure = (state, action) => {
  const { message } = action;
  return state.merge({ fetching: false, error: false, muteMessage: message });
};

export const reducer = createReducer(INITIAL_STATE, {
  [Types.GET_USER_LIST_CONVERSATION_REQUEST]: getUserListConversationRequest,
  [Types.GET_USER_LIST_CONVERSATION_SUCCESS]: getUserListConversationSuccess,
  [Types.GET_USER_LIST_CONVERSATION_FAILURE]: getUserListConversationFailure,

  [Types.GET_USER_CHAT_REQUEST]: getUserChatRequest,
  [Types.GET_USER_CHAT_SUCCESS]: getUserChatSuccess,
  [Types.GET_USER_CHAT_FAILURE]: getUserChatFailure,

  [Types.GET_USER_GROUP_CHAT_REQUEST]: getUserGroupChatRequest,
  [Types.GET_USER_GROUP_CHAT_SUCCESS]: getUserGroupChatSuccess,
  [Types.GET_USER_GROUP_CHAT_FAILURE]: getUserGroupChatFailure,

  [Types.SEND_MESSAGE_REQUEST]: sendMessageRequest,
  [Types.SEND_MESSAGE_SUCCESS]: sendMessageSuccess,
  [Types.SEND_MESSAGE_FAILURE]: sendMessageFailure,

  [Types.SEND_GROUP_MESSAGE_REQUEST]: sendGroupMessageRequest,
  [Types.SEND_GROUP_MESSAGE_SUCCESS]: sendGroupMessageSuccess,
  [Types.SEND_GROUP_MESSAGE_FAILURE]: sendGroupMessageFailure,

  [Types.MARK_MESSAGE_READ_REQUEST]: markMessageReadRequest,
  [Types.MARK_MESSAGE_READ_SUCCESS]: markMessageReadSuccess,
  [Types.MARK_MESSAGE_READ_FAILURE]: markMessageReadFailure,

  [Types.RECEIVED_NEW_MESSAGE]: receivedNewMessage,

  [Types.DELETE_MESSAGE_REQUEST]: deleteMessageRequest,
  [Types.DELETE_MESSAGE_SUCCESS]: deleteMessageSuccess,
  [Types.DELETE_MESSAGE_FAILURE]: deleteMessageFailure,

  [Types.MUTE_CHAT_REQUEST]: muteChatRequest,
  [Types.MUTE_CHAT_SUCCESS]: muteChatSuccess,
  [Types.MUTE_CHAT_FAILURE]: muteChatFailure,
});
