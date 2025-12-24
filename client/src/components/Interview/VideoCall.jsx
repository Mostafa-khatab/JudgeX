import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { io } from 'socket.io-client';
import { Camera, CameraOff, Mic, MicOff, Monitor, MonitorOff } from 'lucide-react';

const VideoCall = ({ roomId, socketUrl }) => {
	const [stream, setStream] = useState(null);
	const [remoteStream, setRemoteStream] = useState(null);
	const [screenStream, setScreenStream] = useState(null);
	const [isMuted, setIsMuted] = useState(false);
	const [isCameraOff, setIsCameraOff] = useState(false);
	const [isScreenSharing, setIsScreenSharing] = useState(false);
	const socketRef = useRef();
	const myVideo = useRef();
	const userVideo = useRef();
	const screenVideo = useRef();
	const connectionRef = useRef();
	const screenConnectionRef = useRef();

	useEffect(() => {
		socketRef.current = io(socketUrl);

		navigator.mediaDevices
			.getUserMedia({ video: true, audio: true })
			.then((currentStream) => {
				setStream(currentStream);
				if (myVideo.current) {
					myVideo.current.srcObject = currentStream;
				}

				socketRef.current.emit('join-room', roomId);

				socketRef.current.on('user-joined', (userId) => {
					callUser(userId, currentStream);
				});

				socketRef.current.on('offer', ({ offer, from }) => {
					answerCall(offer, from, currentStream);
				});

				socketRef.current.on('answer', ({ answer }) => {
					if (connectionRef.current) {
						connectionRef.current.signal(answer);
					}
				});

				socketRef.current.on('ice-candidate', ({ candidate }) => {
					if (connectionRef.current) {
						connectionRef.current.signal(candidate);
					}
				});

				socketRef.current.on('screen-offer', ({ offer }) => {
					answerScreenShare(offer);
				});

				socketRef.current.on('screen-answer', ({ answer }) => {
					if (screenConnectionRef.current) {
						screenConnectionRef.current.signal(answer);
					}
				});

				socketRef.current.on('screen-stopped', () => {
					setScreenStream(null);
				});
			})
			.catch((err) => {
				console.error('Error accessing media devices:', err);
			});

		return () => {
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
			if (screenStream) {
				screenStream.getTracks().forEach((track) => track.stop());
			}
			if (connectionRef.current) {
				connectionRef.current.destroy();
			}
			if (screenConnectionRef.current) {
				screenConnectionRef.current.destroy();
			}
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
		};
	}, [roomId, socketUrl]);

	const callUser = (id, currentStream) => {
		const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });

		peer.on('signal', (data) => {
			socketRef.current.emit('offer', { roomId, offer: data });
		});

		peer.on('stream', (remoteStream) => {
			setRemoteStream(remoteStream);
			if (userVideo.current) {
				userVideo.current.srcObject = remoteStream;
			}
		});

		connectionRef.current = peer;
	};

	const answerCall = (offer, from, currentStream) => {
		const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });

		peer.on('signal', (data) => {
			socketRef.current.emit('answer', { roomId, answer: data });
		});

		peer.on('stream', (remoteStream) => {
			setRemoteStream(remoteStream);
			if (userVideo.current) {
				userVideo.current.srcObject = remoteStream;
			}
		});

		peer.signal(offer);
		connectionRef.current = peer;
	};

	const toggleMute = () => {
		if (stream && stream.getAudioTracks().length > 0) {
			const audioTrack = stream.getAudioTracks()[0];
			audioTrack.enabled = !audioTrack.enabled;
			setIsMuted(!audioTrack.enabled);
		}
	};

	const toggleCamera = () => {
		if (stream && stream.getVideoTracks().length > 0) {
			const videoTrack = stream.getVideoTracks()[0];
			videoTrack.enabled = !videoTrack.enabled;
			setIsCameraOff(!videoTrack.enabled);
		}
	};

	const toggleScreenShare = async () => {
		if (isScreenSharing) {
			// Stop screen sharing
			if (screenStream) {
				screenStream.getTracks().forEach((track) => track.stop());
			}
			if (screenConnectionRef.current) {
				screenConnectionRef.current.destroy();
			}
			setScreenStream(null);
			setIsScreenSharing(false);
			socketRef.current.emit('screen-stopped', { roomId });
		} else {
			// Start screen sharing
			try {
				const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
				setScreenStream(displayStream);
				setIsScreenSharing(true);

				// Create peer for screen sharing
				const screenPeer = new Peer({ initiator: true, trickle: false, stream: displayStream });

				screenPeer.on('signal', (data) => {
					socketRef.current.emit('screen-offer', { roomId, offer: data });
				});

				screenConnectionRef.current = screenPeer;

				// Handle when user stops sharing via browser button
				displayStream.getVideoTracks()[0].onended = () => {
					setScreenStream(null);
					setIsScreenSharing(false);
					socketRef.current.emit('screen-stopped', { roomId });
				};
			} catch (err) {
				console.error('Error sharing screen:', err);
			}
		}
	};

	const answerScreenShare = (offer) => {
		const screenPeer = new Peer({ initiator: false, trickle: false });

		screenPeer.on('signal', (data) => {
			socketRef.current.emit('screen-answer', { roomId, answer: data });
		});

		screenPeer.on('stream', (stream) => {
			setScreenStream(stream);
			if (screenVideo.current) {
				screenVideo.current.srcObject = stream;
			}
		});

		screenPeer.signal(offer);
		screenConnectionRef.current = screenPeer;
	};

	return (
		<div className="flex flex-col gap-2">
			{/* Screen Share Display */}
			{screenStream && (
				<div className="mb-2">
					<div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-purple-500">
						<video playsInline ref={screenVideo} autoPlay className="w-full h-full object-contain" />
						<div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
							<Monitor size={12} />
							Screen Share
						</div>
					</div>
				</div>
			)}

			{/* Video Participants */}
			<div className="grid grid-cols-2 gap-2">
				<div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-gray-700">
					<video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />
					<div className="absolute bottom-1 left-1 bg-black/70 px-2 py-0.5 rounded text-white text-xs">You</div>
				</div>
				{remoteStream && (
					<div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-green-500">
						<video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
						<div className="absolute bottom-1 left-1 bg-black/70 px-2 py-0.5 rounded text-white text-xs">Candidate</div>
					</div>
				)}
			</div>

			{/* Controls */}
			<div className="flex gap-2 justify-center mt-2">
				<button
					onClick={toggleMute}
					className={`p-2 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} hover:opacity-80 transition-all`}
					title={isMuted ? 'Unmute' : 'Mute'}
				>
					{isMuted ? <MicOff size={16} /> : <Mic size={16} />}
				</button>
				<button
					onClick={toggleCamera}
					className={`p-2 rounded-full ${isCameraOff ? 'bg-red-500' : 'bg-gray-700'} hover:opacity-80 transition-all`}
					title={isCameraOff ? 'Turn On Camera' : 'Turn Off Camera'}
				>
					{isCameraOff ? <CameraOff size={16} /> : <Camera size={16} />}
				</button>
				<button
					onClick={toggleScreenShare}
					className={`p-2 rounded-full ${isScreenSharing ? 'bg-purple-500' : 'bg-gray-700'} hover:opacity-80 transition-all`}
					title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
				>
					{isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
				</button>
			</div>
		</div>
	);
};

export default VideoCall;
