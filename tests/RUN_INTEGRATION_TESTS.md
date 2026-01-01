# Quick Test Script

Run integration tests with the test database to verify isolation improvements.

## Usage

```powershell
# Set test database URL and run integration tests
$env:DATABASE_URL = "postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-spring-pond-a1stve3k-pooler.ap-southeast-1.aws.neon.tech/neondb_test?sslmode=require&channel_binding=require"
$env:NODE_ENV = "test"
bun run test:integration
```

This will:
1. Use the test database (neondb_test)
2. Reset database before each test suite (customers, POS, purchase orders)
3. Run all integration tests
4. Show improved pass rate

## Expected Results

- Better test isolation (no state pollution)
- Higher pass rate (target: 70-80%)
- Repeatable test results
