/**
 * Test Authentication Endpoints
 */

const testEmail = `test_${Date.now()}@example.com`;
const testUsername = `testuser_${Date.now()}`;
const testPassword = 'TestPassword123!';

async function testAuth() {
  try {
    console.log('\n🧪 Testing Authentication System...\n');

    // Test 1: Register
    console.log('📝 Test 1: Registration');
    console.log(`📧 Email: ${testEmail}`);
    console.log(`👤 Username: ${testUsername}`);
    
    const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        username: testUsername,
        password: testPassword,
        fullName: 'Test User',
      }),
    });

    const registerData = await registerResponse.json();
    console.log(`Status: ${registerResponse.status}`);
    console.log('Response:', JSON.stringify(registerData, null, 2));

    if (!registerData.success) {
      console.error('❌ Registration failed');
      return;
    }

    console.log('✅ Registration successful\n');

    // Test 2: Login
    console.log('🔐 Test 2: Login with username');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: testPassword,
      }),
    });

    const loginData = await loginResponse.json();
    console.log(`Status: ${loginResponse.status}`);
    console.log('Response:', JSON.stringify(loginData, null, 2));

    if (!loginData.success) {
      console.error('❌ Login failed');
      return;
    }

    console.log('✅ Login successful\n');

    // Test 3: Login with email
    console.log('🔐 Test 3: Login with email');
    const loginEmailResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginEmailData = await loginEmailResponse.json();
    console.log(`Status: ${loginEmailResponse.status}`);
    console.log('Response:', JSON.stringify(loginEmailData, null, 2));

    if (!loginEmailData.success) {
      console.error('❌ Login with email failed');
      return;
    }

    console.log('✅ Login with email successful\n');

    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testAuth();
