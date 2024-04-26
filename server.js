const http = require('http');
const mysql = require('mysql');
const { performance } = require('perf_hooks');
const dbConfig1 = require('./dbconfig1');
const dbConfig2 = require('./dbconfig2');

const poolDb1 = mysql.createPool(dbConfig1);
const poolDb2 = mysql.createPool(dbConfig2);

const server = http.createServer((req, res) => {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-requested-with');

  if (req.method === 'OPTIONS') {
    // Handle OPTIONS requests
    res.writeHead(200);
    res.end();
  } else if (req.method === 'POST' && req.url === '/submitQuery') {
    // Parse incoming JSON requests
    console.log('hello');
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        const postData = JSON.parse(data);
        console.log('postData:', postData);
        const query = postData.query;
        const pool = postData.database === 'db1' ? poolDb1 : poolDb2;
        const startTime = performance.now();
        // Use the connection pool to execute the SQL query
        pool.query(query, (error, results) => {
          if (error) {
            console.error('Error executing query:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
          } else {
            console.log('Query results:', results);
            const endTime = performance.now(); // End time measurement
            const processingTime = endTime - startTime; // Calculate processing time
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({data:results, proc_time:processingTime.toFixed(3)}));
          }
        });
      } catch (error) {
        console.error('Error parsing JSON:', error);
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Error processing request');
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
