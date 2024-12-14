// video.js
import SimpleWebRTC from 'simplewebrtc';

// 创建SimpleWebRTC实例
const webrtc = new SimpleWebRTC({
    localVideoEl: 'localVideo',
    remoteVideosEl: 'videoContainer',
    autoRequestMedia: true
});

// 当有新用户加入通话时触发
webrtc.on('videoAdded', function (video, peer) {
    console.log('New user joined:', peer.id);
    const container = document.getElementById('videoContainer');
    container.appendChild(video);
});

// 当用户离开通话时触发
webrtc.on('videoRemoved', function (video, peer) {
    console.log('User left:', peer.id);
    video.remove();
});

// 当收到远程用户的视频流时触发（可选，可用于进一步处理视频流相关操作）
webrtc.on('streamAdded', function (stream) {
    console.log('New stream added:', stream.getId());
    // 可以在这里对新添加的视频流进行其他操作，如设置音量等
});

// 当本地视频流准备好时触发（可选，可用于显示本地视频相关提示）
webrtc.on('localStreamReady', function () {
    console.log('Local stream is ready.');
    const localVideo = document.getElementById('localVideo');
    localVideo.play();
});

// 开始视频通话
function startCall() {
    webrtc.joinRoom('your-room-id'); // 将 'your-room-id' 替换为实际的房间ID
}

// 点击时调用startCall函数开始通话
const startButton = document.getElementById('startButton');
startButton.addEventListener('click', startCall);