// board.js
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const strokeLineWidth = document.getElementById('strokeLineWidth');
const eraserButton = document.getElementById('eraserButton');
const penButton = document.getElementById('penButton');

// 按下标志，一开始设为false（没有开始画）
let isOnOff = false;

// 画笔原位置
let OldX = null;
let OldY = null;

// 画笔颜色为黑色
let lineColor = '#000';

// 设置画笔大小
let lineWidth = 5;
strokeLineWidth.value = lineWidth; // 初始化

// 是否处于橡皮擦模式
let isEraserMode = false;

// 添加监听鼠标的事件
// 鼠标移动事件
canvas.addEventListener('mousemove', draw, false);
// 鼠标按下事件
canvas.addEventListener('mousedown', down, true);
// 鼠标松开事件
canvas.addEventListener('mouseup', up, false);

// 切换到橡皮擦模式
eraserButton.addEventListener('click', () => {
    isEraserMode = true;
    eraserButton.classList.add('active');
    penButton.classList.remove('active');
});

// 切换到画笔模式
penButton.addEventListener('click', () => {
    isEraserMode = false;
    penButton.classList.add('active');
    eraserButton.classList.remove('active');
});

function down(event) {
    isOnOff = true;
    OldX = event.clientX - canvas.offsetLeft;
    OldY = event.clientY - canvas.offsetTop;
}

function up() {
    isOnOff = false;
}

function draw(event) {
    if (isOnOff) {
        let newX = event.clientX - canvas.offsetLeft;
        let newY = event.clientY - canvas.offsetTop;

        ctx.beginPath();
        ctx.moveTo(OldX, OldY);
        ctx.lineTo(newX, newY);
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round'; // 画笔末端样式

        if (isEraserMode) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)'; // 使用全透明的黑色来擦除
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = lineColor;
        }

        ctx.stroke();

        // 发送绘图数据
        sendDrawData({
            startX: OldX,
            startY: OldY,
            endX: newX,
            endY: newY,
            color: isEraserMode ? 'eraser' : lineColor,
            width: lineWidth
        });

        OldX = newX;
        OldY = newY;
    }
}

strokeLineWidth.oninput = function () {
    lineWidth = strokeLineWidth.value;
};

document.getElementById('colorPicker').addEventListener('change', function(e) {
    lineColor = e.target.value;
});

document.getElementById('save').addEventListener('click', () => {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'drawing.png';
    link.click();
});

document.getElementById('load').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };
    input.click();
});

const socket = io('http://localhost:3000'); // 替换为实际的服务器地址和端口

// 监听连接状态变化
socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected from server:', reason);
});

// 发送绘图数据到服务器
function sendDrawData(data) {
    console.log('Sending draw data:', data); // 调试信息
    socket.emit('draw', data);
}

// 接收其他客户端的绘图数据
socket.on('draw', (data) => {
    console.log('Received draw data from server:', data); // 调试信息
    const { startX, startY, endX, endY, color, width } = data;
    drawLine(startX, startY, endX, endY, color, width);
});

// 绘制线条的辅助函数
function drawLine(startX, startY, endX, endY, color, width) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.lineWidth = width;
    ctx.lineCap = 'round'; // 画笔末端样式

    if (color === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)'; // 使用全透明的黑色来擦除
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
    }

    ctx.stroke();
}

// 确保画布填充整个窗口并加载服务器上的绘图数据
window.onload = async () => {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    // 保存画布内容的数据URL
    let canvasDataUrl;

    // 初始化画布尺寸
    resizeCanvas();

    // 加载用户绘画数据
    const userId = getCustomId(); // 获取用户的唯一ID
    await loadDrawingsFromServer(userId); // 使用 await 确保在调整画布大小后加载数据

    // 监听窗口大小变化
    window.addEventListener('resize', resizeCanvas);

    function resizeCanvas() {
        // 保存当前画布内容
        canvasDataUrl = canvas.toDataURL();

        // 更新画布尺寸
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // 从数据URL恢复画布内容
        const img = new Image();
        img.src = canvasDataUrl;
        img.onload = function() {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
    }
};
// // 合并 onload 事件处理程序
// window.onload = () => {
//     // 初始化画布尺寸
//     resizeCanvas();

//     const userId = 'unique_user_id'; // 确保每个用户有一个唯一的ID
//     loadDrawingsFromServer(userId);
// };
// // 确保画布填充整个窗口
// window.onload = function() {
//     const canvas = document.getElementById('myCanvas');
//     const ctx = canvas.getContext('2d');

//     // 保存画布内容的数据URL
//     let canvasDataUrl;

//     // 初始化画布尺寸
//     resizeCanvas();

//     // 监听窗口大小变化
//     window.addEventListener('resize', resizeCanvas);

//     function resizeCanvas() {
//         // 保存当前画布内容
//         canvasDataUrl = canvas.toDataURL();

//         // 更新画布尺寸
//         canvas.width = window.innerWidth;
//         canvas.height = window.innerHeight;

//         // 从数据URL恢复画布内容
//         const img = new Image();
//         img.src = canvasDataUrl;
//         img.onload = function() {
//             ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
//         };
//     }
// };

// board.js

function saveDrawingToServer(userId, data) {
    fetch('/api/save-drawing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, data })
    })
    .then(response => response.json())
    .then(result => {
      console.log('Drawing saved:', result);
    })
    .catch(error => console.error('Error saving drawing:', error));
  }
  
async function loadDrawingsFromServer(userId) {
    try {
        const response = await fetch(`/api/get-drawings/${userId}`);
        const drawings = await response.json();

        // 在画布上重绘每条记录
        drawings.forEach(draw => drawOnCanvas(draw.drawing_data));
    } catch (error) {
        console.error('Error loading drawings:', error);
    }
}
  
function drawOnCanvas(data) {
    // 解析绘图数据并绘制到画布上
    data.forEach(stroke => {
        drawLine(stroke.startX, stroke.startY, stroke.endX, stroke.endY, stroke.color, stroke.width);
    });
}


async function setCustomId(userId, customId) {
    try {
        const response = await fetch('/api/set-custom-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, customId })
        });

        const data = await response.json();
        if (data.success) {
            alert('Custom ID set successfully!');
            localStorage.setItem('customId', customId); // 保存到本地存储
        } else {
            alert(data.message || 'Failed to set Custom ID.');
        }
    } catch (error) {
        console.error('Error setting custom ID:', error);
    }
}

function getCustomId(userId) {
    let customId = localStorage.getItem('customId');
    if (!customId) {
        // 调用API获取customId并保存到本地存储
        fetch(`/api/get-custom-id/${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    customId = data.customId;
                    localStorage.setItem('customId', customId);
                } else {
                    console.error(data.message);
                }
            })
            .catch(error => console.error('Error fetching custom ID:', error));
    }
    return customId;
}
