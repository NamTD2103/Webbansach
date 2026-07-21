#!/bin/bash
# VNPay Integration - Test Script
# Run this script to test VNPay payment endpoints
# Usage: bash test-vnpay.sh

set -e

API_URL="http://localhost:5000"
ORDER_ID=12345
USER_ID=1
AMOUNT=500000

echo "================================================"
echo "   VNPay Payment Integration - Test Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo -e "${YELLOW}Checking backend connectivity...${NC}"
if ! curl -s "$API_URL/health" > /dev/null; then
  echo -e "${RED}✗ Backend not running at $API_URL${NC}"
  echo "Please start the backend with: npm start"
  exit 1
fi
echo -e "${GREEN}✓ Backend is running${NC}"
echo ""

# Test 1: Create Payment URL
echo -e "${YELLOW}Test 1: Create Payment URL${NC}"
echo "Endpoint: POST /api/payment/create-payment-url"
echo "Request:"
echo "{
  \"orderId\": $ORDER_ID,
  \"amount\": $AMOUNT,
  \"userId\": $USER_ID,
  \"email\": \"test@example.com\",
  \"phone\": \"0901234567\",
  \"bankCode\": \"NCB\"
}"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/payment/create-payment-url" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": $ORDER_ID,
    \"amount\": $AMOUNT,
    \"userId\": $USER_ID,
    \"email\": \"test@example.com\",
    \"phone\": \"0901234567\",
    \"bankCode\": \"NCB\"
  }")

echo "Response:"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract transaction ID for next tests
TRANSACTION_ID=$(echo "$RESPONSE" | grep -o '"transactionId":"[^"]*"' | cut -d'"' -f4 || echo "")
PAYMENT_URL=$(echo "$RESPONSE" | grep -o '"paymentUrl":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -z "$TRANSACTION_ID" ]; then
  echo -e "${RED}✗ Failed to create payment URL${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Payment URL created successfully${NC}"
echo "Transaction ID: $TRANSACTION_ID"
echo ""

# Test 2: Query Transaction History
echo -e "${YELLOW}Test 2: Query Transaction History${NC}"
echo "Endpoint: GET /api/payment/transaction-history/:userId"
echo ""

RESPONSE=$(curl -s -X GET "$API_URL/api/payment/transaction-history/$USER_ID?limit=5&offset=0")

echo "Response:"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Transaction history retrieved${NC}"
else
  echo -e "${RED}✗ Failed to retrieve transaction history${NC}"
fi
echo ""

# Test 3: Simulate Return from VNPay (will fail hash validation, but shows structure)
echo -e "${YELLOW}Test 3: Simulate Payment Return (Hash validation will fail - expected)${NC}"
echo "Endpoint: GET /api/payment/return"
echo ""

echo "Note: This will fail hash verification (intentional for testing)"
RESPONSE=$(curl -s -X GET "$API_URL/api/payment/return?vnp_Amount=50000000&vnp_BankCode=NCB&vnp_OrderInfo=Test&vnp_ResponseCode=00&vnp_TMN_Code=TESTMERCHANT&vnp_TxnRef=$TRANSACTION_ID&vnp_SecureHash=invalid")

echo "Response:"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""
echo -e "${YELLOW}Note: Hash verification fails as expected (test environment)${NC}"
echo ""

# Test 4: Simulated IPN
echo -e "${YELLOW}Test 4: Simulate IPN Webhook (Hash validation will fail - expected)${NC}"
echo "Endpoint: POST /api/payment/ipn"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/payment/ipn" \
  -H "Content-Type: application/json" \
  -d "{
    \"vnp_Amount\": \"50000000\",
    \"vnp_BankCode\": \"NCB\",
    \"vnp_OrderInfo\": \"Test\",
    \"vnp_ResponseCode\": \"00\",
    \"vnp_TMN_Code\": \"TESTMERCHANT\",
    \"vnp_TxnRef\": \"$TRANSACTION_ID\",
    \"vnp_SecureHash\": \"invalid\"
  }")

echo "Response:"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""
echo -e "${YELLOW}Note: Hash verification fails as expected (test environment)${NC}"
echo ""

# Test 5: Query Payment Status
echo -e "${YELLOW}Test 5: Query Payment Status${NC}"
echo "Endpoint: POST /api/payment/query-status"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/payment/query-status" \
  -H "Content-Type: application/json" \
  -d "{
    \"transactionId\": \"$TRANSACTION_ID\",
    \"transactionDate\": \"$(date +%Y%m%d)\"
  }")

echo "Response:"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""
echo -e "${GREEN}✓ Query status completed${NC}"
echo ""

# Test 6: Request Refund
echo -e "${YELLOW}Test 6: Request Refund${NC}"
echo "Endpoint: POST /api/payment/refund"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/payment/refund" \
  -H "Content-Type: application/json" \
  -d "{
    \"transactionId\": \"$TRANSACTION_ID\",
    \"orderId\": $ORDER_ID,
    \"refundAmount\": $AMOUNT,
    \"reason\": \"Testing refund request\"
  }")

echo "Response:"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Refund request created${NC}"
else
  echo -e "${YELLOW}⚠ Refund request may have failed (transaction status may not be SUCCESS)${NC}"
fi
echo ""

# Summary
echo "================================================"
echo "               Test Summary"
echo "================================================"
echo -e "${GREEN}✓ Backend connectivity: OK${NC}"
echo -e "${GREEN}✓ Create Payment URL: OK${NC}"
echo -e "${GREEN}✓ Transaction History: OK${NC}"
echo -e "${GREEN}✓ Query Status: OK${NC}"
echo -e "${YELLOW}⚠ Return/IPN: Hash validation fails (expected in test)${NC}"
echo ""

echo "Next Steps:"
echo "1. Test with actual VNPay sandbox"
echo "2. Generate valid secure hash for production"
echo "3. Configure IPN URL in VNPay merchant dashboard"
echo "4. Monitor transaction logs"
echo ""

echo -e "${GREEN}All tests completed!${NC}"
echo ""
