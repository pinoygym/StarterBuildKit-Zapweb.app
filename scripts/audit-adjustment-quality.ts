import { prisma } from '../lib/prisma';

interface QualityIssue {
    adjustmentNumber: string;
    adjustmentId: string;
    status: string;
    createdAt: Date;
    issueType: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    details?: any;
}

async function auditAdjustmentQuality() {
    const issues: QualityIssue[] = [];

    try {
        console.log('🔍 Running comprehensive data quality audit on adjustment slips...\n');

        // Fetch all adjustments with related data
        const adjustments = await prisma.inventoryAdjustment.findMany({
            include: {
                items: {
                    include: {
                        Product: {
                            select: {
                                id: true,
                                name: true,
                                baseUOM: true,
                                status: true,
                                productUOMs: {
                                    select: {
                                        name: true,
                                    }
                                }
                            },
                        },
                    },
                },
                Warehouse: true,
                Branch: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        console.log(`📊 Analyzing ${adjustments.length} adjustment slips...\n`);

        for (const adjustment of adjustments) {
            const baseInfo = {
                adjustmentNumber: adjustment.adjustmentNumber,
                adjustmentId: adjustment.id,
                status: adjustment.status,
                createdAt: adjustment.createdAt,
            };

            // Check 1: Adjustments with no items
            if (adjustment.items.length === 0) {
                issues.push({
                    ...baseInfo,
                    issueType: 'EMPTY_ADJUSTMENT',
                    severity: 'HIGH',
                    description: 'Adjustment has no items',
                });
            }

            // Check 2: Zero or negative quantities
            for (const item of adjustment.items) {
                if (item.quantity === 0) {
                    issues.push({
                        ...baseInfo,
                        issueType: 'ZERO_QUANTITY',
                        severity: 'MEDIUM',
                        description: `Product "${item.Product.name}" has zero quantity`,
                        details: { productId: item.productId, itemId: item.id },
                    });
                }

                // Negative quantities are valid for RELATIVE adjustments (decreases)
                // but might be suspicious for ABSOLUTE adjustments
                if (item.quantity < 0 && item.type === 'ABSOLUTE') {
                    issues.push({
                        ...baseInfo,
                        issueType: 'NEGATIVE_ABSOLUTE',
                        severity: 'MEDIUM',
                        description: `Product "${item.Product.name}" has negative quantity (${item.quantity}) with ABSOLUTE type`,
                        details: { productId: item.productId, quantity: item.quantity },
                    });
                }
            }

            // Check 3: Invalid or missing UOMs
            for (const item of adjustment.items) {
                const product = item.Product;
                const validUOMs = [
                    product.baseUOM,
                    ...product.productUOMs.map(u => u.name)
                ];

                if (!item.uom) {
                    issues.push({
                        ...baseInfo,
                        issueType: 'MISSING_UOM',
                        severity: 'HIGH',
                        description: `Product "${product.name}" has no UOM specified`,
                        details: { productId: item.productId, itemId: item.id },
                    });
                } else if (!validUOMs.includes(item.uom)) {
                    issues.push({
                        ...baseInfo,
                        issueType: 'INVALID_UOM',
                        severity: 'MEDIUM',
                        description: `Product "${product.name}" has UOM "${item.uom}" which is not configured for this product`,
                        details: {
                            productId: item.productId,
                            invalidUOM: item.uom,
                            validUOMs
                        },
                    });
                }
            }

            // Check 4: Inactive/deleted products
            for (const item of adjustment.items) {
                if (item.Product.status !== 'active') {
                    issues.push({
                        ...baseInfo,
                        issueType: 'INACTIVE_PRODUCT',
                        severity: 'LOW',
                        description: `Product "${item.Product.name}" is ${item.Product.status}`,
                        details: { productId: item.productId, productStatus: item.Product.status },
                    });
                }
            }

            // Check 5: Extremely large quantities (potential data entry errors)
            for (const item of adjustment.items) {
                if (Math.abs(item.quantity) > 10000) {
                    issues.push({
                        ...baseInfo,
                        issueType: 'LARGE_QUANTITY',
                        severity: 'LOW',
                        description: `Product "${item.Product.name}" has unusually large quantity: ${item.quantity}`,
                        details: { productId: item.productId, quantity: item.quantity },
                    });
                }
            }

            // Check 6: Posted adjustments without system/actual quantities
            if (adjustment.status === 'POSTED') {
                for (const item of adjustment.items) {
                    if (item.systemQuantity === null || item.actualQuantity === null) {
                        issues.push({
                            ...baseInfo,
                            issueType: 'MISSING_POSTED_DATA',
                            severity: 'HIGH',
                            description: `Posted adjustment missing systemQuantity or actualQuantity for "${item.Product.name}"`,
                            details: {
                                productId: item.productId,
                                systemQuantity: item.systemQuantity,
                                actualQuantity: item.actualQuantity
                            },
                        });
                    }
                }
            }

            // Check 7: Future-dated adjustments
            const now = new Date();
            if (adjustment.adjustmentDate > now) {
                const daysInFuture = Math.ceil((adjustment.adjustmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                issues.push({
                    ...baseInfo,
                    issueType: 'FUTURE_DATE',
                    severity: 'MEDIUM',
                    description: `Adjustment date is ${daysInFuture} days in the future`,
                    details: { adjustmentDate: adjustment.adjustmentDate },
                });
            }

            // Check 8: Very old draft adjustments (more than 30 days)
            if (adjustment.status === 'DRAFT') {
                const daysOld = Math.ceil((now.getTime() - adjustment.createdAt.getTime()) / (1000 * 60 * 60 * 24));
                if (daysOld > 30) {
                    issues.push({
                        ...baseInfo,
                        issueType: 'OLD_DRAFT',
                        severity: 'LOW',
                        description: `Draft adjustment is ${daysOld} days old and not yet posted`,
                        details: { daysOld },
                    });
                }
            }

            // Check 9: Adjustments with single item having very small quantities
            if (adjustment.items.length === 1) {
                const item = adjustment.items[0];
                if (Math.abs(item.quantity) < 0.01 && item.quantity !== 0) {
                    issues.push({
                        ...baseInfo,
                        issueType: 'TINY_QUANTITY',
                        severity: 'LOW',
                        description: `Single-item adjustment with very small quantity: ${item.quantity} for "${item.Product.name}"`,
                        details: { quantity: item.quantity },
                    });
                }
            }
        }

        // Generate Report
        console.log('═══════════════════════════════════════════════════════════════\n');

        if (issues.length === 0) {
            console.log('✅ No data quality issues found! All adjustment slips look good.\n');
        } else {
            console.log(`⚠️  Found ${issues.length} potential data quality issues:\n`);

            // Group by severity
            const high = issues.filter(i => i.severity === 'HIGH');
            const medium = issues.filter(i => i.severity === 'MEDIUM');
            const low = issues.filter(i => i.severity === 'LOW');

            // Summary
            console.log('📊 SUMMARY BY SEVERITY:');
            console.log(`   🔴 HIGH:   ${high.length} issues`);
            console.log(`   🟡 MEDIUM: ${medium.length} issues`);
            console.log(`   🟢 LOW:    ${low.length} issues\n`);

            // Summary by type
            const byType = issues.reduce((acc, issue) => {
                acc[issue.issueType] = (acc[issue.issueType] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            console.log('📊 SUMMARY BY ISSUE TYPE:');
            Object.entries(byType)
                .sort((a, b) => b[1] - a[1])
                .forEach(([type, count]) => {
                    console.log(`   • ${type}: ${count}`);
                });

            console.log('\n═══════════════════════════════════════════════════════════════\n');

            // Detailed Issues
            console.log('📋 DETAILED ISSUES:\n');

            // Show HIGH severity first
            if (high.length > 0) {
                console.log('🔴 HIGH SEVERITY ISSUES:\n');
                high.forEach((issue, idx) => {
                    console.log(`${idx + 1}. ${issue.adjustmentNumber} (${issue.status})`);
                    console.log(`   Issue: ${issue.description}`);
                    if (issue.details) {
                        console.log(`   Details: ${JSON.stringify(issue.details, null, 2)}`);
                    }
                    console.log('');
                });
            }

            // Show MEDIUM severity
            if (medium.length > 0) {
                console.log('🟡 MEDIUM SEVERITY ISSUES:\n');
                medium.forEach((issue, idx) => {
                    console.log(`${idx + 1}. ${issue.adjustmentNumber} (${issue.status})`);
                    console.log(`   Issue: ${issue.description}`);
                    if (issue.details) {
                        console.log(`   Details: ${JSON.stringify(issue.details, null, 2)}`);
                    }
                    console.log('');
                });
            }

            // Show LOW severity (limit to first 10 to avoid clutter)
            if (low.length > 0) {
                console.log(`🟢 LOW SEVERITY ISSUES (showing first ${Math.min(10, low.length)} of ${low.length}):\n`);
                low.slice(0, 10).forEach((issue, idx) => {
                    console.log(`${idx + 1}. ${issue.adjustmentNumber} (${issue.status})`);
                    console.log(`   Issue: ${issue.description}`);
                    console.log('');
                });
                if (low.length > 10) {
                    console.log(`   ... and ${low.length - 10} more low severity issues\n`);
                }
            }
        }

        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log('✨ Audit complete!\n');

    } catch (error) {
        console.error('❌ Error during audit:', error);
    } finally {
        await prisma.$disconnect();
    }
}

auditAdjustmentQuality();
