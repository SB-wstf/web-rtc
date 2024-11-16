import React, { createContext, useMemo, useContext } from "react";
import { io } from "socket.io-client";
const ENDPOINT = process.env.REACT_APP_BACKEND_URL;

const SocketContext = createContext(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

export const SocketProvider = (props) => {
  const socket = useMemo(() => io(ENDPOINT), []);

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};
