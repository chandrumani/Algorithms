const express = require('express');
const redis = require('redis');

const app = express();
const redisClient = redis.createClient({
    url: 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});
redisClient.connect().catch(console.error);

const TOKEN_LIMIT = 10; // Maximum tokens
const REFILL_RATE = 1; // Tokens added per second
const REFILL_INTERVAL = 5000; // Interval in milliseconds



// Increment tokens at regular intervals
setInterval(async () => {
    const currentTokens = await redisClient.get('tokenBucket');
    if (currentTokens < TOKEN_LIMIT) {
        await redisClient.incrBy('tokenBucket', REFILL_RATE);
    }
}, REFILL_INTERVAL);

// Middleware to check the token bucket
const rateLimiter = async (req, res, next) => {
    const currentTokens = await redisClient.get('tokenBucket');
    if (currentTokens === null) {
        // Initialize the token bucket
        await redisClient.set('tokenBucket', TOKEN_LIMIT, {
        NX: true
        });
    }
    // If there are tokens available, allow the request and decrement the token count
    if (currentTokens > 0) {
        await redisClient.decr('tokenBucket');
        next();
    } else {
        res.status(429).send('Too many requests, please try again later.');
    }
}
app.use(rateLimiter);

app.get('/api', async (req, res) => {
    res.send('Request processed successfully');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});