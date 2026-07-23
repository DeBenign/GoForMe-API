import { io } from "socket.io-client"
import { BASE_URL, getTokens } from "./api"

// Socket.IO listens on the server root, not the /api/v1 REST prefix.
const SOCKET_URL = BASE_URL.replace(/\/api\/v1\/?$/, "")

let socket = null

export function getSocket() {
  if (socket) return socket
  const { accessToken } = getTokens()
  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    autoConnect: false,
    transports: ["websocket"],
  })
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}