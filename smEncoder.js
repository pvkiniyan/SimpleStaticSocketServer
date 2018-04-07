module.exports = (bytesRaw) => {

        var bytesFormatted = new Array();
        bytesFormatted[0] = 129;
        if (bytesRaw.length <= 125) {
            bytesFormatted[1] = bytesRaw.length;
        } else if (bytesRaw.length >= 126 && bytesRaw.length <= 65535) {
            bytesFormatted[1] = 126;
            bytesFormatted[2] = ( bytesRaw.length >> 8 ) & 255;
            bytesFormatted[3] = ( bytesRaw.length      ) & 255;
        } else {
            bytesFormatted[1] = 127;
            bytesFormatted[2] = ( bytesRaw.length >> 56 ) & 255;
            bytesFormatted[3] = ( bytesRaw.length >> 48 ) & 255;
            bytesFormatted[4] = ( bytesRaw.length >> 40 ) & 255;
            bytesFormatted[5] = ( bytesRaw.length >> 32 ) & 255;
            bytesFormatted[6] = ( bytesRaw.length >> 24 ) & 255;
            bytesFormatted[7] = ( bytesRaw.length >> 16 ) & 255;
            bytesFormatted[8] = ( bytesRaw.length >>  8 ) & 255;
            bytesFormatted[9] = ( bytesRaw.length       ) & 255;
        }
        for (var i = 0; i < bytesRaw.length; i++){
            bytesFormatted.push(bytesRaw.charCodeAt(i));
        }
        return bytesFormatted;

}