const bcrypt = require('bcryptjs');

async function generateHash() {
    const hash = await bcrypt.hash('Qweasd145698@', 12);
    console.log(hash);
}

generateHash();
