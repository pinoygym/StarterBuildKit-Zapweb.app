import { prisma } from "../lib/prisma";

async function main() {
    const admin = await prisma.user.findFirst({
        where: { email: "cybergada@gmail.com" }
    });

    if (!admin) {
        console.error("Admin user not found. Check GEMINI.md for correct email.");
        return;
    }

    const items = [
        // COMPLETED
        {
            title: "Product Management System",
            description: "Full CRUD for products, including image handling and categorization.",
            status: "COMPLETED",
            priority: "HIGH",
            tags: ["Inventory", "Core"],
            authorId: admin.id
        },
        {
            title: "Inventory Stock Control",
            description: "StockMovement logic with multiple Warehouse and Branch support.",
            status: "COMPLETED",
            priority: "HIGH",
            tags: ["Inventory", "Core"],
            authorId: admin.id
        },
        {
            title: "Enhanced Inventory Adjustments",
            description: "Added Batch Processing (50+ items), Pagination, and Copy functionality.",
            status: "COMPLETED",
            priority: "HIGH",
            tags: ["Inventory", "Optimization"],
            authorId: admin.id
        },
        {
            title: "Integrated POS System",
            description: "Dedicated POS interface with receipt generation and barcode/QR support.",
            status: "COMPLETED",
            priority: "HIGH",
            tags: ["Sales", "POS"],
            authorId: admin.id
        },
        {
            title: "Sales Order Workflow",
            description: "Full workflow from order creation to fulfillment.",
            status: "COMPLETED",
            priority: "MEDIUM",
            tags: ["Sales"],
            authorId: admin.id
        },
        {
            title: "Purchasing & Supply Chain (PO/RV)",
            description: "Purchase Orders and Receiving Vouchers with discrepancy handling.",
            status: "COMPLETED",
            priority: "HIGH",
            tags: ["Purchasing", "Stock"],
            authorId: admin.id
        },
        {
            title: "Financial Management (AR/AP)",
            description: "Tracking customer and supplier debts and payments.",
            status: "COMPLETED",
            priority: "HIGH",
            tags: ["Finance"],
            authorId: admin.id
        },
        {
            title: "User Authentication & RBAC",
            description: "Secure login flow with Role-Based Access Control and 'UNVERIFIED' user status.",
            status: "COMPLETED",
            priority: "HIGH",
            tags: ["Security"],
            authorId: admin.id
        },

        // IN_PROGRESS / PLANNED
        {
            title: "Reporting Engine",
            description: "Next-gen reporting module for customizable and asynchronous report generation.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            tags: ["Reporting", "Analytics"],
            authorId: admin.id
        },
        {
            title: "Advanced Approval Workflows",
            description: "Dynamic approval rules engine for transactions.",
            status: "IN_PROGRESS",
            priority: "MEDIUM",
            tags: ["Workflow"],
            authorId: admin.id
        },
        {
            title: "Internal Alerts & Notifications",
            description: "System-wide notification system for inventory and financial events.",
            status: "IN_PROGRESS",
            priority: "MEDIUM",
            tags: ["Communication"],
            authorId: admin.id
        },
        {
            title: "Data Maintenance & Archiving",
            description: "Automatic database backups and old record archiving.",
            status: "PLANNED",
            priority: "LOW",
            tags: ["Maintenance"],
            authorId: admin.id
        },

        // ISSUES
        {
            title: "AR Test Serialization Mismatch",
            description: "Failing integration tests due to Prisma.Decimal serialized as numbers when tests expect strings.",
            status: "ISSUE",
            priority: "MEDIUM",
            tags: ["Testing", "Bug"],
            authorId: admin.id
        },
        {
            title: "API Rate Limiting in Tests",
            description: "Parallel test execution hitting rate limits, causing 36 skipped tests.",
            status: "ISSUE",
            priority: "HIGH",
            tags: ["Testing", "DevOps"],
            authorId: admin.id
        },
        {
            title: "Registration Error Code Cleanup",
            description: "Invalid role IDs return 500 instead of 400 in the registration API.",
            status: "ISSUE",
            priority: "LOW",
            tags: ["Bug", "API"],
            authorId: admin.id
        }
    ];

    console.log(`Seeding ${items.length} roadmap items...`);

    for (const item of items) {
        await prisma.roadmapItem.create({ data: item });
    }

    console.log("Seeding completed successfully.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
