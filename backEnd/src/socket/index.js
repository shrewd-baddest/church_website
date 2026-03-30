import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ChatEventEnum } from "../constant.js";
import { ApiError } from "../utils/ApiError.js";
import { testDb } from "../Configs/dbConfig.js";

// handle join to specific jumuia based on the users jumuia
const HandleOnSpecificJumuiJoin = (socket, user) => {
  socket.on(ChatEventEnum.JOIN_INDIVIDUAL_JUMUIA_EVENT, (jumuiaName) => {
    if (user?.jumuiya_name !== jumuiaName) {
      console.warn(`Unauthorized join attempt by ${socket.id} for ${jumuiaName}`);
      return;
    }
    socket.join(jumuiaName);
    console.log(`${socket.id} joined Jumuia: ${jumuiaName}`);
  });
};

// Handle CSA notifications
const handleNotifyCSA = (socket, io) => {
  socket.on(ChatEventEnum.NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT, (message) => {
    io.to("CSA_NOTIFICATIONS").emit("notification", { group: "CSA", message });
    console.log(`CSA notification sent: ${message}`);
  });
};

// Handle Jumuia notifications
const handleNotifyJumuia = (socket, io) => {
  socket.on(
    ChatEventEnum.NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT,
    ({ jumuiaName, message }) => {
      io.to(jumuiaName).emit("notification", { group: jumuiaName, message });
      console.log(`Notification sent to Jumuia ${jumuiaName}: ${message}`);
    },
  );
};

const initializeSocketIO = (io) => {
  return io.on("connection", async (socket) => {
    try {
      // parse the cookies from the handshake headers (This is only possible if client has `withCredentials: true`)
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
      // cookie.parse not that nessesary here because on our entry point we used the cookieParser middleware ,but to  make it 100% sure for the parse i intentionally used it here

      let token = cookies?.accessToken || socket.handshake.auth?.token; // get the accessToken

      if (!token) {
        // Token is required for the socket to work
        throw new ApiError(401, "Un-authorized handshake. Token is missing");
      }

      const {member_id , jumuia_id} = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // decode the token

      const query = ` SELECT member_id FROM members WHERE member_id =$1 AND jumuia_id =$2` ;

      const result = await testDb.query(query, [member_id , jumuia_id  ]);

      if (result.rows.length === 0) {
        throw new ApiError(401, "Un-authorized handshake. Token is invalid");
      }

      socket.user = result.rows.length[0];

      // We are creating a room called " CSA_NOTIFICATIONS ", by default we are joining any authenticated user
      //  to it , this will handle or csa based notifications
      socket.join("CSA_NOTIFICATIONS"); //join the socket object to the above mentioned room by default
      socket.emit(ChatEventEnum.CONNECTED_EVENT); // emit the connected event so that client is aware

      // function to handle specific jumia notifications
      HandleOnSpecificJumuiJoin(socket, user);

      // Attach notification handlers
      handleNotifyCSA(socket, io);
      handleNotifyJumuia(socket, io);

      // ?this handle disconnection , incase of wifi disconnects , or the serve is unhealthy , thus not reachable this will definetly run 
      socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
        console.log(
          "user has disconnected 🚫. userId: " + socket.user?.member_id,
        );
        if (socket.user?.member_id) {
          socket.leave(socket.user.member_id);
        }
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
 *
 * @param {import("express").Request} req - Request object to access the `io` instance set at the entry point
 * @param {string} roomId - Room where the event should be emitted note this can be either the jumui room / only jumui memebers specific to that room  can see , or the whole csa room where in regards to the jumuia  you are can see this
 * @param {AvailableChatEvents[0]} event - Event that should be emitted
 * @param {any} payload - Data that should be sent when emitting the event
 * @description Utility function responsible to abstract the logic of socket emission via the io instance
 */

const emitSocketEvent = (req, roomId, event, payload) => {
  req.app.get("io").in(roomId).emit(event, payload);
};

export { initializeSocketIO, emitSocketEvent };
