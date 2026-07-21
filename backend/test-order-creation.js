const http = require('http');

const testData = {
  userId: 6,
  paymentMethod: 'vnpay'
};

const payload = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/order/create',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  console.log(`\n✅ STATUS: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('\n📦 ORDER RESPONSE:');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('RESPONSE:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Problem: ${e.message}`);
});

console.log('Testing Order Creation with VNPay');
console.log('==================================');
console.log('Payload:', JSON.stringify(testData, null, 2));
console.log('\nSending request to POST /api/order/create...\n');

req.write(payload);
req.end();
