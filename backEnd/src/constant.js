export const API_BASE = '/api';
export const UPLOAD_PATH = 'localFileUploads';
export const DEFAULT_PAGE_SIZE = 10;
export const ELECTION_TERM_DURATION = 2; // years

/**
 * @description set of events that we are using in chat app. more to be added as we develop the chat app
 */

export const ChatEventEnum = Object.freeze({//where .freeze is used for predictability and immutability. exactrly doing the following function you cannot add, remove, or change properties.
    //- Event names are critical identifiers in a chat app. If someone accidentally changes "connected" to "connectd", sockets will break. Freezing prevents that.
  // ? once user is ready to go
  CONNECTED_EVENT: "connected",
  // ? when user gets disconnected
  DISCONNECT_EVENT: "disconnect",
  // ?  when user joins respective jumuia
  JOIN_INDIVIDUAL_JUMUIA_EVENT:"joinIndividualJumuia",
  //? event to notify user on csa notification
  NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT:"csaNotification",
  //? event to notify user on specific Jumui notification
  NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT:"jumuiyaNotification",
  // ? when new Notification is received, 
  NOTIFICATION_RECEIVED_EVENT: "notificationReceived",
// when a notification is being updated due to uncertainities
  NOTIFICATION_UPDATED_EVENT :"notificationUpdated",
  // ? when there is an error in socket
  SOCKET_ERROR_EVENT: "socketError",

  QUESTION_ATTEMPT_EVENT:"attemptRecorded",
  // ? when Notification is deleted
  NOTIFICATION_DELETE_EVENT: "notificationDeleted",
});

export const AvailableChatEvents = Object.values(ChatEventEnum);

// for this we should ensure any notification is not biased , no stale Notifications 
// when an admin delete a Notification we should not see the stale notification , when it is added we should see immediately like a chat app
