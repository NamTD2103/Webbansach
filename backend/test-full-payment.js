const http = require('http');

const testData = {
  orderId: 1001,
  amount: 420000,
  userId: 6,
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
  console.log(`\n✅ STATUS: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('\n💳 VNPAY PAYMENT RESPONSE:');
      console.log(`✅ Success: ${json.success}`);
      console.log(`📝 Message: ${json.message}`);
      console.log(`🆔 Transaction ID: ${json.transactionId}`);
      console.log(`💰 Amount: ${json.amount} VND`);
      
      if (json.paymentUrl) {
        console.log(`\n🔗 Payment URL generated:`);
        console.log(`${json.paymentUrl.substring(0, 100)}...`);
        
        // Show the actual VNPay gateway URL
        const url = new URL(json.paymentUrl);
        console.log(`\n✅ Ready to redirect to: ${url.hostname}`);
        console.log(`\n📝 Test card number: 9704198526191432198`);
        console.log('📝 Expiry: Any future date');
        console.log('📝 OTP: 123456');
      }
    } catch (e) {
      console.log('RESPONSE:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Problem: ${e.message}`);
});

console.log('Testing Complete VNPay Payment Flow');
console.log('====================================');
console.log('Order: 1001, Amount: 420,000 VND');
console.log('Sending to: POST /api/payment/create-payment-url\n');

req.write(payload);
req.end();
