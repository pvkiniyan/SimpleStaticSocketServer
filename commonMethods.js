const cbToPromise = (asyncFn, ...params) => new Promise((resolve, reject) => {
    asyncFn(...params, (err, result) => {console.log(result); err ? reject(err) : resolve(result)})
});

module.exports = {cbToPromise}