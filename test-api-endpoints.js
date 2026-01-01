const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('Testing Dashboard API Endpoints on localhost:3001...\n');

  const endpoints = [
    {
      name: 'Dashboard KPIs',
      path: '/api/dashboard/kpis?branchId=cmi7p02k6006nvaagaxqw8ezs'
    },
    {
      name: 'Top Products',
      path: '/api/dashboard/top-products?branchId=cmi7p02k6006nvaagaxqw8ezs&limit=5'
    },
    {
      name: 'Sales Trends',
      path: '/api/dashboard/sales-trends?branchId=cmi7p02k6006nvaagaxqw8ezs&days=7'
    },
    {
      name: 'Branch Comparison',
      path: '/api/dashboard/branch-comparison'
    }
  ];

  let allPassed = true;

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint.name}`);
      console.log(`Endpoint: ${endpoint.path}`);
      const result = await testEndpoint(endpoint.path);

      if (result.status === 200) {
        console.log(`✅ Status: ${result.status}`);
        console.log(`✅ Response: ${result.data.success ? 'Success' : 'Failed'}`);
        if (result.data.data) {
          console.log(`✅ Data returned: Yes`);
        }
      } else {
        console.log(`❌ Status: ${result.status}`);
        console.log(`❌ Error:`, result.data);
        allPassed = false;
      }
      console.log('---\n');
    } catch (error) {
      console.error(`❌ Error testing ${endpoint.name}:`, error.message);
      console.log('---\n');
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('\n🎉 All endpoint tests PASSED!');
  } else {
    console.log('\n⚠️  Some endpoint tests FAILED');
  }
}

runTests();
