
async function checkCategories() {
    try {
        const response = await fetch('http://localhost:3000/api/data-maintenance/product-categories?status=all', {
            method: 'GET',
        });

        console.log('API Response Status:', response.status);
        const text = await response.text();
        console.log('Raw Response:', text);

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

checkCategories();
