const express = require('express');

const app = express();

const bucketSize = 10; // Maximum number of requests allowed in the bucket
const drainInterval = 1000; // Interval in milliseconds

let currentBucket = new Array(bucketSize); // Current number of requests in the bucket

setInterval(() => {
    if (currentBucket.length === 0) return; // If the bucket is empty, do nothing
    currentBucket.pop(); // Remove the oldest request from the bucket
}, drainInterval);

// Middleware to check the leaky bucket
const leakyBucket = (req, res, next) => {
    if (currentBucket.length < bucketSize) {
        currentBucket.push(Date.now());
        next(); // Allow the request to proceed
    } else {
        res.status(429).send('Too many requests, please try again later.');
        return;
    }
};
app.use(leakyBucket);

app.get('/api/leakyBucket', (req, res) => {
    res.send('Request processed successfully');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});