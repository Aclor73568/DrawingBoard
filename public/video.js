// video.js
// 视频通话功能
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startButton = document.getElementById('startButton');

let localStream;//存储用户的本地音视频流
let peerConnection;//用于建立和管理两个浏览器之间的连接
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };//ICE服务器

async function startCall() {
    console.log('Starting call...');
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        peerConnection = new RTCPeerConnection(configuration);

        peerConnection.addStream(localStream);

        peerConnection.onicecandidate = handleIceCandidate;
        peerConnection.ontrack = handleRemoteStreamAdded;

        createOffer();
    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
}

function createOffer() {
    console.log('Creating offer...');
    peerConnection.createOffer().then(setLocalAndSendMessage).catch(handleError);
}

function setLocalAndSendMessage(sessionDescription) {
    console.log('Setting local description and sending message...');
    peerConnection.setLocalDescription(sessionDescription);
    socket.emit('offer', { type: sessionDescription.type, sdp: sessionDescription.sdp });
}

function handleIceCandidate(event) {
    if (event.candidate) {
        console.log('Sending ICE candidate...');
        socket.emit('candidate', { candidate: event.candidate });
    }
}

function handleRemoteStreamAdded(event) {
    console.log('Remote stream added...');
    remoteVideo.srcObject = event.streams[0];
}

function handleError(error) {
    console.error('Error occurred.', error);
}

socket.on('offer', (data) => {
    console.log('Received offer:', data);
    peerConnection.setRemoteDescription(new RTCSessionDescription(data));
    peerConnection.createAnswer().then(setLocalAndSendMessage).catch(handleError);
});

socket.on('answer', (data) => {
    console.log('Received answer:', data);
    peerConnection.setRemoteDescription(new RTCSessionDescription(data));
});

socket.on('candidate', (data) => {
    console.log('Received candidate:', data);
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(handleError);
});

startButton.onclick = startCall;