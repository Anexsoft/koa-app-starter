const redis = require('redis');
const { promisify } = require('util');

var redisClient = null;

function getRedisClient(ctx, redisOptions) {
    if (!redisClient) {
        redisClient = redis.createClient(
            redisOptions.port,
            redisOptions.host,
            {
                auth_pass: redisOptions.key,
                tls: {
                    servername: redisOptions.host
                }
            }
        );

        redisClient.on('error', function(err) {
            ctx.log.error('redis:' + err);
        });

        redisClient.getAsync = promisify(redisClient.get).bind(redisClient);
        redisClient.getAsyncObj = async function() {
            ctx.log.trace('redis-get-async: start');
            var data = await this.getAsync(...arguments);
            ctx.log.trace('redis-get-async: read');
            try {
                var o = JSON.parse(data);
                ctx.log.debug('redis-get-async: parse');
                return o;
            } catch (error) {
                // if there is an error while parsing, return null
                ctx.log.error('redis-get-async:' + error.message);
                return null;
            }
        };

        redisClient.setAsync = promisify(redisClient.set).bind(redisClient);
        redisClient.setAsyncObj = async function() {
            ctx.log.trace('redis-set-async: start');

            // arguments: 0 key, 1 value, 2 options, 3 suboptions
            // stringify arg1 as json
            arguments[1] = JSON.stringify(arguments[1]);
            ctx.log.trace('redis-set-async: stringified');

            await this.setAsync(...arguments);
            ctx.log.debug('redis-set-async: write');
        };
    }

    return redisClient;
}

function closeRedisClient() {
    if (redisClient) {
        redisClient.quit();
    }
}

module.exports = {
    get: getRedisClient,
    close: closeRedisClient
};
