const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api/auth';

async function testLoginAndRegistration() {
  try {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║     LOGIN & REGISTRATION TEST SUITE       ║');
    console.log('╚════════════════════════════════════════════╝\n');

    // Test 1: Try to login with admin/admin
    console.log('📝 Test 1: Attempting login with username="admin", password="admin"');
    console.log('─'.repeat(50));
    let response = await fetch(${BASE_URL}/login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin',
        password: 'admin'
      })
    });
    let data = await response.json();
    console.log(Status: );
    console.log(Response:, JSON.stringify(data, null, 2));
    console.log();

    // Test 2: If admin/admin failed, try user/user
    if (!data.success) {
      console.log('📝 Test 2: Attempting login with username="user", password="user"');
      console.log('─'.repeat(50));
      response = await fetch($/login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'user',
          password: 'user'
        })
      });
      data = await response.json();
      console.log(Status: );
      console.log(Response:, JSON.stringify(data, null, 2));
      console.log();
    }

    // Test 3: Registration with a new account
    const newUsername = 	estuser_;
    const newEmail = 	est_@example.com;
    const testPassword = 'TestPass123!';

    console.log('📝 Test 3: Attempting registration with new account');
    console.log('─'.repeat(50));
    console.log(Username: );
    console.log(Email: );
    console.log(Password: );
    console.log();

    response = await fetch($/register, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: newUsername,
        email: newEmail,
        password: testPassword,
        confirmPassword: testPassword
      })
    });
    data = await response.json();
    console.log(Status: );
    console.log(Response:, JSON.stringify(data, null, 2));
    console.log();

    // Test 4: Try to login with the newly registered account
    if (data.success) {
      console.log('📝 Test 4: Attempting login with newly registered account');
      console.log('─'.repeat(50));
      response = await fetch($/login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: newUsername,
          password: testPassword
        })
      });
      data = await response.json();
      console.log(Status: );
      console.log(Response:, JSON.stringify(data, null, 2));
      console.log();
    }

    console.log('✅ All tests completed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLoginAndRegistration();
