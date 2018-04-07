const redis = require("redis");
const bluebird = require("bluebird");

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const client = redis.createClient();

client.flushdb
client.on("error", (err) => console.log("Error " + err));

const set = () => {

}
module.exports = {client, set};