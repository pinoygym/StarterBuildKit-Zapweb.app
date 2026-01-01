const http = require('http');

// Test data for UOM conversion
const testData = {
  supplierId: "f5b5ac17-374c-4a3a-aff1-b628a6e485cb",
  warehouseId: "2370a68c-15f9-46a6-9126-b703646c5da1", 
  branchId: "a2fd5b89-a35e-4794-a1f3-3c4484b01b78",
  items: [
    {
      productId: "dcfa0462-26a2-4e12-9380-f33af8390e64", // Absolute 500ml Bottle
      quantity: 2, // 2 cases
      unitPrice: 500
    }
  ]
};

function makeRequest(path, method, data, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function loginAndGetToken() {
  try {
    console.log('=== Logging in to get auth token ===');
    
    // Login with existing user
    const loginData = {
      email: 'admin@inventorypro.com',
      password: 'password123'
    };

    const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
    console.log('Login Response Status:', loginResponse.status);
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      const token = loginResponse.data.token;
      console.log('✅ Login successful, got token');
      return token;
    } else {
      console.log('❌ Login failed:', loginResponse.data);
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

async function testUOMConversion() {
  try {
    console.log('=== Testing UOM Conversion with Auth ===');
    
    // Get auth token first
    const token = await loginAndGetToken();
    
    // Step 1: Create a purchase order with case UOM
    console.log('\n📦 Creating Purchase Order with case UOM...');
    const poData = {
      ...testData,
      poNumber: `TEST-UOM-${Date.now()}`,
      expectedDeliveryDate: new Date().toISOString(),
      notes: "Testing UOM conversion from case to bottle"
    };

    const poResponse = await makeRequest('/api/purchase-orders', 'POST', poData, token);
    console.log('PO Response Status:', poResponse.status);
    
    if (poResponse.status === 201) {
      const po = poResponse.data.data;
      console.log('✅ PO Created:', po.poNumber);
      console.log('PO Items:', po.PurchaseOrderItem.length);
      
      for (const item of po.PurchaseOrderItem) {
        console.log(`  - ${item.Product.name}: ${item.quantity} ${item.uom} @ ₱${item.unitPrice}`);
      }

      // Step 2: Create receiving voucher to test UOM conversion
      console.log('\n📋 Creating Receiving Voucher...');
      const rvData = {
        purchaseOrderId: po.id,
        receiverName: "UOM Test Receiver",
        deliveryNotes: "Testing case to bottle conversion",
        items: po.PurchaseOrderItem.map(item => ({
          productId: item.productId,
          uom: item.uom,
          orderedQuantity: item.quantity,
          receivedQuantity: item.quantity, // Receive full quantity
          unitPrice: item.unitPrice,
          varianceReason: null
        }))
      };

      console.log('RV Data:', JSON.stringify(rvData, null, 2));

      const rvResponse = await makeRequest('/api/receiving-vouchers', 'POST', rvData, token);
      console.log('RV Response Status:', rvResponse.status);
      
      if (rvResponse.status === 200) {
        const rv = rvResponse.data.data;
        console.log('✅ RV Created:', rv.rvNumber);
        console.log('RV Items:', rv.ReceivingVoucherItem.length);
        
        for (const item of rv.ReceivingVoucherItem) {
          console.log(`  - ${item.Product.name}:`);
          console.log(`    Ordered: ${item.orderedQuantity} ${item.uom}`);
          console.log(`    Received: ${item.receivedQuantity} ${item.uom}`);
          console.log(`    Base UOM: ${item.Product.baseUOM}`);
        }

        // Step 3: Check inventory batches to verify conversion
        console.log('\n📊 Checking inventory batches...');
        const batchResponse = await makeRequest(`/api/inventory/batches?productId=${testData.items[0].productId}`, 'GET', null, token);
        console.log('Batch Response Status:', batchResponse.status);
        
        if (batchResponse.status === 200) {
          const batches = batchResponse.data.data;
          console.log(`Found ${batches.length} batches:`);
          
          for (const batch of batches) {
            console.log(`  - Batch ${batch.batchNumber}:`);
            console.log(`    Quantity: ${batch.quantity} (in base UOM: ${batch.Product?.baseUOM})`);
            console.log(`    Unit Cost: ₱${batch.unitCost}`);
            console.log(`    Created: ${batch.createdAt}`);
          }

          console.log('\n✅ UOM Conversion Test Completed Successfully!');
          console.log(`Expected: 2 cases = 20 bottles, Actual: ${batches[0]?.quantity} ${batches[0]?.Product?.baseUOM}`);
          
          if (batches[0]?.quantity === 20 && batches[0]?.Product?.baseUOM === 'bottle') {
            console.log('✅ UOM conversion working correctly!');
          } else {
            console.log('❌ UOM conversion issue detected!');
          }
        } else {
          console.log('❌ Failed to fetch inventory batches:', batchResponse.data);
        }
      } else {
        console.log('❌ RV Creation Failed:', rvResponse.data);
      }
    } else {
      console.log('❌ PO Creation Failed:', poResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testUOMConversion();