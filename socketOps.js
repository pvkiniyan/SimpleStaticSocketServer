const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const https = require('https');

const redisClient = require('./redisClientConnection');
const commonMethods = require('./commonMethods');
const smparser = require('./smParser');
const smencoder = require('./smEncoder');


let sockets = {};

let createPingFrame  = () => {
    let pingFrame = [];
    let pingPayload = 'ping';
    pingFrame[0] = 137;
    pingFrame[1] = pingPayload.length;
    for (var i = 0; i < pingPayload.length; i++){
        pingFrame.push(pingPayload.charCodeAt(i));
    }
    return pingFrame;
}

let pingFrame = [...createPingFrame()];

let checkSocketCall = (req,res) => {
    if((req.url.split('/'))[1] == 'getChannelToken' && req.method == "POST"){
        let body = '';
        req.on('data', (data) => body += data)
            .on('end', async () => {                 
                let postData = JSON.parse(Buffer.from(body).toString('utf8'));
                let {smbId, authId} = postData;
                let uuid = uuidv4();   
                let channelToken =  await checkUserAuthentication(authId) ?
                        jwt.sign({smbId,authId,uuid}, 'handlwithease')
                        : "User Not Authorised"
                res.end(channelToken);
                if(!(channelToken == "User Not Authorised")){
                    redisClient.client.multi().hmset(
                        `${smbId}:${uuid}`,
                        'channelToken', channelToken,
                        'smbId', smbId,
                        'authId', authId,
                        'uuid', uuid
                    ).sadd('users',smbId).exec((err) => console.log(err))
                }    
            })      
        return true 
    }
    if((req.url.split('/'))[1] == 'sendMessage' && req.method == "POST"){
        let body = '';
        req.on('data', (data) => body += data)
            .on('end', async () => {
                let data = JSON.parse(body)
                if(data.sendTo){
                    var senders = data.sendTo;
                    if(typeof senders === "string"){
                       await getUserSocketsAndSendMessage(senders, data.message);
                    } else {
                        for(let sender in senders){
                           await getUserSocketsAndSendMessage(senders[sender], data.message);
                        }
                    }
                }
                res.end('Message pushed to queue')
            })
        return true;
    }
    return false;
}

let getUserSocketsAndSendMessage = (userId,message) => {
    redisClient.client.keysAsync(`${userId}:*`).then((res) => {
        res.map((val,index) => {
            let uuid = (val.split(':'))[1];
            let socket = sockets[uuid];
            socket.write(Buffer.from(smencoder(message)),'utf8');
        })
    }).catch((err) => console.log(err))
}

let checkUserAuthentication = async (authId) => {
    let rootURL = 'https://test-v6-dot-myhandlr-backend.appspot.com/_ah/api/handlr/v11/login/rembermevalidation'
    let authStatus = false;
    await fetch(`${rootURL}`,{
        method: "post",
        headers: {
            authid: authId
        }
    }).then(res => {
        if(res.ok){
            return res.text();
        }
        else{
            throw res.statusText
        }
    }).then(res => authStatus = true).catch(err => authStatus = false)
    return authStatus;    
}

let connectSocket =  async (req,socket,head) => {
    let userData = await checkSocketAuthentication(req);
    if(!userData){
        socket.destroy();      
    }else{
        let hash = crypto.createHash('sha1');
        hash.update(`${req.headers['sec-websocket-key']}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`);
        let webSocketKey = hash.digest('base64');
        socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
            'Upgrade: WebSocket\r\n' +
            'Connection: Upgrade\r\n' +
            `Sec-WebSocket-Accept: ${webSocketKey}\r\n`+
            '\r\n');
        socket.uuid = userData.uuid;
        socket.smbId = userData.smbId;
        sockets[userData.uuid] = socket;
        handleSocketEvents(socket);
    }    
}


let checkSocketAuthentication =  async (req) => {
    let channelToken = (req.url.split('/'))[1];    
    let authStatus = false
    try{
        let decodedData = jwt.verify(channelToken, 'handlwithease');
        let {authId, smbId, uuid} = decodedData;
        await redisClient.client.hgetAsync(`${smbId}:${uuid}`, 'channelToken')
            .then(res =>authStatus = (res == channelToken) ? {uuid, smbId} : false)
            .catch(res => authStatus = false)
    }
    catch(err){
        return false;
    }
    return authStatus;
}

let handleSocketEvents = (socket) => {
    
    let ping = setInterval(() => {
        console.log(`pinging socket ${socket.uuid}`)
        socket.write(Buffer.from(pingFrame),'utf8');
    }, 60000);

    let destroySocket = () => {
        redisClient.client.del(`${socket.smbId}:${socket.uuid}`)
        delete sockets[socket.uuid];
        clearInterval(ping);
        console.log(`Socket ${socket.uuid} removed...`)
        socket.destroy();
    }

    socket.on('data', (data) => {
        let msgData = {};
        try{
            msgData = JSON.parse(smparser(data));
            (msgData.msg == 'close') && destroySocket();
        }
        catch(e){
            msgData = {
                error: "Invalid data"
            }
            console.log(e);
            destroySocket();
        }
    })

    socket.on('close', (had_error) => {
        (!had_error) && console.log(`Socket ${socket.uuid} removed...`)
        destroySocket();
    })

    socket.on('error', (error) => {
        console.log(error);
        destroySocket();
    })
}

module.exports = {connectSocket, createPingFrame, checkSocketCall}