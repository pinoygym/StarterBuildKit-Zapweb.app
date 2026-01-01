const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWk3cDAxdG4wMDZsdmFhZ29kaW83dzIzIiwiZW1haWwiOiJjeWJlcmdhZGFAZ21haWwuY29tIiwicm9sZUlkIjoiY21pN295bXE2MDAxOXZhZWMwdjRqYnVnbSIsImlhdCI6MTc2MzY2MTYyNiwiZXhwIjoxNzYzNzQ4MDI2fQ.TTq4bSEzuJl6NCTbjzo-wJA6DlRUBNPzpRVstylfhP0';

async function testSalesOrder() {
  try {
    // Get branches first
    const branchRes = await fetch('http://localhost:3000/api/branches', {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const branches = await branchRes.json();
    console.log('Branches:', JSON.stringify(branches).substring(0, 200));

    if (!branches.success || !branches.data || branches.data.length === 0) {
      console.log('No branches found');
      return;
    }

    const branch = branches.data[0];
    console.log('Using branch:', branch.id);

    // Get warehouses
    const warehouseRes = await fetch(`http://localhost:3000/api/warehouses?branchId=${branch.id}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const warehouses = await warehouseRes.json();
    console.log('Warehouses:', JSON.stringify(warehouses).substring(0, 200));

    if (!warehouses.success || !warehouses.data || warehouses.data.length === 0) {
      console.log('No warehouses found');
      return;
    }

    const warehouse = warehouses.data[0];
    console.log('Using warehouse:', warehouse.id);

    // Get products
    const productRes = await fetch('http://localhost:3000/api/products', {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const products = await productRes.json();
    console.log('Products:', JSON.stringify(products).substring(0, 200));

    if (!products.success || !products.data || products.data.length === 0) {
      console.log('No products found');
      return;
    }

    const product = products.data[0];
    console.log('Using product:', product.id, product.name);

    // Create sales order
    const salesOrder = {
      customerName: 'Test Customer',
      customerPhone: '09123456789',
      customerEmail: 'test@example.com',
      deliveryAddress: '123 Test St',
      warehouseId: warehouse.id,
      branchId: branch.id,
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: [{
        productId: product.id,
        quantity: 5,
        uom: product.baseUOM,
        unitPrice: 100,
        subtotal: 500
      }]
    };

    console.log('\n=== Creating Sales Order ===');
    console.log(JSON.stringify(salesOrder, null, 2));

    const soRes = await fetch('http://localhost:3000/api/sales-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(salesOrder)
    });

    const result = await soRes.json();
    console.log('\n=== Sales Order Result ===');
    console.log(JSON.stringify(result, null, 2));

    if (!result.success) {
      console.error('\n❌ FAILED:', result.error);
      if (result.fields) {
        console.error('Validation errors:', result.fields);
      }
    } else {
      console.log('\n✅ SUCCESS: Sales order created');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

testSalesOrder();
