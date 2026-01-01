async function testLogin() {
  try {
    // Login as Cashier
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'pinoygym@gmail.com',
        password: 'Qweasd145698@' // Default password from seed
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login Response:', JSON.stringify(loginData, null, 2));

    if (loginData.user) {
      console.log('\nUser Details:');
      console.log('  Role:', loginData.user.Role?.name);
      console.log('  Branch ID:', loginData.user.branchId);
      console.log('  Branch:', loginData.user.Branch?.name);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();
