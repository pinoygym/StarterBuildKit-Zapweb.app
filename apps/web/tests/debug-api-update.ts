
const productId = '75ed6f1b-5be2-4602-a5d8-30842e2cb4ef';

async function testUpdate() {
    try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                category: 'New Custom Category',
                name: 'Updated Name For Testing'
            })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response Text:', text);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testUpdate();
