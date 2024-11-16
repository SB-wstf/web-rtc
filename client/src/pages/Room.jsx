import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../providers/Socket";
import { usePeer } from "../providers/Peer";
import ReactPlayer from "react-player";

const RoomPage = () => {
    const { socket } = useSocket();
    const { peer, createOffer, createAnswer, setRemoteAns, sendStream, remoteStream } = usePeer();

    const [myStream, setMyStream] = useState(null);
    const [remoteEmailId, setRemoteEmailId] = useState(null);

    const handleNewUserjoined = useCallback(
        async (data) => {
            const { emailId } = data;
            console.log("New user joined Room", emailId);
            const offer = await createOffer();
            socket.emit("call-user", { emailId, offer });
            setRemoteEmailId(emailId);
        },
        [createOffer, socket]
    );

    const handleIncomingCall = useCallback(
        async (data) => {
            const { from, offer } = data;
            console.log("Incoming Call ", from, offer);
            const ans = await createAnswer(offer);
            socket.emit("call-accept", { emailId: from, ans });
            setRemoteEmailId(from);
        },
        [createAnswer, socket]
    );

    const handleCallAccepted = useCallback(
        async (data) => {
            const { ans } = data;
            console.log("call got accepted", ans);
            await setRemoteAns(ans);
            sendStream(myStream);
        },
        [setRemoteAns, sendStream, myStream]
    );

    const getUserMediaStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            setMyStream(stream);
        } catch (error) {
            console.error("Error accessing media devices", error);
        }
    }, []);

    const handleNegotiationNeeded = useCallback(async () => {
        console.log("negotiationneeded ***");
        const offer = await createOffer();
        socket.emit("negotiation-needed", { offer, to: remoteEmailId });
    }, [socket, remoteEmailId, createOffer]);

    const handleNegotiationIncoming = useCallback(
        async (data) => {
            const { from, offer } = data;
            const ans = await createAnswer(offer);
            socket.emit("negotiation-done", { ans, to: from });
        },
        [createAnswer, socket]
    );

    const handleNegotiationFinal = useCallback(
        async (data) => {
            const { ans, from } = data;
            await setRemoteAns(ans);
        },
        [setRemoteAns]
    );

    useEffect(() => {
        socket.on("user-joined", handleNewUserjoined);
        socket.on("incoming-call", handleIncomingCall);
        socket.on("call-accepted", handleCallAccepted);
        socket.on("negotiation-needed", handleNegotiationIncoming);
        socket.on("negotiation-final", handleNegotiationFinal);

        return () => {
            socket.off("user-joined", handleNewUserjoined);
            socket.off("incoming-call", handleIncomingCall);
            socket.off("call-accepted", handleCallAccepted);
            socket.off("negotiation-needed", handleNegotiationIncoming);
            socket.off("negotiation-final", handleNegotiationFinal);
        };
    }, [
        socket,
        handleNewUserjoined,
        handleIncomingCall,
        handleCallAccepted,
        handleNegotiationIncoming,
        handleNegotiationFinal,
        myStream,
    ]);

    useEffect(() => {
        console.log("Setting up negotiationneeded listener");
        peer.addEventListener("negotiationneeded", handleNegotiationNeeded);

        return () => {
            peer.removeEventListener("negotiationneeded", handleNegotiationNeeded);
        };
    }, [peer, handleNegotiationNeeded]);

    useEffect(() => {
        getUserMediaStream();
    }, [getUserMediaStream]);

    console.log("myStream", myStream);
    console.log("remoteStream", remoteStream);
    return (
        <div>
            <h1>Room Page</h1>
            {myStream && <button onClick={() => sendStream(myStream)}>Send Stream</button>}
            <h6>My Stream</h6>
            <ReactPlayer url={myStream} playing muted />
            <h6>Remote Stream</h6>
            <ReactPlayer url={remoteStream} playing />
        </div>
    );
};

export default RoomPage;
