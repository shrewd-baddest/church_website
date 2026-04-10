import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ChatEventEnum } from "../constant.js";
import { ApiError } from "../utils/ApiError.js";
import { testDb } from "../Configs/dbConfig.js";

// handle join to specific jumuia based on the users jumuia
const HandleOnSpecificJumuiJoin = (socket, user) => {
  socket.on(ChatEventEnum.JOIN_INDIVIDUAL_JUMUIA_EVENT, (jumuiyaId) => {
    if (user?.jumuiya_id !== jumuiyaId) {
      console.warn(`Unauthorized join attempt by ${socket.id} for ${jumuiyaId}`);
      return;
    }
    socket.join(jumuiyaId);
  });
};

// Handle CSA notifications
const handleNotifyCSA = (socket, io) => {
  socket.on(ChatEventEnum.NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT, (message) => {
    io.to("CSA_NOTIFICATIONS").emit(ChatEventEnum.NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT, message);
    console.log(`CSA notification sent to room CSA_NOTIFICATIONS event: ${ChatEventEnum.NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT}`);
  });
};

// Handle Jumuia notifications
const handleNotifyJumuia = (socket, io) => {
  socket.on(
    ChatEventEnum.NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT,
    ({ jumuiaName, message }) => {
      io.to(jumuiaName).emit(ChatEventEnum.NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT, message);
      console.log(`Jumuia notification sent to room ${jumuiaName} event: ${ChatEventEnum.NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT}`);
    },
  );
};

const initializeSocketIO = (io) => {
  return io.on(ChatEventEnum.CONNECTED_EVENT, async (socket) => {
    try {
      // parse the cookies from the handshake headers (This is only possible if client has `withCredentials: true`)
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
      // // cookie.parse not that nessesary here because on our entry point we used the cookieParser middleware ,but to  make it 100% sure for the parse i intentionally used it here

      let token = cookies?.accessToken || socket.handshake.auth?.token; // get the accessToken

      if (!token) {
        throw new ApiError(401, "Un-authorized handshake. Token is missing");
      }

      const { id: member_id, jumuiya_id } = jwt.verify(token, process.env.JWT_SECRET);
      // // reason why we are checking the database is to really indentify 
      // // the user and also to make sure that the token is not tampered with , because if the token is tampered with it will be decoded but the user will not be found in the database thus we can reject the connection  
      // // and be able to remove the disconnected socket from the room from the disconect event handler
      // // we are only checking the member_id and jumuiya_id because those are the only two things we need to identify the user and also to make sure that the token is not tampered with 
      // // because if the token is tampered with it will be decoded but the user will not be found in the database thus we can reject the connection
      const query = ` SELECT member_id, jumuiya_id FROM members WHERE member_id =$1 AND jumuiya_id =$2`;

      const result = await testDb.query(query, [member_id, jumuiya_id]);

      if (result.rows.length === 0) {
        throw new ApiError(401, "Un-authorized handshake. Token is invalid");
      }

      socket.user = result.rows[0];

      // We are creating a room called " CSA_NOTIFICATIONS ", by default we are joining any authenticated user
      //  to it , this will handle or csa based notifications
      socket.join("CSA_NOTIFICATIONS"); //join the socket object to the above mentioned room by default
      socket.emit(ChatEventEnum.CONNECTED_EVENT); // emit the connected event so that client is aware

      // function to handle specific jumia notifications
      HandleOnSpecificJumuiJoin(socket, socket.user);

      // Attach notification handlers
      handleNotifyCSA(socket, io);
      handleNotifyJumuia(socket, io);


      // ?this handle disconnection , incase of wifi disconnects , or the serve is unhealthy/crushes or close the browser , thus not reachable this will definetly run 
      socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
        console.log("user has disconnected 🚫. socketId: " + socket.id);
        // we can also do some clean up here if we have any resources that we need to clean up when the user disconnects like removing the socket from the room or 
        // something like that but in our case we are not doing anything because socket.io will automatically remove the socket from the room when it disconnects so we don't have to worry about that
      });
    } catch (error) {
      socket.emit(
        ChatEventEnum.SOCKET_ERROR_EVENT,
        error?.message ||
        "Something went wrong while connecting to the socket.",
      );
    }
  });
};

/**
 * @param {string} roomId - Room where the event should be emitted note this can be either the jumui room / only jumui memebers specific to that room  can see , or the whole csa room where in regards to the jumuia  you are can see this
 * @param {AvailableChatEvents[0]} event - Event that should be emitted
 * @param {any} payload - Data that should be sent when emitting the event
 * @description Utility function responsible to abstract the logic of socket emission via the io instance
 */

let ioInstance;
const setSocketInstance = (io) => {
  ioInstance = io;
};
const emitSocketEvent = (roomId, event, payload) => {
  if (!ioInstance) {
    console.error("Socket.io not initialized");
    return;
  }
  ioInstance.to(roomId).emit(event, payload);
};

export { initializeSocketIO, emitSocketEvent, setSocketInstance };
