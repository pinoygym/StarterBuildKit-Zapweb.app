// Test the branch restriction logic
const RESTRICTED_ROLES = ['Cashier', 'cashier', 'CASHIER'];

// Test cases
const testCases = [
  { roleName: 'Cashier', expected: false },
  { roleName: 'cashier', expected: false },
  { roleName: 'CASHIER', expected: false },
  { roleName: 'Super Admin', expected: true },
  { roleName: 'Branch Manager', expected: true },
  { roleName: null, expected: true },
  { roleName: undefined, expected: true },
];

testCases.forEach(({ roleName, expected }) => {
  const canChangeBranch = roleName
    ? !RESTRICTED_ROLES.includes(roleName)
    : true;

  const status = canChangeBranch === expected ? '✓' : '✗';
  console.log(`${status} Role: "${roleName}" => canChangeBranch: ${canChangeBranch} (expected: ${expected})`);
});
