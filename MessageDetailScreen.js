import React, { Component } from 'react';
import {
  View, Text, ActivityIndicator, TouchableOpacity, Image, Platform, SafeAreaView, I18nManager, Modal, Linking, StyleSheet, PermissionsAndroid, Alert
} from 'react-native';
import { connect } from 'react-redux';
import { NavigationActions } from 'react-navigation';
import { bindActionCreators } from 'redux';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet'
import ImagePicker from 'react-native-image-crop-picker';
import Toast from 'react-native-simple-toast';
import Theme from 'react-native-theming';
import RNFetchBlob from 'rn-fetch-blob';
import GroupsActions from '../Redux/GroupsRedux';
import HelpActions from '../Redux/HelpRedux';
import EventActions from '../Redux/EventRedux';
import ReportIcon from '../svgs/dangerIcon.svg';

// Add Actions - replace 'Your' with whatever your reducer is called :)
import KeyboardManager from 'react-native-keyboard-manager';
import moment from 'moment';
import momentHe from 'moment/locale/he'

import MessageActions from '../Redux/MessageRedux';
import {
  GiftedChat,
  Bubble, Actions, MessageText
} from 'react-native-gifted-chat';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { getThumbnail, renderAvatar } from '../Services/Commons';
import _ from 'lodash';

// Styles
import { Images, Fonts, Colors } from '../Themes';
import styles from './Styles/MessageDetailScreenStyle';
import {
  getheaderLeftStyle,
  getheaderRightStyle,
  getHeaderStyle,
  getImageBackButton,
  isRtl,
  getDynamicSize,
  toTitleCase,
  getUserBadges
} from "../Transforms/utils";
import { strings } from '../I18n/I18n';
import Attachment from '../svgs/attachment.svg'
import Gallery from '../svgs/gallery.svg'
import Camera from '../svgs/camera.svg'
import Pin from '../svgs/pin.svg'
import colors from '../Themes/Colors';
import CameraRoll from '@react-native-community/cameraroll';
import RNFS, { stat } from 'react-native-fs';
import LastActivityHeader from '../Components/LastActivityHeader';
import MessageHeaderButtons from '../Components/MessageHeaderButtons';
import imagesSizes, { appFolder } from '../Config/Constants';
import CustomContactUsModal from '../Components/CustomContactUsModal';
import FinalModal from '../Components/FinalModal';
import { MoreOptions } from '../Components/MoreOptions';
import { muteChatService, reportsService } from '../APIServices';

const imageSize = getDynamicSize(18);
const profilePictureWidth = imagesSizes.profilePictureWidth;
const profilePictureHeight = imagesSizes.profilePictureHeight;

const actionSheetStyles = {
  body: {
    borderRadius: 20,
    overflow: 'hidden'
  },
  titleBox: {
    height: 0,
  },
  buttonBox: {
    height: 50,
    marginTop: StyleSheet.hairlineWidth,
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingLeft: 20
  },
  buttonText: {
    fontSize: 20
  },
  cancelButtonBox: {
    height: 50,
    marginTop: 6,
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingLeft: 50
  },
  cancelButtonText: {
    fontSize: 20,
  },
};
class MessageDetailScreen extends Component {
   static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    const userBadges = getUserBadges(params.itemDetails.userBadges);
    return {
      headerTitle: (
        params && params.title && (
          <TouchableOpacity onPress={() => params.handleTitleNavigation()}>
            <LastActivityHeader userName={params.title} verified={userBadges?.verify?.level === 1} theme={params.theme} status={params.itemDetails.lastActivity}/>
          </TouchableOpacity>
        )
      ),
      headerStyle: getHeaderStyle(navigation),
      headerLeft: (
        params && params.isRTL
          ? <MessageHeaderButtons navigation={navigation} />
          : (
            <TouchableOpacity
              style={getheaderLeftStyle(params)}
              onPress={() => {
                navigation.goBack();
                // navigation.dispatch(NavigationActions.back({fromMessage:true}))
              }}
            >
              {getImageBackButton(navigation)}
            </TouchableOpacity>
          )
      ),
      headerRight: (
        params && params.isRTL
          ? (
            <TouchableOpacity
              style={getheaderRightStyle(true)}
              onPress={() => navigation.goBack()}
            >
              {getImageBackButton(navigation)}
            </TouchableOpacity>
          )
          : <MessageHeaderButtons navigation={navigation}/>
      ),
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      isLoadMore: false,
      loadEarlier: false,
      image: [],
      inputText: '',
      cannotParticipate: false,
      type: '',
      description: '',
      ModalShow: false,
      helpError: '',
      reportId: null,
      showActions: false,
      isFinalModalVisible: false,
      isMore: false,
      isLoading: false,
      isFromLongPress: false,
      reportedUser: {},
    };
    this.itemDetails = '';
    this.page = 0;
    this.screen = '';
    this.token = '';
    this.otherUserId = 0;
    this.user = '';
    this.conversationType = '';
    this.leftEvent = false;
    this.leftGroup = false;
    this.isActive = true;
  }

  componentDidMount() {
    // Disable Keyborad Manager as its not required for Gifted chat
    Platform.OS === 'ios' && KeyboardManager.setEnable(false);
    const { navigation, userInfo, userChat, user, displayDetail, language } = this.props;
    this.props.navigation.setParams({
      handleRefresh: this.getMessages.bind(this),
      handleTitleNavigation: this.handleTitleNavigation.bind(this),
      handleMuteChat: this.handleMuteChat.bind(this),
      leaveGroupOrEvent: this.leaveGroupOrEvent.bind(this),
      createEvent: this.createEvent.bind(this)
    })
    navigation.setParams({ isRTL: isRtl(language) });
    this.user = userInfo && userInfo.user;
    this.token = userInfo && userInfo.token;
    const screen = navigation.getParam('screen', '');
    if(screen === 'group-chat'){
      this.itemDetails = navigation.getParam('itemDetails', '');
      this.conversationType = 'GROUP';
      this.screen = navigation.getParam('screen', '');
    }
    else{
      this.itemDetails = navigation.getParam('itemDetails', '');
      this.conversationType = this.itemDetails.conversationType ? this.itemDetails.conversationType : 'PERSONAL';
      if(this.conversationType === 'EVENT'){
        this.getEventDetails();
        this.leftEvent = this.itemDetails.userStatus !== 'APPROVED';
      }
      if(this.conversationType === 'GROUP'){
        this.getGroupDetails();
        this.leftGroup = this.itemDetails.userStatus !== 'APPROVED';
      }
      this.screen = navigation.getParam('screen', '');
    }
    if (this.itemDetails.isActive || this.itemDetails.active){
      this.isActive = this.itemDetails.isActive || this.itemDetails.active;
    }
    this.setState({cannotParticipate:this.cannotParticipateInChat()});
    this.getMessages()
    this.didFocus = navigation.addListener('willFocus', () => {
      this.getMessages()
    }
    );
  }

  componentDidUpdate(nextProps) {
    if (nextProps.isRTL != this.props.isRTL) {
      this.props.navigation.setParams({ isRTL: isRtl(nextProps.language) });
    }
  }

  componentWillUpdate(nextProps) {
    const {
      navigation, userInfo, userChat, user, displayDetail, receivedNewMessage
    } = this.props;
    const screen = nextProps.navigation.getParam('screen', '');
    // If received notification update the chat now
    // if (nextProps.navigation.getParam('notifcationDetails') != this.props.navigation.getParam('notifcationDetails')) {
    //   console.log(nextProps.navigation.getParam('notifcationDetails'), 'hiii')
    // }
    if (receivedNewMessage != nextProps.receivedNewMessage || nextProps.navigation.getParam('notifcationDetails') != this.props.navigation.getParam('notifcationDetails')) {
      const item = receivedNewMessage != nextProps.receivedNewMessage  ? nextProps.receivedNewMessage : nextProps.navigation.getParam('notifcationDetails'); //nextProps.navigation.getParam('notifcationDetails', '');
      const apiData = {
        userId: this.user.id,
        readChatId: item.readChatId,
        conversationType: item.conversationType,
      };
      this.props.dispatch(MessageActions.markMessageReadRequest(apiData, this.token));
      // Set params as message to avoid infinite loop
      navigation.setParams({ screen: 'message' });
      const data = {};
      data._id = Math.random();
      if (item.messageType === 'TEXT') {
        data.text = item.message;
      } else if (item.messageType === 'IMAGE') {
        data.image = item.message;
      }
      else if(item.messageType === 'LOCATION') {
        const coords = item.message.split(",");//item.location.split("(")?.[1].split(")")[0].split(" ");
        data.location = true;
        data.latitude = coords[0];
        data.longitude = coords[1];
      }
      data.read = false;
      data.timeType = displayDetail.timeType;
      data.createdAt = new Date();
      data.user = {
        id: item.senderId,
        name: item.senderName ? item.senderName : '',
        avatar: item.image ? getThumbnail(item.image) : item.conversationType === 'PERSONAL' ? renderAvatar(this.itemDetails?.gender) : Images.profile,
      };
      this.setState({ messages: [data, ...this.state.messages] });
    }
    if (nextProps.displayDetail && nextProps.displayDetail != this.props.displayDetail) {
      this.props.navigation.setParams({ theme: nextProps.displayDetail.themes.toLowerCase() });
    }

    if (nextProps.userChat !== this.props.userChat) {
      this.setStateMessages(nextProps.userChat);
      this.setState({cannotParticipate:this.cannotParticipateInChat()});
    }
    if (nextProps.userGroupChat !== this.props.userGroupChat) {
      this.setStateMessages(nextProps.userGroupChat);
      this.setState({cannotParticipate:this.cannotParticipateInChat()});
    }
    if (nextProps.message !== this.props.message) {
      Toast.show(nextProps.message);
    }

    if (nextProps.messageFromAPI !== this.props.messageFromAPI) {
      if (nextProps.messageFromAPI) {
        Toast.show(nextProps.messageFromAPI);
      }
    }
    if (nextProps.deleteMesage !== this.props.deleteMesage) {
      if (nextProps.deleteSuccess) {
        this.getMessages();
      }
    }
    if (nextProps.messageData !== this.props.messageData) {
      if (nextProps.messageSent) {
        const messageData = nextProps.messageData;
        const createdMessage = this.createMessage(messageData);
        this.setState(previousState => ({
          messages: GiftedChat.append(previousState.messages, createdMessage),
        }));

      }
    }
    if (nextProps.groupMessageData !== this.props.groupMessageData) {
      if (nextProps.groupMessageSent) {
        const messageData = nextProps.groupMessageData;
        const createdMessage = this.createMessage(messageData);
        this.setState(previousState => ({
          messages: GiftedChat.append(previousState.messages, createdMessage),
        }));

      }
    }
    if(nextProps.groupProfile && nextProps.groupProfile !== this.props.groupProfile){
      navigation.setParams({ groupProfile: nextProps.groupProfile });
      this.setState({cannotParticipate:this.cannotParticipateInChat()});
    }
    if(nextProps.eventDetails && nextProps.eventDetails !== this.props.eventDetails){
      navigation.setParams({ eventObj: nextProps.eventDetails.eventObj });
      if(!this.state.cannotParticipate){
        const dateTime = moment.utc(nextProps.eventDetails.eventObj.dateAndTime).local();
        let currentDateTime = moment();
        var duration = moment.duration(currentDateTime.diff(dateTime));
        var hours = duration.asHours();
        if(hours > 24){
          this.setState({cannotParticipate:true});
        }
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    // if (nextProps.addHelp !== this.props.addHelp) {
    //   if (nextProps.addHelp) {
    //     setTimeout(() => {
    //       !this.state.isFinalModalVisible ? this.setState({ ModalShow: false, isMore: true }) : null;
    //     }, 1000)
    //   }
    // }
    if (nextProps.message != this.props.message) {
      if (nextProps.message) {
        Toast.show(nextProps.message);
      }
    }
  }

  componentWillUnmount() {
    // Enable Keyborad Manager
    Platform.OS === 'ios' && KeyboardManager.setEnable(true);
    const onBack = this.props.navigation.getParam('onBack');
    onBack ? onBack() : null;
  }

  handleTitleNavigation = () => {
    const { navigation, userInfo, displayDetail } = this.props;
    let theme = displayDetail.themes.toLowerCase();
    if (this.itemDetails.conversationType == 'PERSONAL') {
      // User Navigation
      navigation.push('BondsUserAccount', { userInfo: { id: this.otherUserId, fullName: this.itemDetails.userOrGroupName, lastActivity: this.itemDetails.lastActivity }, currentUser: { user: this.props.user }, theme: theme, shouldBackToBonds: true, onNavigateBack: () => { }, })
    } else if (this.itemDetails.conversationType == 'GROUP') {
      // Group Navigation 
      navigation.push('GroupsInfo', { groupId: this.otherUserId, theme: theme })
    } else if (this.itemDetails.conversationType == 'EVENT') {
      // Event Navigation
      navigation.push('EventInfoScreen', { eventId: this.otherUserId, theme: this.props.displayDetail.themes.toLowerCase() })
    }
  }

  getGroupDetails = () => {
    const { navigation } = this.props;
    const data = { groupId: this.itemDetails.receiverOrGroupId };
    navigation.dispatch(GroupsActions.GroupProfileRequest(data, this.token));
  }

  getEventDetails = () => {
    const { navigation } = this.props;
    const data = { eventId: this.itemDetails.receiverOrGroupId };
    navigation.dispatch(EventActions.eventDetailsRequest(data, this.token));
  }

  leaveGroupOrEvent = (afterProcess = () =>{}) => {
    Alert.alert(
        strings('Leave_Group'),
        strings('Are_you_sure_want_to_leave_group?'),
        [
          {
            text: strings('Cancel'),
            onPress: afterProcess,
            style: 'cancel',
          },
          {
            text: strings('Ok'),
            onPress: () => {afterProcess();this.props.navigation.dispatch(GroupsActions.leaveGroupRequest({ groupId: this.itemDetails.receiverOrGroupId }, this.token))},
            style: 'cancel',
          },
        ],
      );
  }

  cannotParticipateInChat = () => {
    const { userRole, isAdmin} = this.itemDetails;
    const priv = this.itemDetails.private ? this.itemDetails.private : false;
    
    if ( !(this.isActive) ){
      return true;
    }
    if(this.screen === 'group-chat' || this.conversationType === 'GROUP'){
      return (priv && userRole !== 'ADMIN' && userRole !== 'OPERATOR') || this.leftGroup;
    }
    else if(this.conversationType === 'EVENT'){
      let groupType = this.itemDetails.groupType ? this.itemDetails.groupType : this.itemDetails.groupDetails ? 
              this.itemDetails.groupDetails.groupType : 'COMMON';
      let admin = userRole ? (this.itemDetails.userRole === 'ADMIN' || this.itemDetails.userRole === 'OPERATOR') : isAdmin
      return !(admin && groupType === 'BUSINESS') && !(!priv && !this.leftEvent);
    } 
    else if(this.conversationType === 'PERSONAL'){
      return false;
    }
      
  }

  getMessages = (page = this.page) => {
    const { navigation, userChat } = this.props;
    if (this.screen == 'message' && this.itemDetails.conversationType === 'PERSONAL') {
      this.otherUserId = this.itemDetails.senderId === this.user.id
        ? this.itemDetails.receiverOrGroupId
        : this.itemDetails.senderId;
      navigation.setParams({ title: this.itemDetails.userOrGroupName });
    } else if (this.itemDetails.conversationType == 'GROUP') {
      navigation.setParams({ title: this.itemDetails.userOrGroupName });
      this.otherUserId = this.itemDetails.receiverOrGroupId;
    }
    else if(this.itemDetails.conversationType == 'EVENT'){
      navigation.setParams({ title: this.itemDetails.userOrGroupName });
      this.otherUserId = this.itemDetails.receiverOrGroupId;
    } else {
      this.otherUserId = this.itemDetails.id;
      navigation.setParams({ title: this.screen == 'group-chat' ? this.itemDetails.name : this.itemDetails.fullName });
    }

    const data = {
      userId: this.user.id,
      pageNo: page,
      searchText: '',
      conversationType:this.itemDetails.conversationType,

    };

    if (this.itemDetails.conversationType == 'PERSONAL' || this.screen == 'bond-list') {
      data.otherUserId = this.otherUserId;
      this.props.dispatch(MessageActions.getUserChatRequest(data, this.token));
    } else {
      if(this.itemDetails.conversationType === 'EVENT'){
        data.groupId = this.itemDetails.groupId;
        data.eventId = this.otherUserId;
      }
      else{
        data.groupId = this.otherUserId ? this.otherUserId : this.itemDetails.id;
      }
      this.props.dispatch(MessageActions.getUserGroupChatRequest(data, this.token));
    }
  }

  setStateMessages = (userChat) => {
    const { user, displayDetail } = this.props;
    this.setState({ loadEarlier: userChat.length >= 10 });
    const newMessages = [];
    userChat.map((item) => {
      // let userName = '';
      // let userIcon = '';
      const data = {};
      const userBadges = getUserBadges(item?.userBadges);

      // if (item.senderId == this.user.id) {
      //   userName = this.user.fullName;
      //   userIcon = this.user.profilePicture;
      // } else if (item.senderId != this.user.id) {
      //   if (this.screen == 'message' && this.itemDetails.conversationType !== 'GROUP') {
      //     userName = this.itemDetails.userOrGroupName;
      //     userIcon = this.itemDetails.userProfileOrGroupIcon ? this.itemDetails.userProfileOrGroupIcon : Images.profile;
      //   } else {
      //     userName = this.itemDetails.fullName; // todo: change with item user name
      //     userIcon = this.itemDetails.profilePicture ? this.itemDetails.profilePicture : Images.profile;
      //   }
      // } else {
      //   userName = this.itemDetails.fullName;
      //   userIcon = this.itemDetails.profilePicture;
      // }
      const time = moment.utc(`${item.sentDate} ${item.sentTime}`).local().format('LT');
      data._id = item.id;
      data.groupchatId = (item.groupchatId && item.groupchatId) ? item.groupchatId : '';
      data.text = item.messageType === 'TEXT' ? item.message : '';
      data.image = item.messageType === 'IMAGE' ? item.message : '';
      if(item.messageType === 'LOCATION'){
        const coords = item.message.split(",");//item.location.split("(")?.[1].split(")")[0].split(" ");
        data.location = true;
        data.latitude = coords[0];
        data.longitude = coords[1];
      }
      data.timeType = displayDetail.timeType;
      data.createdAt = new Date(moment.utc(`${item.sentDate} ${item.sentTime}`).local()), // item.sentDate + ' ' + time;//`${item.sentDate} ${time}`;
      data.read = this.itemDetails.conversationType === 'PERSONAL' ? item.read : item.readCount >= item.receiversCount;
      data.readAt = this.itemDetails.conversationType === 'PERSONAL' ? item.readAt && new Date(moment.utc(`${item.readAt}`).local()) : item.lastReadAt && new Date(moment.utc(`${item.lastReadAt}`).local());
      data.readBy = item.readCount, // item.sentDate + ' ' + time;//`${item.sentDate} ${time}`;  
      data.user = {
          _id: item.senderId,
          name: item.senderName ? toTitleCase(item.senderName) : "",
          avatar: item.senderProfilePicture ? getThumbnail(item.senderProfilePicture) : this.itemDetails.conversationType === 'PERSONAL' ? renderAvatar(this.itemDetails?.gender) : Images.profile,
          isVerified: userBadges?.verify?.level === 1
        };
      newMessages.push(data);
    });

    if (this.state.isLoadMore) {
      this.setState({ messages: this.state.messages.concat(newMessages.reverse()) });
    } else {
      this.setState({ messages: newMessages.reverse() });
    }
  }

  showActionSheet = () => {
    this.ActionSheet.show();
  }

  showOption = (index) => {
    if (this.state.showActions) {
      if ( index == 0) {
        this.setState({ ModalShow: true });
      }
    }
    else {
      if (index == 0) {
        setTimeout(() => {
          ImagePicker.openCamera({
            compressImageQuality: 1,
            mediaType: 'photo',
            cropping: true,
            // width: profilePictureWidth,
            // height: profilePictureHeight,
            freeStyleCropEnabled: true,
          }).then((image) => {
            this.onSend(image, 'IMAGE');
          });
        },100);
      } else if (index == 1) {
        setTimeout(() => {
          ImagePicker.openPicker({
            compressImageQuality: 1,
            mediaType: 'photo',
            cropping: true,
            freeStyleCropEnabled: true,
            // width: profilePictureWidth,
            // height: profilePictureHeight,
          }).then((image) => {
            this.onSend(image, 'IMAGE');
          });
        }, 100);
      }
      else if(index == 2){
        const { navigation, language } = this.props;
        navigation.push('SharedLocation',{theme: this.props.displayDetail.themes.toLowerCase(), otherUserId: this.otherUserId, itemDetails: this.itemDetails, user: this.user, sharedLocation: false, isRTL: isRtl(language)});    }
    }
  }

  createMessage = (item) => {
    const data = {};
    const { displayDetail, user } = this.props;
    const time = moment.utc(`${item.sentDate} ${item.sentTime}`).local().format('LT');
    data._id = item.id;
    data.text = item.messageType == 'TEXT' ? item.message : '';
    data.image = item.messageType == 'IMAGE' ? item.message : '';
    if(item.messageType === 'LOCATION'){
      const coords = item.message.split(",");//item.location.split("(")?.[1].split(")")[0].split(" ");
      data.location = true;
      data.latitude = coords[0];
      data.longitude = coords[1];
    }
    data.timeType = displayDetail.timeType;
    data.createdAt = new Date(moment.utc(`${item.sentDate} ${item.sentTime}`).local()); // item.sentDate + ' ' + time;//`${item.sentDate} ${time}`;
    data.groupchatId = (item.groupchatId && item.groupchatId) ? item.groupchatId : '';
    data.read = this.itemDetails.conversationType !== 'GROUP' ? item.read : item.readCount >= item.receiversCount;
    data.readAt = this.itemDetails.conversationType !== 'GROUP' ? item.readAt && new Date(moment.utc(`${item.readAt}`).local()) : item.lastReadAt && new Date(moment.utc(`${item.lastReadAt}`).local());
    data.readBy = item.readCount, // item.sentDate + ' ' + time;//`${item.sentDate} ${time}`;
      
    data.user = {
      _id: this.user.id,
      name: this.user.fullName,
      avatar: user && user.profilePicture ? getThumbnail(user.profilePicture) : renderAvatar(user.gender),
    };
    return data;

  }

  onSend(messages = [], msgType = 'DEFAULT') { //added msg type
    const { user, displayDetail } = this.props;
    let message;
    switch(msgType){
      case 'IMAGE':
        message = {
          text: '',
          image: messages.path,
          messageType: 'IMAGE',
          timeType: displayDetail.timeType,
          user: {
            _id: this.user.id,
            name: this.user.fullName,
            avatar: user && user.profilePicture ? getThumbnail(user.profilePicture) : renderAvatar(user.gender),
          },
          _id: Math.random(),
        };
        break;
      case 'LOCATION':
        message = {
          text: messages,
          messageType: 'LOCATION',
          timeType: displayDetail.timeType,
          user: {
            _id: this.user.id,
            name: this.user.fullName,
            avatar: user && user.profilePicture ? getThumbnail(user.profilePicture) : renderAvatar(user.gender),
          },
          _id: Math.random(),
        };
        break;
      default:
        const currentMessage = messages[0]
        message = {
          text: currentMessage.text,
          messageType: 'TEXT',
          timeType: displayDetail.timeType,
          createdAt: currentMessage.createdAt,
          user: {
            _id: this.user.id,
            name: this.user.fullName,
            avatar: user && user.profilePicture ? getThumbnail(user.profilePicture) : renderAvatar(user.gender),
          },
          _id: Math.random(),
        };
        break;
    }
    
    let otherUserID = 0;
    if (this.screen == 'message' && this.itemDetails.conversationType === 'PERSONAL') {
      this.itemDetails.senderId != this.user.id
        ? otherUserID = this.itemDetails.senderId
        : otherUserID = this.itemDetails.receiverOrGroupId;
    } else if (this.itemDetails.conversationType == 'GROUP' || this.screen == 'group-chat') {
      otherUserID = this.itemDetails && this.itemDetails.id ? this.itemDetails.id : this.itemDetails.receiverOrGroupId;
    } else {
      otherUserID = this.itemDetails.id;
    }
    const formData = new FormData();
    formData.append('conversationType',this.itemDetails.conversationType);
    if(this.itemDetails.conversationType === 'EVENT'){
      formData.append('eventId',this.otherUserId);
      formData.append('groupId', this.itemDetails.groupId);
    }
    else if (this.itemDetails.conversationType !== 'PERSONAL' || this.screen == 'group-chat'){
      formData.append('groupId', otherUserID);
    }
    else {
      formData.append('otherUserId', otherUserID);
    }
    if (msgType == 'IMAGE') {
      formData.append('image', {
        uri: messages.path,
        type: messages.mime,
        name: 'upload-image.jpg',
      });
      formData.append('messageType', 'IMAGE');
    } else if(msgType == 'LOCATION'){
      formData.append('message', messages);
      formData.append('messageType', 'LOCATION');
    } else {
      formData.append('message', messages[0].text);
      formData.append('messageType', 'TEXT');
    }
    if (this.itemDetails.conversationType !== 'PERSONAL' || this.screen == 'group-chat') this.props.dispatch(MessageActions.sendGroupMessageRequest(formData, this.token));
    else this.props.dispatch(MessageActions.sendMessageRequest(formData, this.token));
  }

  onLoadEarlier = () => {
    this.setState({ isLoadMore: true });
    this.page = this.page + 1;
    this.getMessages(this.page);
  }
  onPressAvatar = (user) => {
    const { navigation, userInfo, displayDetail } = this.props;
    let theme = displayDetail.themes.toLowerCase();
    if (user._id != userInfo.user.id) {
      // User Navigation
      navigation.push('BondsUserAccount', { userInfo: { id: user._id, fullName: user.name ? user.name : this.itemDetails.userOrGroupName }, currentUser: { user: this.props.user }, theme: theme, shouldBackToBonds: true, onNavigateBack: () => { }, })
    }
  }

  renderMessageText({ currentMessage, ...props }) {
    if (currentMessage && currentMessage.text) {
      const {
        containerStyle, wrapperStyle, messageTextStyle, ...messageTextProps
      } = props;
      return (
        <MessageText
          {...messageTextProps}
          textStyle={{
            left: currentMessage.read ? [messageTextProps.textStyle, messageTextStyle, styles.normalFont] : [messageTextProps.textStyle, messageTextStyle, styles.boldFont],
          }}
          currentMessage={currentMessage}
        />
      );
    }
    return null;
  }

  deleteMessage = (deletedMessage) => {
    const messageDeleteID = this.conversationType !== 'PERSONAL' ? deletedMessage.groupchatId : deletedMessage._id;
    const data = { chatId: messageDeleteID, conversationType: this.conversationType };
    this.props.dispatch(MessageActions.deleteMessageRequest(data, this.token));
  }

  createEvent = () => {
    this.props.navigation.navigate('CreateEvent', { selectedGroup: this.props.groupProfile });
  }

  handleMuteChat = (status, muteTime) => {
    let data = {userId:this.user.id,muteChat:status};
    let path = '';
    if(this.conversationType === 'GROUP'){
        data.groupId = this.itemDetails.receiverOrGroupId;
        path += '/group';
    }
    else if(this.conversationType === 'EVENT'){
        data.eventId = this.itemDetails.receiverOrGroupId;
        path += '/event';
    }
    else{
        data.otherUserId = this.itemDetails.receiverOrGroupId;
    }
    data.path = path;
    data.muteTime = muteTime; // represents 2 weeks(14 days) in hours
    // this.props.dispatch(MessageActions.muteChatRequest(data, this.token));
    this.muteChatAPI(data, this.token);
  }

  muteChatAPI = async (res, token) => {
    try {
      const response = await muteChatService(res, token);
      const data = await response.json();
      Toast.show(data.message);
    }
    catch(error) {
      //
    }
  }

  onReport = async (data, token) => {
    this.setState({ isLoading: true })
    try {
      const response = await reportsService(data, token);
      if (response.ok) {
        this.setState({ isFinalModalVisible: true, ModalShow: false, isMore: false, name: '', description: '' })   
      }
      else {
        const data = await response.json();
        Toast.show(data.message);
      }
      this.setState({ isLoading: false })
    }
    catch(error) {
      this.setState({ isLoading: false })
    }
  }

  _onSubmit = () => {
    const { description } = this.state
    const { navigation, userInfo } = this.props
    var helpError = {}
    if (!description) {
      helpError['description'] = strings('Should_not_be_empty');
    } else if (description && description.length > 300) {
      helpError['description'] = ''; 
    }
    if (!_.isEmpty(helpError)) {
      this.setState({ helpError })
    } else {
      let data = {
        note: description,
        userGroupName: this.itemDetails.userOrGroupName,
        flag: 'REPORT_USER_GROUP',
        reportedUserId: this.state.reportId,
      }
      this.setState({ isFromLongPress: false })
      this.onReport(data, userInfo.token);
      // navigation.dispatch(HelpActions.addHelpRequest(data, userInfo.token));
    }
  }

  saveMedia = async (item) => {
    if (Platform.OS === "android" && !(await this.hasAndroidPermission())) {
      return;
    }
    if (Platform.OS === 'android') {
        RNFetchBlob.config({
          fileCache: true,
          appendExt: 'png',
        })
          .fetch('GET', item.image)
          .then(res => {
            const DirectoryPath= RNFS.ExternalStorageDirectoryPath +'/'+ appFolder;
            var promise = CameraRoll.save(res.data, { album: DirectoryPath})  //for android
            promise.then(function (result) {
              // console.log('save succeeded ', + result);
              Toast.show(strings("save_succeeded"))
            }).catch(function (error) {
              // console.log('save failed ' + error);
              Toast.show(strings("save_failed"))
            });
           })
      }
    else {
      var promise = CameraRoll.save(item.image, { album: 'Hobiz' })  //for ios
      promise.then(function (result) {
        // console.log('save succeeded ', + result);
        Toast.show(strings("save_succeeded"))
      }).catch(function (error) {
        // console.log('save failed ' + error);
        Toast.show(strings("save_failed"))
      });
    }
  }

  hasAndroidPermission = async () => {
    const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
    const hasPermission = await PermissionsAndroid.check(permission);
    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(permission);
    return status === 'granted';
  }

  renderBubble = props => (
    <Bubble
      {...props}
      conversationType={this.conversationType}
      ondeleteMessage={this.deleteMessage.bind(this)}
      onsaveMedia={this.saveMedia.bind(this)}
      userRole={this.itemDetails.userRole}
      isAdmin={this.itemDetails.isAdmin}
      onOpenReports={(id, user) => this.setState({ reportId: id, ModalShow: true, reportedUser: user, isFromLongPress: true })}
    />
  )

  renderActions = props => (
    this.state.cannotParticipate ? null :
    <Actions {...props} containerStyle={{justifyContent:'center',alignItems:'center'}}
    icon={()=>
      <Attachment width={24} height={24} fill={'orange'}/>}/>
  )

  showLocationOnScreen = (lat,long) => {
    const { navigation, language } = this.props;
    navigation.push('SharedLocation',{theme: this.props.displayDetail.themes.toLowerCase(), latitude:lat,longitude:long, sharedLocation: true, isRTL: isRtl(language)});
  }

  renderPrivateToolbal = (props)=>{
    var textColor = props.theme.toLowerCase() == 'dark' ? 'white' : Colors.black;
    return (
      <View style={{justifyContent:'center',alignItems:'center',marginLeft:15,marginRight:15,textAlign:'center'}}>
        <Text style={{color:textColor}}>
          {strings("Private_Group_Cant_Msg")}
        </Text>
      </View>
    )
  }

  // renderAvatarPressBar = () => {
  //   return (
  //     <TouchableOpacity style={{...styles.button,borderTopWidth:index === 0 ? 0 : 0.3}} onPress={btn.action}>
  //     {btn.img}
  //     <Text numberOfLines={1} ellipsizeMode={'tail'} style={{marginHorizontal:10,fontSize:getDynamicSize(15),color:btn.titleColor ? btn.titleColor : Colors.primary}}>
  //         {strings(btn.title)}
  //     </Text>
  // </TouchableOpacity>
  //   )
  // }


  render() {
    const { messages, loadEarlier, inputText } = this.state;
    const {
      userInfo, user, fetching, displayDetail, chatFetching
    } = this.props;
    const isRTL = I18nManager.isRTL;
    var newUserInfo = _.cloneDeep(userInfo);
    newUserInfo.user.profilePicture = getThumbnail(newUserInfo.user.profilePicture)

    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Theme.View style={styles.container}>
          {
            chatFetching && loadEarlier === false ?
              <View style={[styles.loaderContainer]}>
                <ActivityIndicator size="small" color="#ff8003" />
              </View>
              :
              <GiftedChat
                isRTL={isRTL}
                text={inputText}
                textInputProps={{ textAlign: isRTL ? 'right' : 'left' }}
                messages={messages}
                placeholder={strings('Type_a_message')}
                renderAvatarOnTop
                alwaysShowSend
                showUserAvatar
                loadEarlier={loadEarlier}
                onLoadEarlier={this.onLoadEarlier}
                onInputTextChanged={text => this.setState({ inputText: text })}
                renderMessageText={!fetching && this.renderMessageText}
                showAvatarForEveryMessage
                onPressAvatar={this.onPressAvatar}
                onLongPressAvatar={(item) => {
                  if(item._id !== this.props.userInfo.user.id) { 
                  this.setState({isFromLongPress: true, reportedUser: item, reportId: item._id, showActions: true });
                  this.showActionSheet();
                }}}
                onSend={messages => this.onSend(messages)}
                user={{
                  _id: this.user.id,
                  name: this.user.fullName,
                  avatar: this.user && this.user.profilePicture !== 'null' ? getThumbnail(this.user.profilePicture) : renderAvatar(this.user.gender),
                }}
                usernameStyle={{fontSize: getDynamicSize('15'),color:colors.grey}}
                renderUsernameOnMessage={this.itemDetails.conversationType !== 'PERSONAL' ? true : false}
                renderBubble={this.renderBubble}
                renderActions={this.renderActions}
                renderInputToolbar={this.state.cannotParticipate || !(this.isActive) ? this.renderPrivateToolbal : false}
                onLocationSelect={this.showLocationOnScreen}
                userDetails={newUserInfo}
                onPressActionButton={() => {
                  this.setState({showActions: false})
                  this.showActionSheet();
                }}
                theme={displayDetail && displayDetail.themes.toLowerCase() == 'dark' ? 'dark' : 'light'}
                saveMedia={this.saveMedia}
              />
          }
          {this.state.cannotParticipate ? null :  
          <ActionSheet
            ref={o => this.ActionSheet = o}
            styles={actionSheetStyles}
            options={!this.state.showActions ? [
              <View style={{flexDirection:'row', justifyContent:'space-evenly'}}><Camera width={20} height={20}/><Text style={{marginLeft:10,fontSize:20,color:'#FBA54D'}}>{strings('Camera')}</Text></View>,
              <View style={{flexDirection:'row', justifyContent:'space-evenly'}}><Gallery width={20} height={20}/><Text style={{marginLeft:10,fontSize:20,color:'#FBA54D'}}>{strings('Gallery')}</Text></View>,
              <View style={{flexDirection:'row', justifyContent:'space-evenly'}}><Pin width={20} height={20}/><Text style={{marginLeft:10,fontSize:20,color:'#FBA54D'}}>{strings('Location')}</Text></View>,
              strings('Cancel')] : [
                <View style={{flexDirection:'row', justifyContent:'space-evenly'}}><ReportIcon width={imageSize} height={imageSize} style={{marginTop: 7}}/><Text style={{marginLeft:10,fontSize:20,color:'#FBA54D'}}>{strings('Report')}</Text></View>,
                strings('Cancel')]}
            cancelButtonIndex={!this.state.showActions ? 3 : 1}
            destructiveButtonIndex={!this.state.showActions ? 3 : 1}
            onPress={(index) => { this.showOption(index); }}
          />}
          {this.screen === 'group-chat' ?  <TouchableOpacity
                  onPress={() => this.getMessages()}
                  style={{ position: 'absolute', top: 0, right: 0 }}>
                  <Image
                    style={{ width: hp('4%'), height: hp('4%'), tintColor: '#ff8003' }}
                    source={Images.iconRefresh}
                  />
                </TouchableOpacity> : null}
                <CustomContactUsModal
                  title={strings('Report_User')}
                  field1Label={strings('User/group_name')}
                  field2Label={strings('Event_Name')}
                  isVisible={this.state.ModalShow}
                  error={this.state.helpError.description}
                  description={this.state.description}
                  onDescriptionChange={description => this.setState({ description })}
                  onClose={() => this.setState({
                    ModalShow: false, description: '', helpError: {},
                  })}
                  onSubmit={this._onSubmit}
                  displayDetail={this.props.displayDetail}
                  submitFetching={this.state.isLoading}
              />
             <FinalModal 
                isVisible={this.state.isFinalModalVisible}
                displayDetail={this.props.displayDetail}
                onPressButton={() => this.setState({ isFinalModalVisible: false })}
              />
        </Theme.View>
      </SafeAreaView>
    );
  }
}

const mapStateToProps = state => ({
  displayDetail: state.settings.displayDetail,
  isRTL: state.settings.isRTL,
  userChat: state.messages.userChat,
  userGroupChat: state.messages.userGroupChat,
  fetching: state.messages.fetching,
  chatFetching: state.messages.chatFetching,
  language: state.language.language,
  userInfo: state.auth.userDetails,
  user: state.auth.user,
  message: state.settings.message,
  messageFromAPI: state.messages.message,
  receivedNewMessage: state.messages.newMessage,
  deleteMesage: state.messages.deleteMessage,
  deleteSuccess: state.messages.deleteSuccess,
  messageData: state.messages.messageData,
  messageSent: state.messages.messageSent,
  groupMessageData: state.messages.groupMessageData,
  groupProfile: state.groups.groupProfile,
  eventDetails: state.events.eventDetails,
  addHelp: state.help.addHelp,
  addHelpMessage: state.help.addHelpMessage,
  fetchingHelp: state.help.fetching,
});

const mapDispatchToProps = dispatch => ({
  navigate: bindActionCreators(NavigationActions.navigate, dispatch),
  dispatch,
});

export default connect(mapStateToProps, mapDispatchToProps)(MessageDetailScreen);