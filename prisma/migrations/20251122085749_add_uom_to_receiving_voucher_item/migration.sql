/*
  Warnings:

  - Added the required column `uom` to the `ReceivingVoucherItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PermissionResource" AS ENUM ('USERS', 'ROLES', 'PRODUCTS', 'INVENTORY', 'SALES', 'PURCHASES', 'CUSTOMERS', 'SUPPLIERS', 'REPORTS', 'SETTINGS', 'ACCOUNTING', 'BRANCHES');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE');

-- AlterTable
ALTER TABLE "ReceivingVoucherItem" ADD COLUMN     "uom" TEXT NOT NULL;
