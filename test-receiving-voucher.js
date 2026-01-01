const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWk3cDAxdG4wMDZsdmFhZ29kaW83dzIzIiwiZW1haWwiOiJjeWJlcmdhZGFAZ21haWwuY29tIiwicm9sZUlkIjoiY21pN295bXE2MDAxOXZhZWMwdjRqYnVnbSIsImlhdCI6MTc2MzY2MTYyNiwiZXhwIjoxNzYzNzQ4MDI2fQ.TTq4bSEzuJl6NCTbjzo-wJA6DlRUBNPzpRVstylfhP0';

async function testReceivingVoucher() {
  try {
    // Get a purchase order with status 'ordered'
    console.log('Fetching purchase orders with status=ordered...');
    const poRes = await fetch('http://localhost:3000/api/purchase-orders?status=ordered', {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });

    const poData = await poRes.json();
    console.log('PO Response:', JSON.stringify(poData, null, 2).substring(0, 500));

    if (!poData.success || !poData.data || poData.data.length === 0) {
      console.log('❌ No purchase orders with status=ordered found');
      return;
    }

    const po = poData.data[0];
    console.log(`\n✓ Using PO: ${po.poNumber} (ID: ${po.id})`);
    console.log(`  Items: ${po.PurchaseOrderItem?.length || 0}`);

    if (!po.PurchaseOrderItem || po.PurchaseOrderItem.length === 0) {
      console.log('❌ PO has no items');
      return;
    }

    // Create receiving voucher
    const rv = {
      purchaseOrderId: po.id,
      receiverName: 'Test Receiver',
      deliveryNotes: 'Test receiving voucher',
      items: po.PurchaseOrderItem.map(item => ({
        productId: item.productId,
        orderedQuantity: Number(item.quantity),
        receivedQuantity: Number(item.quantity), // Receive full quantity
        unitPrice: Number(item.unitPrice),
      })),
    };

    console.log('\n📦 Creating Receiving Voucher...');
    console.log('RV Data:', JSON.stringify(rv, null, 2));

    const rvRes = await fetch('http://localhost:3000/api/receiving-vouchers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(rv)
    });

    const rvResult = await rvRes.json();
    console.log('\n📋 RV Result:', JSON.stringify(rvResult, null, 2));

    if (rvResult.success) {
      console.log(`\n✅ SUCCESS: Created RV ${rvResult.data.rvNumber}`);
    } else {
      console.log(`\n❌ FAILED: ${rvResult.error}`);
      if (rvResult.fields) {
        console.log('Validation errors:', rvResult.fields);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testReceivingVoucher();
