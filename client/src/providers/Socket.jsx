import React, { useMemo } from "react";
import { io } from "socket.io-client";

const SocketContext = React.createContext(null);

export const useSocket = () => {
    return React.useContext(SocketContext);
};

export const SocketProvider = (props) => {
    const socket = useMemo(
        () => io("https://6c83-2401-4900-8841-c84-f874-caf5-27d2-b3da.ngrok-free.app"),
        []
    );
    return <SocketContext.Provider value={{ socket }}>{props.children}</SocketContext.Provider>;
};
