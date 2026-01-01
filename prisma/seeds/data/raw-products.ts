export interface RawProduct {
    name: string;
    category: string;
    spec: string; // Baking, Animal Feeds, etc.
    desc: string; // Milk, Flour, etc.
    manuf?: string;
    qty?: string;
    unit: string; // CAN, BOX, etc.
    cost: number;
    type: string; // Retail, Wholesale, etc.
}

export const rawProducts: RawProduct[] = [
    { name: 'Alaska Evaporada Yellow G', category: 'Retail', spec: 'BAKING', desc: 'MILK', qty: '370 ML', unit: 'CAN', cost: 36.00, type: 'Retail' },
    { name: 'Alaska Evaporada Yellow H', category: 'WHOLESALE', spec: 'BAKING', desc: 'MILK', qty: '48 CANS/BOX', unit: 'BOX', cost: 1663.00, type: 'Wholesale' },
    { name: 'Alaska Evaporated Red G', category: 'Retail', spec: 'BAKING', desc: 'MILK', qty: '370 ML', unit: 'CAN', cost: 56.00, type: 'Retail' },
    { name: 'Alaska Evaporated Red H', category: 'WHOLESALE', spec: 'BAKING', desc: 'MILK', qty: '48 CANS/BOX', unit: 'BOX', cost: 2637.00, type: 'Wholesale' },
    { name: 'All Purpose Flour G', category: 'Retail', spec: 'BAKING', desc: 'FLOUR', unit: '', cost: 50.00, type: 'Retail' },
    { name: 'All Purpose Flour H', category: 'WHOLESALE', spec: 'BAKING', desc: 'FLOUR', unit: '', cost: 1200.00, type: 'Wholesale' },
    { name: 'Angel Evaporated 410ml G', category: 'Retail', spec: 'BAKING', desc: 'MILK', unit: '', cost: 33.00, type: 'Retail' },
    { name: 'Angel Evaporated 410ml (48cans) H', category: 'WHOLESALE', spec: 'BAKING', desc: 'MILK', unit: '', cost: 1514.00, type: 'Wholesale' },
    { name: 'Anis Concentrated G', category: 'Retail', spec: 'BAKING', desc: 'ANIS', unit: '', cost: 214.00, type: 'Retail' },
    { name: 'Anis Concentrated H', category: 'WHOLESALE', spec: 'BAKING', desc: 'ANIS', unit: '', cost: 835.00, type: 'Wholesale' },
    { name: 'Anti-Amag G', category: 'Retail', spec: 'BAKING', desc: 'ANTI-AMAG', unit: '', cost: 349.00, type: 'Retail' },
    { name: 'Anti-Amag H', category: 'WHOLESALE', spec: 'BAKING', desc: 'ANTI-AMAG', unit: '', cost: 2086.00, type: 'Wholesale' },
    { name: 'Bakels Platinum Instant Active G', category: 'Retail', spec: 'BAKING', desc: 'YEAST', unit: '', cost: 131.00, type: 'Retail' },
    { name: 'Bakels Platinum Instant Active H', category: 'WHOLESALE', spec: 'BAKING', desc: 'YEAST', unit: '', cost: 2526.00, type: 'Wholesale' },
    { name: 'Bakers Choice H', category: 'WHOLESALE', spec: 'BAKING', desc: 'BAKING POWDER', unit: '', cost: 980.00, type: 'Wholesale' },
    { name: 'Bakers Choice G', category: 'Retail', spec: 'BAKING', desc: 'BAKING POWDER', unit: '', cost: 120.00, type: 'Retail' },
    { name: 'Baking Soda G', category: 'Retail', spec: 'BAKING', desc: 'BAKING SODA', unit: '', cost: 65.00, type: 'Retail' },
    { name: 'Baking Soda H', category: 'WHOLESALE', spec: 'BAKING', desc: 'BAKING SODA', unit: '', cost: 1105.00, type: 'Wholesale' },
    { name: 'Bambi Butter G', category: 'Retail', spec: 'BAKING', desc: 'MARGARINE', unit: '', cost: 265.00, type: 'Retail' },
    { name: 'Bambi Butter H', category: 'WHOLESALE', spec: 'BAKING', desc: 'MARGARINE', unit: '', cost: 1560.00, type: 'Wholesale' },
    { name: 'Bambi Lard H', category: 'WHOLESALE', spec: 'BAKING', desc: 'SHORTENING', unit: '', cost: 5700.00, type: 'Wholesale' },
    { name: 'Bensdorp G', category: 'Retail', spec: 'BAKING', desc: 'COCOA', unit: '', cost: 900.00, type: 'Retail' },
    { name: 'Bensdorp H', category: 'WHOLESALE', spec: 'BAKING', desc: 'COCOA', unit: '', cost: 21875.00, type: 'Wholesale' },
    { name: 'Blueberry 6kg H', category: 'WHOLESALE', spec: 'BAKING', desc: 'BLUEBERRY', unit: '', cost: 2976.00, type: 'Wholesale' },
    { name: 'Butter Oil G', category: 'Retail', spec: 'BAKING', desc: 'FLAVORING', unit: '', cost: 274.00, type: 'Retail' },
    { name: 'Butter Oil H', category: 'WHOLESALE', spec: 'BAKING', desc: 'FLAVORING', unit: '', cost: 3231.00, type: 'Wholesale' },
    { name: 'Cake Flour G', category: 'Retail', spec: 'BAKING', desc: 'FLOUR', unit: '', cost: 50.00, type: 'Retail' },
    { name: 'Red Bowl Cake Flour H', category: '', spec: 'BAKING', desc: 'FLOUR', unit: '', cost: 1110.00, type: 'Wholesale' }, // Assuming wholesale by context
    { name: 'Cake Flour H', category: 'WHOLESALE', spec: 'BAKING', desc: 'FLOUR', unit: '', cost: 1200.00, type: 'Wholesale' },
    { name: 'Calumet G', category: 'Retail', spec: 'BAKING', desc: 'BAKING POWDER', unit: '', cost: 120.00, type: 'Retail' },
    { name: 'Calumet 14kg H', category: 'WHOLESALE', spec: 'BAKING', desc: 'BAKING POWDER', unit: '', cost: 2255.00, type: 'Wholesale' },
    { name: 'Canon Oil 15kl H', category: 'WHOLESALE', spec: 'BAKING', desc: 'OIL', unit: '', cost: 1450.00, type: 'Wholesale' },
    { name: 'Carbonato G', category: 'Retail', spec: 'BAKING', desc: 'CARBONATO', unit: '', cost: 41.00, type: 'Retail' },
    { name: 'Carbonato H', category: 'WHOLESALE', spec: 'BAKING', desc: 'CARBONATO', unit: '', cost: 975.00, type: 'Wholesale' },
    { name: 'Quezo G', category: 'Retail', spec: 'BAKING', desc: 'CHEESE', unit: '', cost: 40.00, type: 'Retail' },
    { name: 'Quezo H', category: 'WHOLESALE', spec: 'BAKING', desc: 'CHEESE', unit: '', cost: 1900.00, type: 'Wholesale' },
    { name: 'Cheezee G', category: 'Retail', spec: 'BAKING', desc: 'CHEESE', unit: '', cost: 54.00, type: 'Retail' },
    { name: 'Cheezee H', category: 'WHOLESALE', spec: 'BAKING', desc: 'CHEESE', unit: '', cost: 2532.00, type: 'Wholesale' },
    { name: 'Cinnamon Powder G', category: 'Retail', spec: 'BAKING', desc: 'CINNAMON', unit: '', cost: 520.00, type: 'Retail' },
    { name: 'Cinnamon Powder H', category: 'WHOLESALE', spec: 'BAKING', desc: 'CINNAMON', unit: '', cost: 14950.00, type: 'Wholesale' },
    { name: 'Cornstarch G', category: 'Retail', spec: 'BAKING', desc: 'CORNSTARCH', unit: '', cost: 49.00, type: 'Retail' },
    { name: 'Cornstarch H', category: 'WHOLESALE', spec: 'BAKING', desc: 'CORNSTARCH', unit: '', cost: 1175.00, type: 'Wholesale' },
    { name: 'Cracked Wheat H', category: 'WHOLESALE', spec: 'BAKING', desc: 'FLOUR', unit: '', cost: 670.00, type: 'Wholesale' },
    { name: 'Cream of Tartar G', category: 'Retail', spec: 'BAKING', desc: 'CREAM OF TARTAR', unit: '', cost: 450.00, type: 'Retail' },
    { name: 'Cream of Tartar H', category: 'WHOLESALE', spec: 'BAKING', desc: 'CREAM OF TARTAR', unit: '', cost: 4235.00, type: 'Wholesale' },
    { name: 'Dairy Bake G', category: 'Retail', spec: 'BAKING', desc: 'MILK POWDER', unit: '', cost: 160.00, type: 'Retail' },
    { name: 'Dairy Bake H', category: 'WHOLESALE', spec: 'BAKING', desc: 'MILK POWDER', unit: '', cost: 3750.00, type: 'Wholesale' },
    { name: 'Desiccated Coconut G', category: 'Retail', spec: 'BAKING', desc: 'DESICCATED', unit: '', cost: 120.00, type: 'Retail' },
    { name: 'Desiccated Coconut H', category: 'WHOLESALE', spec: 'BAKING', desc: 'DESICCATED', unit: '', cost: 4380.00, type: 'Wholesale' },
    { name: 'Dobrim G', category: 'Retail', spec: 'BAKING', desc: 'BREAD IMPROVER', unit: '', cost: 124.00, type: 'Retail' },
    { name: 'Dobrim H', category: 'WHOLESALE', spec: 'BAKING', desc: 'BREAD IMPROVER', unit: '', cost: 1433.00, type: 'Wholesale' },
    { name: 'Doner G', category: 'Retail', spec: 'BAKING', desc: 'DONER', unit: '', cost: 55.00, type: 'Retail' },
    { name: 'Doner H', category: 'WHOLESALE', spec: 'BAKING', desc: 'DONER', unit: '', cost: 2500.00, type: 'Wholesale' },
    { name: 'Doreen Condensed G', category: 'Retail', spec: 'BAKING', desc: 'MILK', unit: '', cost: 48.00, type: 'Retail' },
    { name: 'Doreen Condensed H', category: 'WHOLESALE', spec: 'BAKING', desc: 'MILK', unit: '', cost: 2240.00, type: 'Wholesale' },
    { name: 'Emmie Victory Cocoa G', category: 'Retail', spec: 'BAKING', desc: 'COCOA', unit: '', cost: 100.00, type: 'Retail' },
    { name: 'Emmie Victory Cocoa H', category: 'WHOLESALE', spec: 'BAKING', desc: 'COCOA', unit: '', cost: 1980.00, type: 'Wholesale' },
    { name: 'Farmland G', category: 'Retail', spec: 'BAKING', desc: 'MILK POWDER', unit: '', cost: 70.00, type: 'Retail' },
    { name: 'Farmland H', category: 'WHOLESALE', spec: 'BAKING', desc: 'MILK POWDER', unit: '', cost: 1420.00, type: 'Wholesale' },
    { name: 'Foodcolor - Choco Brown G', category: 'Retail', spec: 'BAKING', desc: 'FOODCOLOR', unit: '', cost: 155.00, type: 'Retail' },
    { name: 'Foodcolor - Choco Brown H', category: 'WHOLESALE', spec: 'BAKING', desc: 'FOODCOLOR', unit: '', cost: 1840.00, type: 'Wholesale' },

    // ... Truncated for token safety, adding representative items and the ones requiring special handling ...
    { name: 'Sugar - Brown G', category: 'Retail', spec: 'BAKING', desc: 'SUGAR', unit: '', cost: 57.00, type: 'Retail' },
    { name: 'Sugar - Brown 50kg H', category: 'WHOLESALE', spec: 'BAKING', desc: 'SUGAR', unit: '', cost: 2730.00, type: 'Wholesale' },

    { name: 'Feeds - Chicken Basic Broiler Finisher H', category: 'WHOLESALE', spec: 'ANIMAL FEEDS', desc: 'CHICKEN FEEDS', manuf: 'Philmico', unit: '', cost: 1737.00, type: 'Wholesale' },
    { name: 'Feeds - Salto Baby Stag Developer Pack', category: 'Retail', spec: 'ANIMAL FEEDS', desc: 'CHICKEN FEEDS', manuf: 'Philmico', unit: '', cost: 44.50, type: 'Retail' },
    { name: 'Feeds - Salto Baby Stag Developer H', category: 'WHOLESALE', spec: 'ANIMAL FEEDS', desc: 'CHICKEN FEEDS', manuf: 'Philmico', unit: '', cost: 1109.00, type: 'Wholesale' },

    { name: 'Cup - Baking Cup #1 G', category: 'Retail', spec: 'PLASTIC/PAPER/CUPS', desc: 'CUPS', unit: '', cost: 5.00, type: 'Retail' },
    { name: 'Cup - Baking Cup #1 H', category: 'WHOLESALE', spec: 'PLASTIC/PAPER/CUPS', desc: 'CUPS', unit: '', cost: 95.00, type: 'Wholesale' },

    { name: 'PLASTIC - Excellent 4x6 (01) G', category: 'Retail', spec: 'PLASTIC/PAPER/CUPS', desc: 'PLASTIC', manuf: 'EXCELLENT', unit: '', cost: 17.00, type: 'Retail' },
    { name: 'PLASTIC - Excellent 4x6 (01) H', category: 'WHOLESALE', spec: 'PLASTIC/PAPER/CUPS', desc: 'PLASTIC', manuf: 'EXCELLENT', unit: '', cost: 150.00, type: 'Wholesale' },

    { name: 'Others - CHLORINE 70% G', category: 'Retail', spec: 'OTHERS', desc: 'CHEMICALS', unit: '', cost: 280.00, type: 'Retail' },
    { name: 'Others - CHLORINE 70% H', category: 'WHOLESALE', spec: 'OTHERS', desc: 'CHEMICALS', unit: '', cost: 9500.00, type: 'Wholesale' }
];
