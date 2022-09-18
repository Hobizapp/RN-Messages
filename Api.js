// a library to wrap and simplify api calls
import apisauce from 'apisauce';
import { AsyncStorage, I18nManager } from 'react-native';
import NetInfo from "@react-native-community/netinfo";
import Toast from 'react-native-simple-toast';
import DeviceInfo from 'react-native-device-info'
import { handleResponse } from '../Transforms/utils'
import { strings } from '../I18n/I18n';
import Config from "react-native-config";

// Staging: "http://137.135.92.227:8081/api/"
// Local: "http://192.168.1.236:8081/api/"
// const User = (baseURL = 'http://137.135.92.227:8081/api/') => {
//const User = (baseURL = 'http://52.59.41.142:8080/hobiz/api/') => {
// const User = (baseURL = 'https://hobizapp.com:8080/hobiz/api/') => {
const User = (baseURL = Config.API_URL) => {
  const api = apisauce.create({
    baseURL,
    timeout: 60000,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': I18nManager.isRTL ? 'iw' : 'en'
    }
  })
  // For Monitoring the status and handele the errors
  api.addMonitor(response => {
    handleResponse(response);
  });

  api.addAsyncRequestTransform(request => async () => {
    const userNetConnection = await AsyncStorage.getItem("netConnection");
    let netConnection = await NetInfo.fetch();
    if (userNetConnection === "WIFI_ONLY" && request.url != "user/generalSetting" && request.url != "user/getgeneralSetting") {
      if (netConnection.type !== "wifi") {
        Toast.show(strings("You_are_currently_on_Mobile_data_Please_change_network_settings_to_wifi_and_data_connection_from_General_Settings"))
        return new Promise.reject()
      } else {
        return new Promise.resolve()
      }
    }
    else if (userNetConnection === "WIFI_AND_DATA_CONNECTION" && netConnection.type !== "wifi" && request.url != "user/generalSetting" && request.url != "user/getgeneralSetting") {
      if (!DeviceInfo.isEmulator()) {
        const userDataRoaming = await AsyncStorage.getItem("dataRoaming");
        const carrierInfo = await AsyncStorage.getItem("userCarrierInfo");
        const userCurrentLocation = await AsyncStorage.getItem("userCurrentLocation");

        const objCarrierInfo = carrierInfo && JSON.parse(carrierInfo)
        const objUserCurrentLocation = userCurrentLocation && JSON.parse(userCurrentLocation)
        // Check if user is in roaming 
        const isUserInRoaming = (objCarrierInfo && objUserCurrentLocation) ? !(objUserCurrentLocation.countryCode.toLowerCase() == objCarrierInfo.isoCountryCode) : false
        if (userDataRoaming == '1') {
          return new Promise.resolve()
        } else {
          if (isUserInRoaming) {
            Toast.show(strings("You_are_currently_on_Mobile_data_and_Roaming_Please_change_network_settings_to_Roaming_from_General_Settings"))
            return new Promise.reject()
          } else {
            return new Promise.resolve()
          }
        }
      } else {
        return new Promise.resolve()
      }
    }
    else {
      return new Promise.resolve()
    }
  })

  const HobbiesList = (data) => {
    return api.post('auth/gethobbiesByCategory', data)
  }

  const CategoryList = () => {
    return api.get('auth/getCategories')
  }
  const checkHobbies = (data) => {
    return api.post('auth/checkHobbies', data)
  }

  const getSignInWithAppleURL = () => {
    return api.get('auth/signin/apple')
  }


  const TutorialsList = () => {
    return api.get('auth/getTutorials')
  }

  const register = (data) => {
    return api.post('auth/signup', data, { headers: { 'Content-Type': 'multipart/form-data' } })
  }

  const login = (data) => {
    data.language = data.language === 'en' ? "ENGLISH" : "HEBREW";
    return api.post('auth/signin', data)
  }

  const logout = (data, token) => {
    return api.post('user/logout', data, { headers: { Authorization: token } })
    //return api.post('user/addOrUpdateDeviceToken', data, { headers: { Authorization: token } })
  }

  const requestOtp = (data) => {
    return api.post('auth/requestOTP', data)
  }

  const verifyOtp = (data) => {
    return api.post('auth/verifyOTP', data)
  }

  const resetPassword = (data) => {
    return api.post('auth/resetPassword', data)
  }

  const removeEventUser = (data, token) => {
    return api.post('user/event/removeuser', data, { headers: { Authorization: token } })
  }

  const changePassword = (data, token) => {
    return api.post('user/changePassword', data, { headers: { Authorization: token } })
  }

  const getUserDetails = (user) => {
    return api.post('user/getUserDetails', user.data, { headers: { Authorization: user.token } })
  }
  const addOrUpdateDeviceToken = (data, token) => {
    return api.post('user/addOrUpdateDeviceToken', data, { headers: { Authorization: token } })
  }
  const viewDynamicMessage = (data, token) => {
    return api.post('user/dmsg/view', data, { headers: { Authorization: token } })
  }
  const getUserBonds = (user) => {
    return api.post('user/listAllBonds', user.data, { headers: { Authorization: user.token } })
  }
  const getBondsSuggestion = (user) => {
    return api.post('user/searchUser', user.data, { headers: { Authorization: user.token } })
  }
  const addBond = (user) => {
    return api.post('user/bondRequest', user.data, { headers: { Authorization: user.token } })
  }
  const addBondByPhone = (user) => {
    return api.post('user/bondRequestByPhoneNumber', user.data, { headers: { Authorization: user.token } })
  }

  const removeBond = (data, token) => {
    return api.post('user/bondRemove', data, { headers: { Authorization: token } })
  }

  const blockUser = (data, token) => {
    return api.post('user/blockUser', data, { headers: { Authorization: token } })
  }

  const unblockUser = (data, token) => {
    return api.post('user/unblockUser', data, { headers: { Authorization: token } })
  }

  const userSuggestion = (data, token) => {
    return api.post('user/userSuggestion', data, { headers: { Authorization: token } })
  }

  const getNewsFeed = (user) => {
    return api.post('user/newsFeed', user.data, { headers: { Authorization: user.token } })
  }
  const SearchList = (data, token) => {
    return api.post('user/group/searchGroupEvent', data, { headers: { Authorization: token } })
  }

  const deactivateAccount = (user) => {
    return api.post('user/deactivate', user.data, { headers: { Authorization: user.token } })
  }

  // api for SET account detail
  const setAccountSetting = (data, token) => {
    return api.post('user/accountSetting', data, { headers: { Authorization: token } })
  }

  // api for GET account detail
  const getAccountSetting = (data, token) => {
    return api.post('user/getaccountSetting', data, { headers: { Authorization: token } })
  }

  // api for GET privacy detail
  const getPrivacySetting = (data, token) => {
    return api.post('user/getprivacySetting', data, { headers: { Authorization: token } })
  }

  // api for SET privacy detail
  const setPrivacySetting = (data, token) => {
    return api.post('user/privacySetting', data, { headers: { Authorization: token } })
  }

  // api for GET display detail
  const getDisplaySetting = (data, token) => {
    return api.post('user/setting/display/get', data, { headers: { Authorization: token } })
  }

  // api for SET display detail
  const setDisplaySetting = (data, token) => {
    return api.post('user/setting/display/update', data, { headers: { Authorization: token } })
  }

  // api for GET general detail
  const getGeneralSetting = (data, token) => {
    return api.post('user/getgeneralSetting', data, { headers: { Authorization: token } })
  }

  // api for SET general detail
  const setGeneralSetting = (data, token) => {
    return api.post('user/generalSetting', data, { headers: { Authorization: token } })
  }

  // api for GET group admin notification detail
  const getGroupAdminNotifcation = (data, token) => {
    return api.post('user/setting/groupadminnotifcation/get', data, { headers: { Authorization: token } })
  }

  // api for SET group admin notification detail
  const setGroupAdminNotifcation = (data, token) => {
    return api.post('user/setting/groupadminnotifcation/update', data, { headers: { Authorization: token } })
  }

  // api for GET user notification detail
  const getUserNotifcation = (data, token) => {
    return api.post('user/getNotificationSetting', data, { headers: { Authorization: token } })
  }

  // api for SET user notification detail
  const setUserNotifcation = (data, token) => {
    return api.post('user/setNotificationSetting', data, { headers: { Authorization: token } })
  }

  // api for GET user list of conversation
  const getUserListConversation = (data, token) => {
    return api.post('user/userConversations', data, { headers: { Authorization: token } })
  }

  // api for GET visibility search
  const getVisibilitySearch = (data, token) => {
    return api.post('user/getVisibility', data, { headers: { Authorization: token } })
  }

  // api for SET visibility search
  const setVisibilitySearch = (data, token) => {
    return api.post('user/changeVisibility', data, { headers: { Authorization: token } })
  }

  // api for GET user chat messages
  const getUserChat = (data, token) => {
    return api.post('user/messagesForUserConversation', data, { headers: { Authorization: token } })
  }

  // api for UnBlock User 
  const unBlockUser = (data, token) => {
    return api.post('user/unblockUser', data, { headers: { Authorization: token } })
  }

  // api for GET user block list
  const getUserBlockList = (data, token) => {
    return api.post('user/blockedUsersAndGroups', data, { headers: { Authorization: token } })
  }

  // api for GET user group chat messages
  const getUserGroupChat = (data, token) => {
    return api.post('user/messagesForGroupConversation', data, { headers: { Authorization: token } })
  }

  const bondAccept = (data, token) => {
    return api.post('user/bondAccept', data, { headers: { Authorization: token } })
  }

  const bondReject = (data, token) => {
    return api.post('user/bondReject', data, { headers: { Authorization: token } })
  }

  const pendingRequests = (data, token) => {
    return api.post('user/pendingRequests', data, { headers: { Authorization: token } })
  }

  // api for SEND user message
  const sendMessage = (data, token) => {
    return api.post('user/message', data, {
      headers: {
        //  'Accept': '',
        //  'Content-Type': '',
        Authorization: token
      }
    })
  }

  // api for SEND user group message
  const sendGroupMessage = (data, token) => {
    return api.post('user/groupMessage', data, {
      headers: {
        //  'Accept': '',
        //  'Content-Type': '',
        Authorization: token
      }
    })
  }
  // api for SEND user group message
  const markMessageRead = (data, token) => {
    return api.post('user/markMessageRead', data, {
      headers: {
        Authorization: token
      }
    })
  }

  const deleteMessage = (data, token) => {
    return api.post('user/delete/message', data, {
      headers: {
        Authorization: token
      }
    })
  }

  const muteChat = (data, token) => {
    const {path} = data;
    return api.post('user' + path + '/muteChat', data, {
      headers: {
        Authorization: token
      }
    })
  }

  const updateHobbies = (data, token) => {
    return api.post('user/hobby/selectdeselecthobbybyuser', data, { headers: { Authorization: token } })
  }

  const updateProfile = (data, token) => {
    return api.post('user/updateUser', data, { headers: { Authorization: token } })
  }

  const verifyAuthentication = (data, token) => {
    return api.post('user/twofactor/verifyAuthentication', data, { headers: { Authorization: token } })
  }

  const resendOTP = (token) => {
    return api.post('user/twofactor/resendOTP', {}, { headers: { Authorization: token } })
  }

  const updateLocation = (data, token) => {
    return api.post('user/updatelocation', data, { headers: { Authorization: token } })
  }

  const groupList = (data, token) => {
    return api.post('user/group/searchUserGroup', data, { headers: { Authorization: token } })
  }

  const groupRequestList = (data, token) => {
    return api.post('user/group/requests', data, { headers: { Authorization: token } })
  }

  const createGroup = (data, token) => {
    return api.post('user/group/createGroup', data, { headers: { Authorization: token } })
  }

  const createEvent = (data, token) => {
    return api.post('user/event/add', data, { headers: { Authorization: token } })
  }

  const eventList = (data, token) => {
    return api.post('user/event/list', data, { headers: { Authorization: token } })
  }

  const getGroupTask = (data, token) => {
    return api.post('user/taskList', data, { headers: { Authorization: token } })
  }

  const getGroupRecentActivities = (data, token) => {
    return api.post('user/group/recentActivities', data, { headers: { Authorization: token } })
  }

  const groupRequestApproveReject = (data, token) => {
    return api.post('user/group/member/invitationStatus', data, { headers: { Authorization: token } })
  }

  const acceptTaskByUser = (data, token) => {
    return api.post('user/task/response', data, { headers: { Authorization: token } })
  }

  // polls API
  const addGroupPolls = (data, token) => {
    return api.post('user/addPolls', data, { headers: { Authorization: token } })
  }
  const getGroupPolls = (data, token) => {
    return api.post('user/pollList', data, { headers: { Authorization: token } })
  }
  const deleteGroupPolls = (data, token) => {
    return api.post('user/deletePoll', data, { headers: { Authorization: token } })
  }
  const updateGroupPolls = (data, token) => {
    return api.post('user/updatePoll', data, { headers: { Authorization: token } })
  }
  const assignPoll = (data, token) => {
    return api.post('user/poll/assignUsers', data, { headers: { Authorization: token } })
  }
  const acceptedUserListPoll = (data, token) => {
    return api.post('user/poll/acceptedList', data, { headers: { Authorization: token } })
  }
  const removeUserFromPoll = (data, token) => {
    return api.post('user/poll/removeUser', data, { headers: { Authorization: token } })
  }
  const acceptPollByUser = (data, token) => {
    return api.post('user/poll/response', data, { headers: { Authorization: token } })
  }
  const assignedPollList = (data, token) => {
    return api.post('user/poll/assignedList', data, { headers: { Authorization: token } })
  }

  // memeber list api
  const memberList = (data, token) => {
    return api.post('user/group/getGroupMembers', data, { headers: { Authorization: token } })
  }

  const addGroupTask = (data, token) => {
    return api.post('user/addTask', data, { headers: { Authorization: token } })
  }

  const updateGroupTask = (data, token) => {
    return api.post('user/updateTask', data, { headers: { Authorization: token } })
  }

  const deleteGroupTask = (data, token) => {
    return api.post('user/deleteTask', data, { headers: { Authorization: token } })
  }

  const assignTask = (data, token) => {
    return api.post('user/task/assignUsers', data, { headers: { Authorization: token } })
  }

  const removeUserFromTask = (data, token) => {
    return api.post('user/task/removeUser', data, { headers: { Authorization: token } })
  }

  const assignedList = (data, token) => {
    return api.post('user/task/assigneeDetails', data, { headers: { Authorization: token } })
  }

  const labelAssignedList = (data, token) => {
    return api.post('user/label/assignedList', data, { headers: { Authorization: token } })
  }

  const removeUserLabel = (data, token) => {
    return api.post('user/label/removeUser', data, { headers: { Authorization: token } })
  }

  const getLabels = (data, token) => {
    return api.post('user/labelList', data, { headers: { Authorization: token } })
  }

  const addLabel = (data, token) => {
    return api.post('user/addLabel', data, { headers: { Authorization: token } })
  }

  const deleteLabel = (data, token) => {
    return api.post('user/deleteLabel', data, { headers: { Authorization: token } })
  }

  const updateLabel = (data, token) => {
    return api.post('user/updateLabel', data, { headers: { Authorization: token } })
  }

  const groupProfile = (data, token) => {
    return api.post('user/group/viewGroupProfile', data, { headers: { Authorization: token } })
  }

  const assignLabel = (data, token) => {
    return api.post('user/label/assignUsers', data, { headers: { Authorization: token } })
  }

  const groupsJoinRequest = (data, token) => {
    return api.post('user/group/requestToJoin', data, { headers: { Authorization: token } })
  }

  const addMember = (data, token) => {
    return api.post('user/group/invite', data, { headers: { Authorization: token } })
  }

  // pending memeber list api
  const pendingMemberList = (data, token) => {
    return api.post('user/group/pending/request', data, { headers: { Authorization: token } })
  }

  const leaveGroup = (data, token) => {
    return api.post('user/group/leave', data, { headers: { Authorization: token } })
  }

  // approve & reject group request api
  const approveRejectGroupRequest = (data, token) => {
    return api.post('user/group/request/approvereject', data, { headers: { Authorization: token } })
  }

  // Media APIS
  const getGroupMedia = (data, token) => {
    return api.post('user/group/getGroupMedia', data, { headers: { Authorization: token } })
  }

  const removeGroupMedia = (data, token) => {
    return api.post('user/group/removeGroupMedia', data, { headers: { Authorization: token } })
  }
  const removeGroupCertificate = (data, token) => {
    return api.post('user/group/certificate/remove', data, { headers: { Authorization: token } })
  }

  const saveGroupMedia = (data, token) => {
    return api.post('user/group/saveGroupMedia', data, { headers: { Authorization: token } })
  }
  const eventDetails = (data, token) => {
    return api.post('user/event/details', data, { headers: { Authorization: token } })
  }
  // make user as operator api
  const makeOperator = (data, token) => {
    return api.post('user/group/editUser', data, { headers: { Authorization: token } })
  }

  const editGroup = (data, token) => {
    return api.post('user/group/editGroup', data, { headers: { Authorization: token } })
  }

  const eventInviteUser = (data, token) => {
    return api.post('user/event/invite', data, { headers: { Authorization: token } })
  }

  const getCertificate = (data, token) => {
    return api.post('user/group/certificate/get', data, { headers: { Authorization: token } })
  }

  const addCertificate = (data, token) => {
    return api.post('user/group/certificate/add', data, { headers: { Authorization: token } })
  }

  // api for close group request
  const closeGroup = (data, token) => {
    return api.post('user/group/closeGroup', data, { headers: { Authorization: token } })
  }

  // api for add bank account details
  const addBankAccount = (data, token) => {
    return api.post('user/group/add/bank/account', data, { headers: { Authorization: token } })
  }

  // api for add bank account details
  const editBankAccount = (data, token) => {
    return api.post('user/group/edit/bank/account', data, { headers: { Authorization: token } })
  }

  // api for get group user task list
  const taskListByGroup = (data, token) => {
    return api.post('user/taskListByGroup', data, { headers: { Authorization: token } })
  }

  // api for get group user label list
  const labelListByGroup = (data, token) => {
    return api.post('user/labelListByGroup', data, { headers: { Authorization: token } })
  }

  const unreadCount = (data, token) => {
    return api.post('user/unreadCount', data, { headers: { Authorization: token } })
  }

  const eventAnnouncement = (data, token) => {
    return api.post('user/event/announcement', data, { headers: { Authorization: token } })
  }

  const addNote = (data, token) => {
    return api.post('user/event/notes/create', data, { headers: { Authorization: token } })
  }

  const eventUserStatus = (data, token) => {
    return api.post('user/event/members', data, { headers: { Authorization: token } })
  }

  const groupUserRecentActivities = (data, token) => {
    return api.post('user/group/groupUser/recentActivities', data, { headers: { Authorization: token } })
  }

  const pendingEventInvitation = (data, token) => {
    return api.post('user/event/invitations', data, { headers: { Authorization: token } })
  }

  const pendingGroupInvitation = (data, token) => {
    return api.post('user/group/invitations', data, { headers: { Authorization: token } })
  }

  const removeUserFromGroup = (data, token) => {
    return api.post('user/group/remove', data, { headers: { Authorization: token } })
  }

  //group count
  const groupCount = (data, token) => {
    return api.post('user/group/counts', data, { headers: { Authorization: token } })
  }

  // api for get group notification flag
  const getNotificationFlag = (data, token) => {
    return api.post('user/group/getNotificationFlag', data, { headers: { Authorization: token } })
  }

  // api for set group notification flag
  const setNotificationFlag = (data, token) => {
    return api.post('user/group/setNotificationFlag', data, { headers: { Authorization: token } })
  }

  // invitation Response by user api 
  const invitationResponseByUser = (data, token) => {
    return api.post('user/event/invitation/response', data, { headers: { Authorization: token } })
  }

  // event join request
  const eventJoinRequest = (data, token) => {
    return api.post('user/event/join/request', data, { headers: { Authorization: token } })
  }

  const getEventFeesDetails = (data, token) => {
    return api.post('user/event/get/fees/details', data, { headers: { Authorization: token } })
  }

  // get payment URL api 
  const getPaymentUrl = (data, token) => {
    return api.post('user/event/get/payment/url', data, { headers: { Authorization: token } })
  }

  // approve reject request by admin
  const eventApproveRejectByAdmin = (data, token) => {
    return api.post('user/event/admin/approvereject', data, { headers: { Authorization: token } })
  }

  // api for get event notification flag
  const getEventNotificationFlag = (data, token) => {
    return api.post('user/event/getNotificationFlag', data, { headers: { Authorization: token } })
  }

  // api for set event notification flag
  const setEventNotificationFlag = (data, token) => {
    return api.post('user/event/setNotificationFlag', data, { headers: { Authorization: token } })
  }

  // edit event
  const editEvent = (data, token) => {
    return api.post('user/event/update', data, { headers: { Authorization: token } })
  }

  // check leave event
  const checkLeaveEvent = (data, token) => {
    return api.post('user/event/check/leave', data, { headers: { Authorization: token } })
  }

  // leave event
  const leaveEvent = (data, token) => {
    return api.post('user/event/leave', data, { headers: { Authorization: token } })
  }

  // close event
  const closeEvent = (data, token) => {
    return api.post('user/event/close', data, { headers: { Authorization: token } })
  }

  // rais dispute
  const raisDispute = (data, token) => {
    return api.post('user/event/raise/dispute', data, { headers: { Authorization: token } })
  }

  const paymentList = (data, token) => {
    return api.post('user/event/paymentList', data, { headers: { Authorization: token } })
  }

  paymentListAdmin = (data, token) => {
    return api.post('user/payment/userList', data, { headers: { Authorization: token } })
  }

  const paymentSummary = (data, token) => {
    return api.post('user/group/payment/summary', data, { headers: { Authorization: token } })
  }

  const addHelp = (data, token) => {
    return api.post('user/addhelp', data, { headers: { Authorization: token } })
  }

  const getContactDetails = (token) => {
    return api.get('auth/staticpages', {}, { headers: { Authorization: token } })
  }

  const getContactDetailPage = (data, token, locale) => {
    return api.post('auth/staticpage/details', data, { headers: { Authorization: token } })
  }

  const userContact = (data, token) => {
    return api.post('auth/usercontact', data)
  }

  const paymentContact = (data, token) => {
    return api.post('user/payment/contact', data, { headers: { Authorization: token } })
  }
  const getHobbyList = () => {
    return api.get('auth/getHobbyList')
  }
  const SearchGroupList = (data, token) => {
    return api.post('user/group/search', data, { headers: { Authorization: token } })
  }
  const SearchEventList = (data, token) => {
    return api.post('user/event/search', data, { headers: { Authorization: token } })
  }

  const getUserHeader = (data) => {
    return api.post('user/userHeader', data.data, { headers: { Authorization: data.token } })
  }

  const validateCoupon = (data, token) => {
    return api.post('user/coupon/test', data, { headers: { Authorization: token } })
  }

  const getUserEmailVerifyRequest = (data, token) => {
    return api.post('auth/checkVerificationLink', data, { headers: { Authorization: token } })
  }

  const sendVerificationEmailRequest = (data, token) => {
    return api.post('auth/resendVerificationLink', data, { headers: { Authorization: token } })
  }

  return {
    register,
    login,
    HobbiesList,
    requestOtp,
    verifyOtp,
    resetPassword,
    changePassword,
    TutorialsList,
    CategoryList,
    checkHobbies,
    getSignInWithAppleURL,
    logout,
    SearchList,
    getUserDetails,
    addOrUpdateDeviceToken,
    viewDynamicMessage,
    getUserBonds,
    getBondsSuggestion,
    addBond,
    addBondByPhone,
    removeBond,
    blockUser,
    unblockUser,
    getNewsFeed,
    getAccountSetting,
    setAccountSetting,
    getPrivacySetting,
    setPrivacySetting,
    getDisplaySetting,
    setDisplaySetting,
    getGeneralSetting,
    setGeneralSetting,
    getVisibilitySearch,
    setVisibilitySearch,
    getGroupAdminNotifcation,
    setGroupAdminNotifcation,
    getUserNotifcation,
    setUserNotifcation,
    getUserListConversation,
    unBlockUser,
    getUserBlockList,
    getUserChat,
    getUserGroupChat,
    sendMessage,
    sendGroupMessage,
    markMessageRead,
    deleteMessage,
    muteChat,
    updateHobbies,
    userSuggestion,
    bondAccept,
    bondReject,
    pendingRequests,
    updateProfile,
    verifyAuthentication,
    resendOTP,
    deactivateAccount,
    updateLocation,
    groupList,
    createGroup,
    createEvent,
    eventList,
    getGroupTask,
    getGroupRecentActivities,
    groupRequestApproveReject,
    memberList,
    addGroupTask,
    updateGroupTask,
    deleteGroupTask,
    assignTask,
    removeEventUser,
    removeUserFromTask,
    assignedList,
    getLabels,
    addLabel,
    deleteLabel,
    updateLabel,
    groupProfile,
    assignLabel,
    groupsJoinRequest,
    addMember,
    pendingMemberList,
    approveRejectGroupRequest,
    leaveGroup,
    getGroupMedia,
    removeGroupMedia,
    removeGroupCertificate,
    saveGroupMedia,
    eventDetails,
    makeOperator,
    editGroup,
    eventInviteUser,
    getCertificate,
    addCertificate,
    closeGroup,
    addBankAccount,
    labelAssignedList,
    removeUserLabel,
    editBankAccount,
    taskListByGroup,
    labelListByGroup,
    getEventFeesDetails,
    eventAnnouncement,
    unreadCount,
    groupUserRecentActivities,
    pendingGroupInvitation,
    pendingEventInvitation,
    eventUserStatus,
    removeUserFromGroup,
    groupCount,
    getNotificationFlag,
    setNotificationFlag,
    invitationResponseByUser,
    getPaymentUrl,
    eventJoinRequest,
    eventApproveRejectByAdmin,
    getEventNotificationFlag,
    setEventNotificationFlag,
    editEvent,
    checkLeaveEvent,
    leaveEvent,
    closeEvent,
    raisDispute,
    paymentList,
    paymentListAdmin,
    paymentSummary,
    addHelp,
    getContactDetails,
    getContactDetailPage,
    addNote,
    userContact,
    paymentContact,
    getHobbyList,
    groupRequestList,
    addGroupPolls,
    getGroupPolls,
    deleteGroupPolls,
    updateGroupPolls,
    assignPoll,
    acceptedUserListPoll,
    removeUserFromPoll,
    acceptPollByUser,
    assignedPollList,
    acceptTaskByUser,
    SearchGroupList,
    SearchEventList,
    validateCoupon,
    getUserEmailVerifyRequest,
    sendVerificationEmailRequest,
    getUserHeader
  }
}

// our "constructor"
const create = (baseURL = 'https://api.github.com/') => {
  // ------
  // STEP 1
  // ------
  //
  // Create and configure an apisauce-based api object.
  //
  const api = apisauce.create({
    // base URL is read from the "constructor"
    baseURL,
    // here are some default headers
    headers: {
      'Cache-Control': 'no-cache'
    },
    // 10 second timeout...
    timeout: 10000
  })

  // ------
  // STEP 2
  // ------
  //
  // Define some functions that call the api.  The goal is to provide
  // a thin wrapper of the api layer providing nicer feeling functions
  // rather than "get", "post" and friends.
  //
  // I generally don't like wrapping the output at this level because
  // sometimes specific actions need to be take on `403` or `401`, etc.
  //
  // Since we can't hide from that, we embrace it by getting out of the
  // way at this level.
  //
  const getRoot = () => api.get('')
  const getRate = () => api.get('rate_limit')
  const getUser = (username) => api.get('search/users', { q: username })

  // ------
  // STEP 3
  // ------
  //
  // Return back a collection of functions that we would consider our
  // interface.  Most of the time it'll be just the list of all the
  // methods in step 2.
  //
  // Notice we're not returning back the `api` created in step 1?  That's
  // because it is scoped privately.  This is one way to create truly
  // private scoped goodies in JavaScript.
  //
  return {
    // a list of the API functions from step 2
    getRoot,
    getRate,
    getUser
  }
}

// let's return back our create method as the default.
export default {
  create,
  User
}
