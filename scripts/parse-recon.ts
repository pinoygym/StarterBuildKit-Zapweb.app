import * as fs from 'fs';

const rawData = fs.readFileSync('reconciliation_output.txt', 'utf8');
const lines = rawData.split('\n');

let currentProduct = '';
const reconciliations: any[] = [];

lines.forEach(line => {
    const parts = line.split('|');
    if (parts[0] === 'PRODUCT') {
        currentProduct = parts[1];
    } else if (parts[0] === 'IMAGE') {
        reconciliations.push({
            product: currentProduct,
            type: 'IMAGE',
            ref: parts[1],
            qty: parts[2],
            uom: parts[3]
        });
    } else if (parts[0] === 'STOCK') {
        reconciliations.push({
            product: currentProduct,
            type: 'STOCK',
            warehouse: parts[1],
            qty: parts[2],
            uom: parts[3]
        });
    }
});

// Group by product
const grouped: Record<string, any> = {};
reconciliations.forEach(r => {
    if (!grouped[r.product]) grouped[r.product] = { images: [], stocks: [] };
    if (r.type === 'IMAGE') grouped[r.product].images.push(r);
    else grouped[r.product].stocks.push(r);
});

let md = '# Global Inventory Reconciliation Table\n\n';
md += '| Product Name | Adjustment Ref | Image Qty | Warehouse | System Qty (Inventory Module) | UOM | Status |\n';
md += '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n';

Object.keys(grouped).sort().forEach(p => {
    const item = grouped[p];
    const maxLines = Math.max(item.images.length, item.stocks.length);

    for (let i = 0; i < maxLines; i++) {
        const img = item.images[i] || {};
        const stk = item.stocks[i] || {};

        const prodCell = i === 0 ? p : ''; // Only show product name on first line of group
        const imgRef = img.ref || '-';
        const imgQty = img.qty || '-';
        const wh = stk.warehouse || '-';
        const sysQty = stk.qty || '-';
        const uom = img.uom || stk.uom || '-';

        // Status Logic
        let status = '';
        if (img.qty && stk.qty) {
            // Simple numeric check if possible
            const nImg = parseFloat(img.qty);
            const nStk = parseFloat(stk.qty);
            if (nImg === nStk) status = '✅ Match';
            else status = '⚠️ Diff';
        } else {
            status = '-';
        }

        md += `| ${prodCell} | ${imgRef} | ${imgQty} | ${wh} | ${sysQty} | ${uom} | ${status} |\n`;
    }
});

fs.writeFileSync('c:/Users/cyber/Documents/GitHub/buenasv2/GLOBAL-RECONCILIATION-TABLE.md', md);
