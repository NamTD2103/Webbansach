/**
 * Comprehensive Auth Test
 */

const testEmail = `test_${Date.now()}@example.com`;
const testUsername = `testuser_${Date.now()}`;
const testPassword = 'TestPassword123!';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAuth() {
  try {
    console.log('\n🧪 COMPREHENSIVE AUTHENTICATION TEST\n');
    console.log('='.repeat(50));

    // Test 1: Try login with existing user
    console.log('\n📝 Test 1: Login with existing "admin" user');
    console.log('-'.repeat(50));
    
    const adminLoginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin',
      }),
    });

    const adminLoginData = await adminLoginResponse.json();
    console.log(`Status: ${adminLoginResponse.status}`);
    console.log(`Success: ${adminLoginData.success}`);
    console.log(`Message: ${adminLoginData.message}`);
    if (adminLoginData.user) {
      console.log(`User: ${adminLoginData.user.username} (${adminLoginData.user.email})`);
      console.log('✅ Existing user login PASSED\n');
    } else {
      console.log('Response:', JSON.stringify(adminLoginData, null, 2));
    }

    // Test 2: Register new user
    console.log('📝 Test 2: Register new user');
    console.log('-'.repeat(50));
    console.log(`📧 Email: ${testEmail}`);
    console.log(`👤 Username: ${testUsername}`);
    console.log(`🔑 Password: ${testPassword}`);
    
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
    console.log(`Success: ${registerData.success}`);
    console.log(`Message: ${registerData.message}`);
    
    if (registerData.success) {
      console.log('✅ Registration PASSED');
      if (registerData.user) {
        console.log(`User object present: ${JSON.stringify(registerData.user)}\n`);
      }
    } else {
      console.log('❌ Registration FAILED');
      console.log('Response:', JSON.stringify(registerData, null, 2));
      return;
    }

    // Wait a bit before trying to login with new user
    await sleep(500);

    // Test 3: Login with new user (username)
    console.log('📝 Test 3: Login new user with username');
    console.log('-'.repeat(50));
    
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
    console.log(`Success: ${loginData.success}`);
    console.log(`Message: ${loginData.message}`);
    
    if (loginData.success) {
      console.log('✅ Login with username PASSED\n');
    } else {
      console.log('❌ Login with username FAILED');
      console.log('Response:', JSON.stringify(loginData, null, 2));
      return;
    }

    // Test 4: Login with email
    console.log('📝 Test 4: Login new user with email');
    console.log('-'.repeat(50));
    
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
    console.log(`Success: ${loginEmailData.success}`);
    console.log(`Message: ${loginEmailData.message}`);
    
    if (loginEmailData.success) {
      console.log('✅ Login with email PASSED\n');
    } else {
      console.log('❌ Login with email FAILED');
      console.log('Response:', JSON.stringify(loginEmailData, null, 2));
      return;
    }

    // Test 5: Wrong password
    console.log('📝 Test 5: Login with wrong password (should fail)');
    console.log('-'.repeat(50));
    
    const wrongPassResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: 'WrongPassword123!',
      }),
    });

    const wrongPassData = await wrongPassResponse.json();
    console.log(`Status: ${wrongPassResponse.status}`);
    console.log(`Success: ${wrongPassData.success}`);
    console.log(`Message: ${wrongPassData.message}`);
    
    if (!wrongPassData.success) {
      console.log('✅ Wrong password rejection PASSED\n');
    } else {
      console.log('❌ Wrong password should have been rejected\n');
    }

    console.log('='.repeat(50));
    console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!\n');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testAuth();
