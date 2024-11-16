import React, { useCallback, useEffect, useMemo, useState } from "react";

const peerContext = React.createContext(null);
export const usePeer = () => React.useContext(peerContext);

export const PeerProvider = (props) => {
    const [remoteStream, setRemoteStream] = useState(null);

    const peer = useMemo(
        () =>
            new RTCPeerConnection({
                iceServers: [
                    {
                        urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"],
                    },
                ],
            }),
        []
    );

    const createOffer = async () => {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(new RTCSessionDescription(offer));
        return offer;
    };

    const createAnswer = async (offer) => {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(new RTCSessionDescription(answer));
        return answer;
    };

    const setRemoteAns = async (ans) => {
        await peer.setRemoteDescription(new RTCSessionDescription(ans));
    };

    const sendStream = async (stream) => {
        const tracks = stream.getTracks();
        for (const track of tracks) {
            peer.addTrack(track, stream);
        }
    };

    const handleTrackEvent = useCallback(
        (ev) => {
            console.log("GOT TRACKS!!");
            const streams = ev.streams;
            setRemoteStream(streams[0]);
        },
        [peer, setRemoteStream]
    );

    const handleNegotiationNeeded = useCallback(() => {
        console.log("negotiation needed ******");
    }, []);

    useEffect(() => {
        peer.addEventListener("track", handleTrackEvent);
        // peer.addEventListener("negotiationneeded", handleNegotiationNeeded);

        return () => {
            peer.removeEventListener("track", handleTrackEvent);
            // peer.removeEventListener("negotiationneeded", handleNegotiationNeeded);
        };
    }, [peer, handleTrackEvent]);

    return (
        <peerContext.Provider
            value={{ peer, createOffer, createAnswer, setRemoteAns, sendStream, remoteStream }}
        >
            {props.children}
        </peerContext.Provider>
    );
};
