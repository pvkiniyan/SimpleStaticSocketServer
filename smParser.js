module.exports = (data) => {
    let firstByte = data[0];
    let secondByte = data[1];

    let finCode = firstByte >> 7;
    let isFinished = finCode == 1 ? true : false;
    let opCode = firstByte & 0x0F;

    if(opCode == 10){
        return '{"msg":"pong"}';
    }
    if(opCode == 8){
        return '{"msg":"close"}'
    }
    let isMasked = ((secondByte >> 7) == 1);
    let payloadLength = secondByte & 0x7F;
    let calPayloadLength = payloadLength;
    let payloadOffset = {
        125: [2,6],
        126: [4,8],
        127: [10,14]
    };



    if(payloadLength == 126){
        calPayloadLength = (256*data[2])+data[3];
        console.log(calPayloadLength)
    }

    let offset = payloadOffset[payloadLength <= 125 ? 125 : payloadLength];
    let maskKey = [];
    for (let i = offset[0]; i < offset[1]; i++){
        maskKey.push(data[i]);
    }
    let dataLength = calPayloadLength + offset[1];
    let unmaskedData = [];
    for (let i = offset[1]; i < dataLength; i++){
        let j = i - offset[1];
        unmaskedData.push(data[i] ^ maskKey[j % 4]);
    }
    return Buffer.from(unmaskedData).toString('utf-8');
}