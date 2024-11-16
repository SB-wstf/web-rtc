import React, { useMemo } from "react";
import { io } from "socket.io-client";
const ENDPOINT = process.env.REACT_APP_BACKEND_URL;

const SocketContext = React.createContext(null);

export const useSocket = () => {
  return React.useContext(SocketContext);
};

export const SocketProvider = (props) => {
  const socket = useMemo(() => io(ENDPOINT), []);
  return (
    <SocketContext.Provider value={{ socket }}>
      {props.children}
    </SocketContext.Provider>
  );
};
