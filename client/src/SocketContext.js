import React, {createContext,useContext,useRef,useEffect, useState} from "react";
import {io} from 'socket.io-client'
import Peer from "simple-peer";
import { signal } from "nodemon/lib/config/defaults";

const SocketContext = createContext();

const socket = io('http://localhost:5000');

const ContextProvider = ({ children}) => {
    const [stream,setStream] = useState(null);
    const [me,setMe] = useState('');
    const [ call, setCall] = useState({})
    const [callAccepted, setcallAccepted] = useState(false)
    const [callEnded, setcallEnded] = useState(false)
    const [name,setname] = useState(' ')

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useState();

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true})
        .then((currentStream) => {
            setStream(currentStream);

            myVideo.current.srcObject = currentStream;
        })

        socket.on('me', (id) => setMe(id))
        socket.on('calluser', ({from,name: callerName, signal}) => {
            setCall({isReceivedCall: true, from,name: callerName,signal})

        })
        
    }, [])

    const answercall = () => {
        setcallAccepted(true)

        const peer = new Peer({ initiator:false, trickle: false, stream});

        peer.on('signal',(data) => {
            socket.emit('answercall', {signal: data, to: call.from}   )

        });

        peer.on('stream', (currentStream) => {
            userVideo.current.srcObject = currentStream;
        })

        peer.signal(call.signal);

        connectionRef.current = peer;

    }

    const callUser = (id) => {
        const peer = new Peer({ initiator:true, trickle: false, stream});
        peer.on('signal',(data) => {
            socket.emit('calluser', {userToCall: id,signalData:data, from:me,}   )

        });

        peer.on('stream', (currentStream) => {
            userVideo.current.srcObject = currentStream;
        })

        socket.on('callaccepted', (signal) => {
            setcallAccepted(true);

            peer.signal(signal)
        });

        connectionRef.current = peer;

    }

    const leaveCall = () => {
        setcallEnded(true);

        connectionRef.current.destroy();

        window.location.reload();

    }

    return (
        <SocketContext.Provider value={{
            call,
            callAccepted,
            myVideo,
            userVideo,
            stream,
            name,
            setname,
            callEnded,
            me,
            callUser,
            leaveCall,
            answercall,
        }}> {children}</SocketContext.Provider>
    )
}

export {ContextProvider, SocketContext}