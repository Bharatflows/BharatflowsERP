# Sales API Testing Guide

## 🎯 Overview
This document provides API endpoint details for testing the Sales module (Invoices, Estimates, Sales Orders).

---

## 📝 Prerequisites

1. **Server Running**: Ensure backend server is running on `http://localhost:5000`
2. **Authentication**: You need a valid JWT token from login
3. **API Version**: All endpoints use `/api/v1` prefix

### Get Authentication Token

```bash
# Login to get token
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@bharatflow.com",
  "password": "admin123"
}

# Response will include: { "token": "eyJhbGciOi..." }
# Use this token in all subsequent requests
```

---

## 📋 Invoice Endpoints

### 1. Get All Invoices
```
GET http://localhost:5000/api/v1/sales/invoices
Authorization: Bearer {token}

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- status: DRAFT | SENT | PAID | PARTIAL | OVERDUE | CANCELLED
- search: string (searches invoice number)
```

### 2. Get Single Invoice
```
GET http://localhost:5000/api/v1/sales/invoices/{id}
Authorization: Bearer {token}
```

### 3. Create Invoice
```
POST http://localhost:5000/api/v1/sales/invoices
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "customer-uuid",
  "invoiceDate": "2024-12-01",
  "dueDate": "2024-12-31",
  "status": "DRAFT",
  "notes": "Test invoice",
  "items": [
    {
      "productId": "product-uuid",
      "productName": "Test Product",
      "quantity": 2,
      "rate": 100,
      "taxRate": 18
    }
  ]
}
```

### 4. Update Invoice
```
PUT http://localhost:5000/api/v1/sales/invoices/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "SENT",
  "notes": "Updated notes",
  "items": [...] // Optional: array of items
}
```

### 5. Delete Invoice
```
DELETE http://localhost:5000/api/v1/sales/invoices/{id}
Authorization: Bearer {token}
```

### 6. Search Invoices
```
GET http://localhost:5000/api/v1/sales/invoices/search?q=INV-2024
Authorization: Bearer {token}
```

---

## 📊 Estimate Endpoints

### 1. Get All Estimates
```
GET http://localhost:5000/api/v1/sales/estimates
Authorization: Bearer {token}

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- status: PENDING | ACCEPTED | REJECTED | CONVERTED
- search: string
```

### 2. Get Single Estimate
```
GET http://localhost:5000/api/v1/sales/estimates/{id}
Authorization: Bearer {token}
```

### 3. Create Estimate
```
POST http://localhost:5000/api/v1/sales/estimates
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "customer-uuid",
  "date": "2024-12-01",
  "validUntil": "2024-12-15",
  "status": "PENDING",
  "notes": "Test estimate",
  "items": [
    {
      "productId": "product-uuid",
      "productName": "Test Product",
      "quantity": 5,
      "rate": 200,
      "taxRate": 18
    }
  ]
}
```

### 4. Update Estimate
```
PUT http://localhost:5000/api/v1/sales/estimates/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "ACCEPTED",
  "notes": "Approved by client"
}
```

### 5. Delete Estimate
```
DELETE http://localhost:5000/api/v1/sales/estimates/{id}
Authorization: Bearer {token}
```

### 6. Convert Estimate to Invoice ✨
```
POST http://localhost:5000/api/v1/sales/estimates/{id}/convert
Authorization: Bearer {token}

# This will:
# 1. Create a new invoice with estimate data
# 2. Mark estimate status as "CONVERTED"
# 3. Return the created invoice
```

---

## 🛒 Sales Order Endpoints

### 1. Get All Sales Orders
```
GET http://localhost:5000/api/v1/sales/orders
Authorization: Bearer {token}

Query Parameters:
- page: number
- limit: number
- status: DRAFT | CONFIRMED | SHIPPED | DELIVERED | CANCELLED
- search: string
```

### 2. Get Single Sales Order
```
GET http://localhost:5000/api/v1/sales/orders/{id}
Authorization: Bearer {token}
```

### 3. Create Sales Order
```
POST http://localhost:5000/api/v1/sales/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "customer-uuid",
  "orderDate": "2024-12-01",
  "expectedDate": "2024-12-10",
  "status": "DRAFT",
  "notes": "Urgent order",
  "items": [
    {
      "productId": "product-uuid",
      "productName": "Product Name",
      "quantity": 10,
      "rate": 150,
      "taxRate": 18
    }
  ]
}
```

### 4. Update Sales Order
```
PUT http://localhost:5000/api/v1/sales/orders/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "CONFIRMED",
  "notes": "Updated status"
}
```

### 5. Delete Sales Order
```
DELETE http://localhost:5000/api/v1/sales/orders/{id}
Authorization: Bearer {token}
```

---

## 🧪 Testing Workflow

- **Step 1**: Create customer (using Parties API - if not exists)
- **Step 2**: Create product (using Inventory API - if not exists)
- **Step 3**: Create an estimate
- **Step 4**: Test estimate retrieval
- **Step 5**: Convert estimate to invoice
- **Step 6**: Verify invoice was created
- **Step 7**: Create sales order
- **Step 8**: Test pagination and filters

---

## 📦 Sample Test Data

### Sample Customer
```json
{
  "name": "Test Customer Ltd",
  "type": "CUSTOMER",
  "email": "customer@test.com",
  "phone": "+919876543210",
  "gstin": "29ABCDE1234F1Z5",
  "billingAddress": {
    "street": "123 Test Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

### Sample Product
```json
{
  "name": "Test Product",
  "code": "TP001",
  "hsnCode": "84149090",
  "unit": "pcs",
  "sellingPrice": 1000,
  "purchasePrice": 800,
  "gstRate": 18,
  "currentStock": 100
}
```

---

## ✅ Expected Responses

### Success Response
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "invoice": {
      "id": "uuid",
      "invoiceNumber": "INV-2024-001",
      "subtotal": 200,
      "totalTax": 36,
      "totalAmount": 236,
      ...
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invoice not found",
  "error": "..." // Optional error details
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "invoices": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

---

## 🛠️ Postman Collection

Import these requests into Postman for easy testing:

1. **Environment Variables**:
   - `base_url`: http://localhost:5000/api/v1
   - `token`: (set after login)

2. **Headers** (Global):
   - `Authorization`: Bearer {{token}}
   - `Content-Type`: application/json

---

## 🐛 Common Issues

### Issue 1: 401 Unauthorized
**Solution**: Token expired or invalid. Login again to get a new token.

### Issue 2: 404 Not Found
**Solution**: Check if the ID exists and belongs to your company.

### Issue 3: 500 Internal Server Error
**Solution**: Check server logs for detailed error message.

---

## 📝 Notes

1. All dates should be in ISO format: `YYYY-MM-DD`
2. All amounts (rate, price) are Decimal types
3. Tax rates are percentages (e.g., 18 for 18% GST)
4. Invoice/Estimate/Order numbers are auto-generated if not provided
5. All endpoints filter data by `companyId` automatically
6. Estimates can only be converted once (status becomes "CONVERTED")

---

**Last Updated**: December 2024  
**API Version**: v1  
**Server Port**: 5000
