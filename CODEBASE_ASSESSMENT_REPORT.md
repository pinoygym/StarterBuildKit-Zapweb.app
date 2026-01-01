### Architectural Overview

The project is a Next.js application using the App Router, with a clear separation of concerns into `services`, `repositories`, and `components`. It utilizes Prisma for database interaction, Tailwind CSS for styling, and has a testing setup with Vitest and Playwright. The structure is generally sound, but there are areas where enforcement of this structure could be stricter.

### Key Findings & Potential Issues

I have identified the following potential issues and areas for concern:

1.  **Inconsistent Currency Handling:**
    *   **File:** `lib/discount-calculator.ts`
    *   **Issue:** The `formatCurrency` function has a hardcoded 'PHP' currency symbol. While you've indicated a preference for PHP, hardcoding it makes the application less flexible. A centralized configuration for currency and locale should be used throughout the application to ensure consistency.

2.  **Complex and Error-Prone Discount Logic:**
    *   **File:** `lib/discount-calculator.ts`
    *   **Issue:** The `applyDiscount` function contains complex conditional logic, especially around the combination of `PERCENTAGE` and `FIXED_AMOUNT` discounts with a `maxDiscount`. This complexity makes it difficult to verify correctness and increases the risk of bugs. For example, the logic for applying a percentage discount that is then capped by a maximum amount could be simplified and clarified.

3.  **Lack of Decimal Precision in Financial Calculations:**
    *   **Files:** `lib/discount-calculator.ts` (and likely others involving financial data)
    *   **Issue:** The application uses standard JavaScript numbers (floats) for financial calculations. This can lead to floating-point precision errors, which is a critical issue in financial and inventory systems. For example, `(0.1 + 0.2)` results in `0.30000000000000004`, not `0.3`.

4.  **Missing Input Validation:**
    *   **File:** `lib/discount-calculator.ts`
    *   **Issue:** The `applyDiscount` function does not validate its inputs (`total`, `discountValue`, `maxDiscount`). If these are `null`, `undefined`, or `NaN`, the function could produce unexpected results or errors, which might propagate through the system.

### Recommendations

Based on this assessment, I recommend the following actions to improve the codebase's robustness and maintainability:

1.  **Refactor Financial Calculations:** Introduce a library like `Decimal.js` for all monetary calculations to avoid floating-point inaccuracies. This should be a high-priority change.

2.  **Centralize Currency Management:** Remove the hardcoded 'PHP' symbol and implement a global context or configuration for currency settings. This will make it easier to manage and update in the future.

3.  **Simplify and Test Discount Logic:** Refactor the `applyDiscount` function to be simpler and less nested. Add comprehensive unit tests with Vitest to cover all discount scenarios (percentage, fixed, with and without max discount, edge cases) to ensure the logic is correct.

4.  **Add Robust Input Validation:** Add validation at the beginning of the `applyDiscount` function (and other critical functions) to ensure all inputs are valid numbers.
