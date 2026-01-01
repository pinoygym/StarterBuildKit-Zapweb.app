import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient) {
    console.log('Seeding users from JSON...');

    const usersData = [
        {
            "id": "9de2e837-a5a3-4295-a077-9efe10a8a7ac",
            "email": "pinoygym@gmail.com",
            "passwordHash": "$2b$12$.Fdxg6poP/3MD2GQUwDtNe6lOW3bxBpSXXSUEopbTP076W0pNuI.2",
            "firstName": "eee",
            "lastName": "eee",
            "phone": "",
            "roleId": "93122a79-14f5-46a7-8e12-70d63ddf1871",
            "branchId": "cmi9kluws0000jl04vhodelfo",
            "status": "INACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": "2025-12-12T02:36:16.416Z",
            "passwordChangedAt": null,
            "createdAt": "2025-11-21T04:49:18.686Z",
            "updatedAt": "2025-12-03T01:54:15.901Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "93122a79-14f5-46a7-8e12-70d63ddf1871",
                "name": "Cashier",
                "description": "Handle POS transactions and customer sales",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:25.062Z",
                "updatedAt": "2025-12-09T21:22:59.261Z"
            },
            "Branch": {
                "id": "cmi9kluws0000jl04vhodelfo",
                "name": "LAL Store",
                "code": "DC001",
                "location": "Indangan, Davao City",
                "manager": "Ethel Mendoza",
                "phone": "09953532846",
                "status": "active",
                "createdAt": "2025-11-22T00:48:19.901Z",
                "updatedAt": "2025-12-03T01:54:15.429Z"
            }
        },
        {
            "id": "bb58872b-7a81-4c16-a751-6d697e15713a",
            "email": "teamwebplus@gmail.com",
            "passwordHash": "$2b$12$Xd8aj5OzMz2Qux6UniEaaOI2GNwVWO3iiqbA0QS5zmDwI3scUThIK",
            "firstName": "aaa",
            "lastName": "Gada",
            "phone": "",
            "roleId": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
            "branchId": "cmi9kluws0000jl04vhodelfo",
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": "2025-11-21T07:36:16.524Z",
            "passwordChangedAt": null,
            "createdAt": "2025-11-21T06:00:05.674Z",
            "updatedAt": "2025-12-03T01:54:15.835Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
                "name": "Super Admin",
                "description": "Full system access with all permissions",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:24.527Z",
                "updatedAt": "2025-12-09T21:22:58.154Z"
            },
            "Branch": {
                "id": "cmi9kluws0000jl04vhodelfo",
                "name": "LAL Store",
                "code": "DC001",
                "location": "Indangan, Davao City",
                "manager": "Ethel Mendoza",
                "phone": "09953532846",
                "status": "active",
                "createdAt": "2025-11-22T00:48:19.901Z",
                "updatedAt": "2025-12-03T01:54:15.429Z"
            }
        },
        {
            "id": "319c2940-80c9-4143-97de-34060a2049b7",
            "email": "velmbautista@gmail.com",
            "passwordHash": "$2b$12$keHXnUIpGypW3wwb5tNtb.4vFLYec.STe8DEcxDj3Ghq5KHIY/oOe",
            "firstName": "Vel",
            "lastName": "Bau",
            "phone": "",
            "roleId": "93122a79-14f5-46a7-8e12-70d63ddf1871",
            "branchId": "cmi9kluws0000jl04vhodelfo",
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": "2025-11-21T06:19:34.104Z",
            "passwordChangedAt": null,
            "createdAt": "2025-11-21T06:17:42.969Z",
            "updatedAt": "2025-12-03T01:54:15.768Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "93122a79-14f5-46a7-8e12-70d63ddf1871",
                "name": "Cashier",
                "description": "Handle POS transactions and customer sales",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:25.062Z",
                "updatedAt": "2025-12-09T21:22:59.261Z"
            },
            "Branch": {
                "id": "cmi9kluws0000jl04vhodelfo",
                "name": "LAL Store",
                "code": "DC001",
                "location": "Indangan, Davao City",
                "manager": "Ethel Mendoza",
                "phone": "09953532846",
                "status": "active",
                "createdAt": "2025-11-22T00:48:19.901Z",
                "updatedAt": "2025-12-03T01:54:15.429Z"
            }
        },
        {
            "id": "4112b97b-aeb5-4b86-908f-0f31e5a9f8ef",
            "email": "mendozaea7@gmail.com",
            "passwordHash": "$2b$12$RsVItPawpmsouZ1TSjN4lO3l/oRdh/aWPros/fr23E.30VW4QOViC",
            "firstName": "Ethel",
            "lastName": "Mendoza",
            "phone": "",
            "roleId": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
            "branchId": "cmi9kluws0000jl04vhodelfo",
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": "2025-11-22T04:15:45.000Z",
            "passwordChangedAt": null,
            "createdAt": "2025-11-22T00:23:56.405Z",
            "updatedAt": "2025-12-03T01:54:16.035Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
                "name": "Super Admin",
                "description": "Full system access with all permissions",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:24.527Z",
                "updatedAt": "2025-12-09T21:22:58.154Z"
            },
            "Branch": {
                "id": "cmi9kluws0000jl04vhodelfo",
                "name": "LAL Store",
                "code": "DC001",
                "location": "Indangan, Davao City",
                "manager": "Ethel Mendoza",
                "phone": "09953532846",
                "status": "active",
                "createdAt": "2025-11-22T00:48:19.901Z",
                "updatedAt": "2025-12-03T01:54:15.429Z"
            }
        },
        {
            "id": "93ba98ba-5ab6-476c-9138-e6efe8a424c0",
            "email": "lancemendoza360@gmail.com",
            "passwordHash": "$2b$12$um9T6IZCC6ZsbWG/hQ3ph.75SY3wgNaWfeW4f1EWH3uQ85CslwK6K",
            "firstName": "Lance",
            "lastName": "Mendoza",
            "phone": "",
            "roleId": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
            "branchId": "cmi9kluws0000jl04vhodelfo",
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": "2025-11-22T02:24:03.023Z",
            "passwordChangedAt": null,
            "createdAt": "2025-11-22T02:22:15.559Z",
            "updatedAt": "2025-12-03T01:54:15.968Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
                "name": "Super Admin",
                "description": "Full system access with all permissions",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:24.527Z",
                "updatedAt": "2025-12-09T21:22:58.154Z"
            },
            "Branch": {
                "id": "cmi9kluws0000jl04vhodelfo",
                "name": "LAL Store",
                "code": "DC001",
                "location": "Indangan, Davao City",
                "manager": "Ethel Mendoza",
                "phone": "09953532846",
                "status": "active",
                "createdAt": "2025-11-22T00:48:19.901Z",
                "updatedAt": "2025-12-03T01:54:15.429Z"
            }
        },
        {
            "id": "cmi9zaqz30000var8h3kt6zu8",
            "email": "aaaa@gmail.com",
            "passwordHash": "$2b$12$v2fxX5w8hNoVXmAcRCk5qOe7yOIAiu6AH8QuCbQbxV4WyyExkJ9Ba",
            "firstName": "aaa",
            "lastName": "aaa",
            "phone": "",
            "roleId": "93122a79-14f5-46a7-8e12-70d63ddf1871",
            "branchId": "cmi9kluws0000jl04vhodelfo",
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": null,
            "passwordChangedAt": null,
            "createdAt": "2025-11-22T07:39:35.823Z",
            "updatedAt": "2025-12-03T01:54:15.631Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "93122a79-14f5-46a7-8e12-70d63ddf1871",
                "name": "Cashier",
                "description": "Handle POS transactions and customer sales",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:25.062Z",
                "updatedAt": "2025-12-09T21:22:59.261Z"
            },
            "Branch": {
                "id": "cmi9kluws0000jl04vhodelfo",
                "name": "LAL Store",
                "code": "DC001",
                "location": "Indangan, Davao City",
                "manager": "Ethel Mendoza",
                "phone": "09953532846",
                "status": "active",
                "createdAt": "2025-11-22T00:48:19.901Z",
                "updatedAt": "2025-12-03T01:54:15.429Z"
            }
        },
        {
            "id": "6bc79401-7a3c-445d-8441-880d575ad5fc",
            "email": "demo@example.com",
            "passwordHash": "$2b$12$005vGfmpHPhgWJSAcyEq.u64UWpSPm1kpZEA5.gcY.h6Fx5HwJNV.",
            "firstName": "Demo",
            "lastName": "User",
            "phone": null,
            "roleId": "8a31b769-0d1c-478d-aff0-28e56583c9dd",
            "branchId": null,
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": null,
            "passwordChangedAt": null,
            "createdAt": "2025-12-03T01:08:25.562Z",
            "updatedAt": "2025-12-09T21:23:00.107Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "8a31b769-0d1c-478d-aff0-28e56583c9dd",
                "name": "Branch Manager",
                "description": "Manage branch operations and staff",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:24.995Z",
                "updatedAt": "2025-12-09T21:22:59.202Z"
            },
            "Branch": null
        },
        {
            "id": "9653c0ee-56b0-46e5-8206-ac36136689b8",
            "email": "cybergada@gmail.com",
            "passwordHash": "$2b$12$g7jFAbb7rlwhK0dEnFxp6exrqioLmpAtT/hjEyTdD5pCxsHdtQv62",
            "firstName": "Cyber",
            "lastName": "Gada",
            "phone": "",
            "roleId": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
            "branchId": "cmi9kluws0000jl04vhodelfo",
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": true,
            "lastLoginAt": "2025-12-12T03:59:26.026Z",
            "passwordChangedAt": null,
            "createdAt": "2025-12-03T01:08:25.654Z",
            "updatedAt": "2025-12-09T21:22:59.742Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
                "name": "Super Admin",
                "description": "Full system access with all permissions",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:24.527Z",
                "updatedAt": "2025-12-09T21:22:58.154Z"
            },
            "Branch": {
                "id": "cmi9kluws0000jl04vhodelfo",
                "name": "LAL Store",
                "code": "DC001",
                "location": "Indangan, Davao City",
                "manager": "Ethel Mendoza",
                "phone": "09953532846",
                "status": "active",
                "createdAt": "2025-11-22T00:48:19.901Z",
                "updatedAt": "2025-12-03T01:54:15.429Z"
            }
        },
        {
            "id": "a7f0a2d6-6a4f-4ff6-a45d-0c4e7e43cbf2",
            "email": "test-a7f0a2d6-6a4f-4ff6-a45d-0c4e7e43cbf2@example.com",
            "passwordHash": "$2b$10$qtcwhyUBXI.VvciFJ.hcP.KFPuLe/EkA7YUvanEiNp6.3ytI1mGNi",
            "firstName": "Test",
            "lastName": "User",
            "phone": null,
            "roleId": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
            "branchId": null,
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": null,
            "passwordChangedAt": null,
            "createdAt": "2025-12-05T14:49:14.729Z",
            "updatedAt": "2025-12-05T14:49:14.716Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
                "name": "Super Admin",
                "description": "Full system access with all permissions",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:24.527Z",
                "updatedAt": "2025-12-09T21:22:58.154Z"
            },
            "Branch": null
        },
        {
            "id": "4c703cab-6ee5-4b74-9e91-ff77bca8b979",
            "email": "test-4c703cab-6ee5-4b74-9e91-ff77bca8b979@example.com",
            "passwordHash": "$2b$10$1njRW2OMfBJEwscQ/EwC5OvU.AmC6WrCeN4KAUlCYg4bQKkPG4DvO",
            "firstName": "Test",
            "lastName": "User",
            "phone": null,
            "roleId": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
            "branchId": null,
            "status": "INACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": "2025-12-09T18:45:23.996Z",
            "passwordChangedAt": null,
            "createdAt": "2025-12-09T18:45:22.573Z",
            "updatedAt": "2025-12-09T18:45:22.551Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
                "name": "Super Admin",
                "description": "Full system access with all permissions",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:24.527Z",
                "updatedAt": "2025-12-09T21:22:58.154Z"
            },
            "Branch": null
        },
        {
            "id": "4b186166-2c26-4549-b613-4d56ba9986af",
            "email": "test.register.8ef6e1a8-3704-4cfe-92da-a9372669fc44@example.com",
            "passwordHash": "$2b$12$jPhO42DOikT.ebXGmZKP6e4c04GQogHbSlONDSx8MguOJaV7JPfQC",
            "firstName": "Test",
            "lastName": "User",
            "phone": null,
            "roleId": "93122a79-14f5-46a7-8e12-70d63ddf1871",
            "branchId": null,
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": null,
            "passwordChangedAt": null,
            "createdAt": "2025-12-12T02:16:09.127Z",
            "updatedAt": "2025-12-12T02:16:09.052Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "93122a79-14f5-46a7-8e12-70d63ddf1871",
                "name": "Cashier",
                "description": "Handle POS transactions and customer sales",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:25.062Z",
                "updatedAt": "2025-12-09T21:22:59.261Z"
            },
            "Branch": null
        },
        {
            "id": "decdbbe4-7339-41bb-b074-8eba8832f9eb",
            "email": "test.register.87759a1a-d6a0-4615-a21f-298de366b457@example.com",
            "passwordHash": "$2b$12$XWvxoxx/..FSfnFKolzK/eqAxk8nY/oeFQsOKLC.Fo7JlPXNsiAku",
            "firstName": "Test",
            "lastName": "User",
            "phone": null,
            "roleId": "93122a79-14f5-46a7-8e12-70d63ddf1871",
            "branchId": null,
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": null,
            "passwordChangedAt": null,
            "createdAt": "2025-12-12T02:16:50.245Z",
            "updatedAt": "2025-12-12T02:16:50.199Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "93122a79-14f5-46a7-8e12-70d63ddf1871",
                "name": "Cashier",
                "description": "Handle POS transactions and customer sales",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:25.062Z",
                "updatedAt": "2025-12-09T21:22:59.261Z"
            },
            "Branch": null
        },
        {
            "id": "80106ba8-4f59-4733-a6f9-b561b977417a",
            "email": "teamwebplus1@gmail.com",
            "passwordHash": "$2b$12$GKD5lIn6DcxVidDm43m6BOWzq7jxdXehzGr/vqz7i6/HQjL3ycV7K",
            "firstName": "ddd",
            "lastName": "ddd",
            "phone": null,
            "roleId": "93122a79-14f5-46a7-8e12-70d63ddf1871",
            "branchId": null,
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": "2025-12-12T02:39:02.697Z",
            "passwordChangedAt": null,
            "createdAt": "2025-12-12T02:38:34.733Z",
            "updatedAt": "2025-12-12T02:38:34.714Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "93122a79-14f5-46a7-8e12-70d63ddf1871",
                "name": "Cashier",
                "description": "Handle POS transactions and customer sales",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:25.062Z",
                "updatedAt": "2025-12-09T21:22:59.261Z"
            },
            "Branch": null
        },
        {
            "id": "95f3817e-4873-4f33-a248-c3bd6b0031a6",
            "email": "ormocbuenas.office@gmail.com",
            "passwordHash": "$2b$12$m/ed3/nz.9joFXp1iKRqBuusdNCpEI3Lsz.b3WUxjBzvsAnMsWMJS",
            "firstName": "Joan",
            "lastName": "Rosales",
            "phone": "",
            "roleId": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
            "branchId": null,
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": "2025-12-12T02:52:07.352Z",
            "passwordChangedAt": null,
            "createdAt": "2025-12-12T02:44:36.209Z",
            "updatedAt": "2025-12-12T02:44:36.201Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
                "name": "Super Admin",
                "description": "Full system access with all permissions",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:24.527Z",
                "updatedAt": "2025-12-09T21:22:58.154Z"
            },
            "Branch": null
        },
        {
            "id": "9783abfb-b610-4e74-9a32-f1af6f614914",
            "email": "mitzryl.carcasona@gmail.com",
            "passwordHash": "$2b$12$XxIakkETOos9/N2U5tq21u2FlGFZrqdx.v9W1CL4sWXGG9/yg1N36",
            "firstName": "Mitzryl",
            "lastName": "Carcasona",
            "phone": "",
            "roleId": "8a31b769-0d1c-478d-aff0-28e56583c9dd",
            "branchId": null,
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": "2025-12-12T02:50:33.426Z",
            "passwordChangedAt": null,
            "createdAt": "2025-12-12T02:45:35.391Z",
            "updatedAt": "2025-12-12T02:45:35.389Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "8a31b769-0d1c-478d-aff0-28e56583c9dd",
                "name": "Branch Manager",
                "description": "Manage branch operations and staff",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:24.995Z",
                "updatedAt": "2025-12-09T21:22:59.202Z"
            },
            "Branch": null
        },
        {
            "id": "864afb22-990a-4bb0-a9ac-e1ab32bda0f4",
            "email": "ivyjean_laude@gmail.com",
            "passwordHash": "$2b$12$fOA9pycVPNWwX6rl7heeQ.oF8JjjcuJsSFpNMwvv3qB1Szy9QU4/q",
            "firstName": "ivy",
            "lastName": "attili",
            "phone": null,
            "roleId": "93122a79-14f5-46a7-8e12-70d63ddf1871",
            "branchId": null,
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": "2025-12-12T02:46:04.962Z",
            "passwordChangedAt": null,
            "createdAt": "2025-12-12T02:45:57.545Z",
            "updatedAt": "2025-12-12T02:45:57.538Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "93122a79-14f5-46a7-8e12-70d63ddf1871",
                "name": "Cashier",
                "description": "Handle POS transactions and customer sales",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:25.062Z",
                "updatedAt": "2025-12-09T21:22:59.261Z"
            },
            "Branch": null
        },
        {
            "id": "f67e17b6-0b2e-44fe-aa57-8fbb8a50cb0d",
            "email": "dynalimpios509@gmail.com",
            "passwordHash": "$2b$12$5gcPDCCHa0u7hYBVrGdUvee9XhXNvjV/dwARDYFpuL.71zPV5qSIm",
            "firstName": "dyna",
            "lastName": "limpios",
            "phone": null,
            "roleId": "93122a79-14f5-46a7-8e12-70d63ddf1871",
            "branchId": null,
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": "2025-12-12T02:50:45.874Z",
            "passwordChangedAt": null,
            "createdAt": "2025-12-12T02:47:26.128Z",
            "updatedAt": "2025-12-12T02:47:26.119Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "93122a79-14f5-46a7-8e12-70d63ddf1871",
                "name": "Cashier",
                "description": "Handle POS transactions and customer sales",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:25.062Z",
                "updatedAt": "2025-12-09T21:22:59.261Z"
            },
            "Branch": null
        },
        {
            "id": "441b1d2e-cb9a-44e1-8316-93d4a94112a2",
            "email": "allyssa.maria85@gmail.com",
            "passwordHash": "$2b$12$VUERd7IJM2ixzTENdvQygeiZ36l8aY16Tkq29QDFJ1Ye4yaeCzB1G",
            "firstName": "allyssamaria",
            "lastName": "gubalane",
            "phone": "",
            "roleId": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
            "branchId": null,
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": "2025-12-12T02:48:52.309Z",
            "passwordChangedAt": null,
            "createdAt": "2025-12-12T02:48:43.357Z",
            "updatedAt": "2025-12-12T02:48:43.344Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "0030a4da-e68c-4e78-a6f2-35cd836eff9e",
                "name": "Super Admin",
                "description": "Full system access with all permissions",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:24.527Z",
                "updatedAt": "2025-12-09T21:22:58.154Z"
            },
            "Branch": null
        },
        {
            "id": "989f8d22-9fcd-4075-9222-ea92d9987664",
            "email": "rocelbaclayon@gmail.com",
            "passwordHash": "$2b$12$etWo0Igyrt71AGwL64OkteWXsXn3FQqBzXZ/IMXOpZNFkPOrFcCG6",
            "firstName": "Rocel",
            "lastName": "Baclayon",
            "phone": null,
            "roleId": "93122a79-14f5-46a7-8e12-70d63ddf1871",
            "branchId": null,
            "status": "ACTIVE",
            "emailVerified": true,
            "isSuperMegaAdmin": false,
            "lastLoginAt": "2025-12-12T02:57:20.989Z",
            "passwordChangedAt": null,
            "createdAt": "2025-12-12T02:55:42.457Z",
            "updatedAt": "2025-12-12T02:55:42.454Z",
            "branchLockEnabled": false,
            "Role": {
                "id": "93122a79-14f5-46a7-8e12-70d63ddf1871",
                "name": "Cashier",
                "description": "Handle POS transactions and customer sales",
                "isSystem": true,
                "createdAt": "2025-12-03T01:08:25.062Z",
                "updatedAt": "2025-12-09T21:22:59.261Z"
            },
            "Branch": null
        }
    ];

    for (const userData of usersData) {
        // Find role by name
        const role = await prisma.role.findFirst({
            where: { name: userData.Role.name }
        });

        if (!role) {
            console.error(`Role ${userData.Role.name} not found for user ${userData.email}`);
            continue;
        }

        let branchId = null;
        if (userData.Branch) {
            const branch = await prisma.branch.findFirst({
                where: { code: userData.Branch.code }
            });
            if (branch) {
                branchId = branch.id;
            } else {
                console.warn(`Branch ${userData.Branch.code} not found for user ${userData.email}`);
            }
        }

        await prisma.user.upsert({
            where: { email: userData.email },
            update: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                passwordHash: userData.passwordHash,
                roleId: role.id,
                branchId: branchId,
                status: userData.status,
                emailVerified: userData.emailVerified,
                isSuperMegaAdmin: userData.isSuperMegaAdmin,
                updatedAt: new Date(userData.updatedAt),
                // Preserve lastLoginAt if present
                lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt) : null,
                branchLockEnabled: userData.branchLockEnabled
            },
            create: {
                id: userData.id, // Use the ID from the dump
                email: userData.email,
                passwordHash: userData.passwordHash,
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone,
                roleId: role.id,
                branchId: branchId,
                status: userData.status,
                emailVerified: userData.emailVerified,
                isSuperMegaAdmin: userData.isSuperMegaAdmin,
                createdAt: new Date(userData.createdAt),
                updatedAt: new Date(userData.updatedAt),
                lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt) : null,
                passwordChangedAt: userData.passwordChangedAt ? new Date(userData.passwordChangedAt) : null,
                branchLockEnabled: userData.branchLockEnabled
            },
        });
    }

    console.log(`✅ Seeded ${usersData.length} users from JSON list.`);
}
