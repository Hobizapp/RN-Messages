import { call, put } from 'redux-saga/effects';
import MessageActions from '../Redux/MessageRedux';

// get account setting details
export function* getUserListConversation(api, action) {
  const { data, token } = action;
  try {
    const response = yield call(api.getUserListConversation, data, token);
    if (response.data.response) {
      yield put(MessageActions.getUserListConversationSuccess(response.data.data));
    } else {
      yield put(MessageActions.getUserListConversationFailure(response.data.message));
    }
  } catch (e) {
    yield put(MessageActions.getUserListConversationFailure('failure'));
  }
}

// get user chat
export function* getUserChat(api, action) {
  const { data, token } = action;
  try {
    const response = yield call(api.getUserChat, data, token);
    if (response.data.response) {
      yield put(MessageActions.getUserChatSuccess(response.data.data));
    } else {
      yield put(MessageActions.getUserChatFailure(response.data.message));
    }
  } catch (e) {
    yield put(MessageActions.getUserChatFailure('failure'));
  }
}

// get user group chat
export function* getUserGroupChat(api, action) {
  const { data, token } = action;
  try {
    const response = yield call(api.getUserGroupChat, data, token);
    if (response.data.response) {
      yield put(MessageActions.getUserGroupChatSuccess(response.data.data));
    } else {
      yield put(MessageActions.getUserGroupChatFailure(response.data.message));
    }
  } catch (e) {
    yield put(MessageActions.getUserGroupChatFailure('failure'));
  }
}

// send user message
export function* sendMessage(api, action) {
  const { data, token } = action;
  try {
    const response = yield call(api.sendMessage, data, token);
    if (response.data.response) {
      yield put(MessageActions.sendMessageSuccess(response.data.data));
    } else {
      yield put(MessageActions.sendMessageFailure(response.data.message));
    }
  } catch (e) {
    yield put(MessageActions.sendMessageFailure('failure'));
  }
}

// send group message
export function* sendGroupMessage(api, action) {
  const { data, token } = action;
  try {
    const response = yield call(api.sendGroupMessage, data, token);
    if (response.data.response) {
      yield put(MessageActions.sendGroupMessageSuccess(response.data.data));
    } else {
      yield put(MessageActions.sendGroupMessageFailure(response.data.message));
    }
  } catch (e) {
    yield put(MessageActions.sendGroupMessageFailure('failure'));
  }
}

export function* markMessageRead(api, action) {
  const { data, token } = action;
  try {
    const response = yield call(api.markMessageRead, data, token);
    if (response.data.response) {
      yield put(MessageActions.markMessageReadSuccess(response.data.data));
    } else {
      yield put(MessageActions.markMessageReadFailure(response.data.message));
    }
  } catch (e) {
    yield put(MessageActions.markMessageReadFailure('failure'));
  }
}

export function* deleteMessage(api, action) {
  const { data, token } = action;
  try {
    const response = yield call(api.deleteMessage, data, token);
    if (response.data.response) {
      yield put(MessageActions.deleteMessageSuccess(response.data.message));
    } else {
      yield put(MessageActions.deleteMessageFailure(response.data.message));
    }
  } catch (e) {
    yield put(MessageActions.deleteMessageFailure('failure'));
  }
}


export function* muteChat(api, action) {
  const { data, token } = action;
  try {
    const response = yield call(api.muteChat, data, token);
    if (response.data.response) {
      yield put(MessageActions.muteChatSuccess(response.data.message));
    } else {
      yield put(MessageActions.muteChatFailure(response.data.message));
    }
  } catch (e) {
    yield put(MessageActions.muteChatFailure('failure'));
  }
}