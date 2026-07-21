const http = require("http");

const BASE_URL = "http://localhost:5000/api";

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  try {
    console.log("=== Testing Authentication and Cart Flow ===\n");

    // Step 1: Register user
    console.log("Step 1: Registering new test user (testcart123)...");
    const registerRes = await makeRequest("POST", "/auth/register", {
      username: "testcart123",
      password: "Test123456",
      email: "testcart@test.com",
      fullName: "Cart Test User"
    });
    console.log(`Status: ${registerRes.status}`);
    console.log(`Response:`, JSON.stringify(registerRes.body, null, 2));
    console.log("");

    // Step 2: Login user
    console.log("Step 2: Logging in with testcart123 credentials...");
    const loginRes = await makeRequest("POST", "/auth/login", {
      username: "testcart123",
      password: "Test123456"
    });
    console.log(`Status: ${loginRes.status}`);
    console.log(`Response:`, JSON.stringify(loginRes.body, null, 2));
    
    if (loginRes.status !== 200) {
      console.log("Login failed. Cannot proceed with cart test.");
      process.exit(1);
    }

    // Extract userId and token
    const userId = loginRes.body?.userId || loginRes.body?.data?.userId;
    const token = loginRes.body?.token || loginRes.body?.data?.token;
    console.log(`\nExtracted userId: ${userId}`);
    console.log(`Extracted token: ${token ? "Yes (token exists)" : "No token found"}`);
    console.log("");

    // Step 3: Add product to cart
    console.log("Step 3: Adding product to cart (SP001, quantity: 1)...");
    const cartRes = await makeRequest("POST", "/cart/add", {
      userId: userId,
      masp: "SP001",
      soluong: 1
    }, token);

    console.log(`Status: ${cartRes.status}`);
    console.log(`Response:`, JSON.stringify(cartRes.body, null, 2));
    console.log("");

    // Summary
    console.log("=== Test Summary ===");
    console.log(`1. Registration: ${registerRes.status === 200 || registerRes.status === 201 ? "? SUCCESS" : "? FAILED"}`);
    console.log(`2. Login: ${loginRes.status === 200 ? "? SUCCESS" : "? FAILED"}`);
    console.log(`3. Add to Cart: ${cartRes.status === 200 || cartRes.status === 201 ? "? SUCCESS" : "? FAILED"}`);

    process.exit(0);

  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
})();
