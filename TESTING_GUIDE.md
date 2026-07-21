# 🧪 TESTING GUIDE - Implementation Checklist

## Setup Testing Infrastructure

### 1. Install Testing Dependencies

```bash
# Backend testing
npm install --save-dev jest supertest @types/jest

# Frontend testing  
npm install --save-dev @testing-library/react @testing-library/jest-dom jest-mock-extended

# E2E testing
npm install --save-dev selenium-webdriver
# or
npm install --save-dev cypress
```

### 2. Configure Jest

```javascript
// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'routes/**/*.js',
    'controllers/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**',
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
};

// package.json scripts
{
  "scripts": {
    "test": "jest --detectOpenHandles",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Unit Tests - Authentication

### File: `backend/__tests__/auth.test.js`

```javascript
const request = require('supertest');
const app = require('../server');
const { executeQuery, executeUpdate } = require('../config/db');

jest.mock('../config/db');

describe('Authentication - Registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Register with valid credentials should succeed', async () => {
    const userData = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'SecurePass123!',
      fullName: 'New User',
    };

    executeQuery.mockResolvedValueOnce({ rows: [] }); // Email check
    executeQuery.mockResolvedValueOnce({ rows: [] }); // Username check
    executeUpdate.mockResolvedValueOnce({ rowsAffected: 1 });
    executeQuery.mockResolvedValueOnce({ rows: [{ USER_ID: 1 }] });

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.userId).toBeDefined();
  });

  test('Register with weak password should fail', async () => {
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'weak',  // Too weak
      fullName: 'Test User',
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('password');
  });

  test('Register with duplicate email should fail', async () => {
    executeQuery.mockResolvedValueOnce({
      rows: [{ USER_ID: 1, EMAIL: 'existing@example.com' }],  // Email exists
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'existing@example.com',
        username: 'newuser',
        password: 'SecurePass123!',
        fullName: 'Test',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('Register missing required fields should fail', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

describe('Authentication - Login', () => {
  test('Login with valid credentials should return tokens', async () => {
    const user = {
      USER_ID: 1,
      EMAIL: 'test@example.com',
      USERNAME: 'testuser',
      PASSWORD_HASH: '$2a$10$...',  // Hashed password
      ROLE: 'USER',
    };

    executeQuery.mockResolvedValueOnce({ rows: [user] });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.tokens).toBeDefined();
    expect(response.body.tokens.accessToken).toBeDefined();
    expect(response.body.tokens.refreshToken).toBeDefined();
  });

  test('Login with invalid password should fail', async () => {
    executeQuery.mockResolvedValueOnce({
      rows: [{ PASSWORD_HASH: '$2a$10$...' }],
    });

    // Mock comparePassword to return false
    jest.spyOn(require('../utils/authUtils'), 'comparePassword')
      .mockResolvedValueOnce(false);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword',
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('Login with non-existent user should fail', async () => {
    executeQuery.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
```

---

## Unit Tests - Cart & Orders

### File: `backend/__tests__/cart.test.js`

```javascript
const request = require('supertest');
const app = require('../server');
const { executeQuery, executeUpdate } = require('../config/db');

jest.mock('../config/db');

describe('Cart Operations', () => {
  test('Add product to cart should succeed', async () => {
    const token = 'valid-jwt-token';

    executeQuery.mockResolvedValueOnce({
      rows: [{ SOLUONGTON: 10, GIABAN: 100000 }],
    }); // Product exists
    
    executeQuery.mockResolvedValueOnce({
      rows: [{ CART_ID: 1 }],
    }); // Cart exists
    
    executeQuery.mockResolvedValueOnce({
      rows: [],
    }); // Product not in cart
    
    executeUpdate.mockResolvedValueOnce({ rowsAffected: 1 });

    const response = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: 1,
        masp: 'SP001',
        soluong: 2,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('Add product with insufficient stock should fail', async () => {
    executeQuery.mockResolvedValueOnce({
      rows: [{ SOLUONGTON: 1, GIABAN: 100000 }],  // Only 1 in stock
    });

    const response = await request(app)
      .post('/api/cart/add')
      .send({
        userId: 1,
        masp: 'SP001',
        soluong: 5,  // Trying to add 5
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('stock');
  });

  test('Get cart should return items', async () => {
    const cartItems = [
      {
        MASP: 'SP001',
        TENSP: 'Book 1',
        GIABAN: 100000,
        SOLUONG: 2,
        TOTAL_PRICE: 200000,
      },
    ];

    executeQuery.mockResolvedValueOnce({ rows: cartItems });

    const response = await request(app)
      .get('/api/cart/1')
      .send();

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe('Order Creation', () => {
  test('Create order from cart should succeed', async () => {
    const cartItems = [
      { MASP: 'SP001', GIABAN: 100000, SOLUONG: 2 },
      { MASP: 'SP002', GIABAN: 50000, SOLUONG: 1 },
    ];

    executeQuery.mockResolvedValueOnce({ rows: cartItems });

    const response = await request(app)
      .post('/api/order/create')
      .send({
        userId: 1,
        paymentMethod: 'COD',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.orderId).toBeDefined();
    expect(response.body.totalAmount).toBe(250000);  // 100000*2 + 50000*1
  });

  test('Create order from empty cart should fail', async () => {
    executeQuery.mockResolvedValueOnce({ rows: [] });  // Empty cart

    const response = await request(app)
      .post('/api/order/create')
      .send({
        userId: 1,
        paymentMethod: 'COD',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

---

## Integration Tests

### File: `backend/__tests__/integration.test.js`

```javascript
const request = require('supertest');
const app = require('../server');
// Use real database or test database

describe('Full User Journey - Integration Tests', () => {
  let authToken;
  let userId;

  test('Step 1: Register new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: `test-${Date.now()}@example.com`,
        username: `testuser-${Date.now()}`,
        password: 'TestPass123!',
        fullName: 'Test User',
        phone: '0912345678',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    userId = response.body.userId;
  });

  test('Step 2: Login user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: `testuser-${Date.now()}`,
        password: 'TestPass123!',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.tokens).toBeDefined();
    authToken = response.body.tokens.accessToken;
  });

  test('Step 3: Add product to cart', async () => {
    const response = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        userId,
        masp: 'SP001',
        soluong: 1,
      });

    expect(response.statusCode).toBe(200);
  });

  test('Step 4: Get cart', async () => {
    const response = await request(app)
      .get(`/api/cart/${userId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(response.statusCode).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('Step 5: Create order', async () => {
    const response = await request(app)
      .post('/api/order/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        userId,
        paymentMethod: 'COD',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.orderId).toBeDefined();
  });
});
```

---

## Frontend Tests (React/Next.js)

### File: `app/__tests__/page.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../page';
import { productAPI } from '@/lib/api';

jest.mock('@/lib/api');

describe('Home Page', () => {
  test('should render product list', async () => {
    (productAPI.getAll as jest.Mock).mockResolvedValue({
      data: [
        { MASP: '1', TENSP: 'Book 1', GIABAN: 100000, SOLUONGTON: 5 },
      ],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Book 1')).toBeInTheDocument();
    });
  });

  test('should display loading state', () => {
    render(<Home />);
    
    // Should show skeleton loading initially
    const skeletons = screen.getAllByTestId('product-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('should handle search', async () => {
    (productAPI.search as jest.Mock).mockResolvedValue({
      data: [
        { MASP: '1', TENSP: 'Programming Book', GIABAN: 150000, SOLUONGTON: 3 },
      ],
    });

    render(<Home />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Programming' } });
    
    const searchBtn = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText('Programming Book')).toBeInTheDocument();
    });
  });
});
```

---

## E2E Tests (Selenium)

### File: `tests/e2e_checkout.py`

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class TestCheckoutFlow:
    def setup_method(self):
        """Initialize WebDriver before each test"""
        self.driver = webdriver.Chrome()
        self.driver.get('http://localhost:3000')
        self.wait = WebDriverWait(self.driver, 10)

    def teardown_method(self):
        """Close WebDriver after each test"""
        self.driver.quit()

    def test_complete_purchase_flow(self):
        """Test complete purchase from product list to checkout"""
        
        # Step 1: Search for product
        search_input = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[placeholder*="search"]'))
        )
        search_input.send_keys('Programming')
        search_btn = self.driver.find_element(By.CSS_SELECTOR, 'button:has-text("Search")')
        search_btn.click()

        # Step 2: Click product
        product = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="product-card"]'))
        )
        product.click()

        # Step 3: Add to cart
        add_to_cart_btn = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="add-to-cart"]'))
        )
        add_to_cart_btn.click()

        # Verify success message
        success_msg = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '.alert-success'))
        )
        assert 'added to cart' in success_msg.text.lower()

        # Step 4: Go to cart
        cart_link = self.driver.find_element(By.CSS_SELECTOR, '[data-testid="cart-link"]')
        cart_link.click()

        # Verify cart page
        assert 'cart' in self.driver.current_url.lower()

        # Step 5: Checkout
        checkout_btn = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="checkout-btn"]'))
        )
        checkout_btn.click()

        # Step 6: Select payment method
        payment_select = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'select[name="paymentMethod"]'))
        )
        payment_select.send_keys('COD')

        # Step 7: Place order
        place_order_btn = self.driver.find_element(By.CSS_SELECTOR, '[data-testid="place-order"]')
        place_order_btn.click()

        # Verify order success
        success_page = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="order-success"]'))
        )
        assert success_page.is_displayed()
```

---

## Run Tests

```bash
# Backend unit tests
npm test

# Backend with coverage
npm run test:coverage

# Frontend tests
npm test -- --testPathPattern="__tests__"

# E2E tests (Selenium)
cd tests && python -m pytest e2e_checkout.py -v

# E2E tests (Cypress)
npx cypress open
```

---

## Coverage Goals

- **Target:** 80%+ code coverage
- **Critical paths:** 100% (auth, payment, orders)
- **UI components:** 70%+

```bash
npm run test:coverage

# Expected output:
# -------|----------|----------|----------|----------|
# File   | % Stmts  | % Branch | % Funcs  | % Lines  |
# -------|----------|----------|----------|----------|
# All    |   82.3   |   75.8   |   81.5   |   82.3   |
```

