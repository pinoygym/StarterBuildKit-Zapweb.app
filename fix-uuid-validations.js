const fs = require('fs');
const path = require('path');

const files = [
  'lib/validations/receiving-voucher.validation.ts',
  'lib/validations/inventory.validation.ts',
  'lib/validations/pos.validation.ts',
  'lib/validations/expense.validation.ts',
  'lib/validations/ar.validation.ts',
  'lib/validations/ap.validation.ts',
  'lib/validations/warehouse.validation.ts'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  console.log(`Processing ${file}...`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Replace .uuid( with .cuid(
    content = content.replace(/\.uuid\(/g, '.cuid(');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${file}`);
    } else {
      console.log(`⏭️  No changes needed for ${file}`);
    }
  } catch (err) {
    console.error(`❌ Error processing ${file}:`, err.message);
  }
});

console.log('\n✅ All validation files updated!');
