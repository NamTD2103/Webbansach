const http = require('http');

const testData = {
  orderId: 12345,
  amount: 500000,
  userId: 1,
  email: 'test@webbansach.com',
  phone: '0901234567',
  bankCode: 'NCB',
  ipAddress: '127.0.0.1'
};

const payload = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/payment/create-payment-url',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS:`, res.headers);
  console.log('\nRESPONSE:');
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(data);
    try {
      const json = JSON.parse(data);
      console.log('\nPARSED:');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Could not parse as JSON');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

console.log('Sending request to POST /api/payment/create-payment-url');
console.log('Payload:', JSON.stringify(testData, null, 2));
console.log('\n---\n');

req.write(payload);
req.end();
