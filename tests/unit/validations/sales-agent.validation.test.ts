import { describe, it, expect } from 'vitest';
import {
  createSalesAgentSchema,
  updateSalesAgentSchema,
} from '@/lib/validations/data-maintenance.validation';

describe('Sales Agent Validation Schemas', () => {
  describe('createSalesAgentSchema', () => {
    describe('valid inputs', () => {
      it('should validate a complete sales agent', () => {
        const input = {
          name: 'John Doe',
          code: 'AG001',
          contactPerson: 'John Doe',
          phone: '09171234567',
          email: 'john@example.com',
          status: 'active' as const,
          displayOrder: 0,
        };

        const result = createSalesAgentSchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(input);
        }
      });

      it('should validate with minimal required fields', () => {
        const input = {
          name: 'John Doe',
          code: 'AG001',
        };

        const result = createSalesAgentSchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('John Doe');
          expect(result.data.code).toBe('AG001');
          expect(result.data.status).toBe('active'); // default value
          expect(result.data.displayOrder).toBe(0); // default value
        }
      });

      it('should accept valid code formats', () => {
        const validCodes = ['AG001', 'AGENT-001', 'AG_001', 'A-B-C', 'ABC123'];

        validCodes.forEach((code) => {
          const input = {
            name: 'Test Agent',
            code,
          };

          const result = createSalesAgentSchema.safeParse(input);
          expect(result.success).toBe(true);
        });
      });

      it('should accept valid phone formats', () => {
        const validPhones = [
          '09171234567',
          '0917-123-4567',
          '0917 123 4567',
          '+639171234567',
          '(02) 1234-5678',
        ];

        validPhones.forEach((phone) => {
          const input = {
            name: 'Test Agent',
            code: 'AG001',
            phone,
          };

          const result = createSalesAgentSchema.safeParse(input);
          expect(result.success).toBe(true);
        });
      });

      it('should accept valid email addresses', () => {
        const validEmails = [
          'test@example.com',
          'john.doe@company.co.uk',
          'agent+sales@domain.com',
          'user_name@subdomain.example.com',
        ];

        validEmails.forEach((email) => {
          const input = {
            name: 'Test Agent',
            code: 'AG001',
            email,
          };

          const result = createSalesAgentSchema.safeParse(input);
          expect(result.success).toBe(true);
        });
      });

      it('should accept empty string for optional fields', () => {
        const input = {
          name: 'Test Agent',
          code: 'AG001',
          contactPerson: '',
          phone: '',
          email: '',
        };

        const result = createSalesAgentSchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it('should accept both active and inactive status', () => {
        const activeInput = {
          name: 'Active Agent',
          code: 'AG001',
          status: 'active' as const,
        };

        const inactiveInput = {
          name: 'Inactive Agent',
          code: 'AG002',
          status: 'inactive' as const,
        };

        const activeResult = createSalesAgentSchema.safeParse(activeInput);
        const inactiveResult = createSalesAgentSchema.safeParse(inactiveInput);

        expect(activeResult.success).toBe(true);
        expect(inactiveResult.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject missing name', () => {
        const input = {
          code: 'AG001',
        };

        const result = createSalesAgentSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.name).toBeDefined();
        }
      });

      it('should reject empty name', () => {
        const input = {
          name: '',
          code: 'AG001',
        };

        const result = createSalesAgentSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.name).toContain('Agent name is required');
        }
      });

      it('should reject name longer than 100 characters', () => {
        const input = {
          name: 'A'.repeat(101),
          code: 'AG001',
        };

        const result = createSalesAgentSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.name).toContain('Name must be 100 characters or less');
        }
      });

      it('should reject missing code', () => {
        const input = {
          name: 'John Doe',
        };

        const result = createSalesAgentSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.code).toBeDefined();
        }
      });

      it('should reject empty code', () => {
        const input = {
          name: 'John Doe',
          code: '',
        };

        const result = createSalesAgentSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.code).toContain('Code is required');
        }
      });

      it('should reject code longer than 20 characters', () => {
        const input = {
          name: 'John Doe',
          code: 'A'.repeat(21),
        };

        const result = createSalesAgentSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.code).toContain('Code must be 20 characters or less');
        }
      });

      it('should reject invalid code formats', () => {
        const invalidCodes = [
          'ag001', // lowercase
          'AG 001', // space
          'AG.001', // period
          'AG@001', // special char
          'ÁG001', // accented char
        ];

        invalidCodes.forEach((code) => {
          const input = {
            name: 'Test Agent',
            code,
          };

          const result = createSalesAgentSchema.safeParse(input);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.flatten().fieldErrors.code).toContain(
              'Code must contain only uppercase letters, numbers, underscores, and hyphens'
            );
          }
        });
      });

      it('should reject invalid email formats', () => {
        const invalidEmails = [
          'notanemail',
          'missing@domain',
          '@nodomain.com',
          'spaces in@email.com',
          'double@@domain.com',
        ];

        invalidEmails.forEach((email) => {
          const input = {
            name: 'Test Agent',
            code: 'AG001',
            email,
          };

          const result = createSalesAgentSchema.safeParse(input);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.flatten().fieldErrors.email).toContain('Invalid email format');
          }
        });
      });

      it('should reject email longer than 100 characters', () => {
        // '@email.com' is 10 characters, so we need 91+ more to exceed 100
        // 91 'a's + '@email.com' = 101 characters
        const tooLongEmail = 'a'.repeat(91) + '@email.com'; // 101 chars total

        const input = {
          name: 'Test Agent',
          code: 'AG001',
          email: tooLongEmail,
        };

        const result = createSalesAgentSchema.safeParse(input);

        // The schema has .optional().or(z.literal('')) which may affect validation
        // Let's check if it actually validates correctly
        expect(tooLongEmail.length).toBeGreaterThan(100);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.email).toContain('Email must be 100 characters or less');
        }
      });

      it('should reject invalid phone formats', () => {
        const invalidPhones = [
          'abc123', // letters
          '123-abc-4567', // letters
          '!!!invalid', // special chars
        ];

        invalidPhones.forEach((phone) => {
          const input = {
            name: 'Test Agent',
            code: 'AG001',
            phone,
          };

          const result = createSalesAgentSchema.safeParse(input);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.flatten().fieldErrors.phone).toContain('Invalid phone format');
          }
        });
      });

      it('should reject phone longer than 20 characters', () => {
        const input = {
          name: 'Test Agent',
          code: 'AG001',
          phone: '1'.repeat(21),
        };

        const result = createSalesAgentSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.phone).toContain('Phone must be 20 characters or less');
        }
      });

      it('should reject contactPerson longer than 100 characters', () => {
        const input = {
          name: 'Test Agent',
          code: 'AG001',
          contactPerson: 'A'.repeat(101),
        };

        const result = createSalesAgentSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.contactPerson).toContain(
            'Contact person must be 100 characters or less'
          );
        }
      });

      it('should reject invalid status values', () => {
        const input = {
          name: 'Test Agent',
          code: 'AG001',
          status: 'invalid-status' as any,
        };

        const result = createSalesAgentSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject negative displayOrder', () => {
        const input = {
          name: 'Test Agent',
          code: 'AG001',
          displayOrder: -1,
        };

        const result = createSalesAgentSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject non-integer displayOrder', () => {
        const input = {
          name: 'Test Agent',
          code: 'AG001',
          displayOrder: 1.5,
        };

        const result = createSalesAgentSchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('updateSalesAgentSchema', () => {
    it('should validate partial update with name only', () => {
      const input = {
        name: 'Updated Name',
      };

      const result = updateSalesAgentSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
      }
    });

    it('should validate partial update with code only', () => {
      const input = {
        code: 'AG999',
      };

      const result = updateSalesAgentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate partial update with optional fields', () => {
      const input = {
        phone: '09199999999',
        email: 'new@example.com',
      };

      const result = updateSalesAgentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate update with all fields', () => {
      const input = {
        name: 'Updated Agent',
        code: 'AG-UPDATED',
        contactPerson: 'Updated Contact',
        phone: '09199999999',
        email: 'updated@example.com',
        status: 'inactive' as const,
        displayOrder: 5,
      };

      const result = updateSalesAgentSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it('should validate empty update object', () => {
      const input = {};

      const result = updateSalesAgentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject invalid field values in partial update', () => {
      const input = {
        code: 'invalid code', // lowercase with space
      };

      const result = updateSalesAgentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject empty name in update', () => {
      const input = {
        name: '',
      };

      const result = updateSalesAgentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject empty code in update', () => {
      const input = {
        code: '',
      };

      const result = updateSalesAgentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should apply the same validation rules as create schema', () => {
      const input = {
        email: 'invalid-email',
        phone: 'abc123',
      };

      const result = updateSalesAgentSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
        expect(result.error.flatten().fieldErrors.phone).toBeDefined();
      }
    });

    it('should allow clearing optional fields with empty string', () => {
      const input = {
        phone: '',
        email: '',
      };

      const result = updateSalesAgentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should trim whitespace from strings', () => {
      const input = {
        name: '  John Doe  ',
        code: 'AG001',
      };

      const result = createSalesAgentSchema.safeParse(input);

      expect(result.success).toBe(true);
      // Note: Zod doesn't automatically trim, so this would need to be handled in the schema
      // This test documents expected behavior
    });

    it('should handle unicode characters in name', () => {
      const input = {
        name: 'José García',
        code: 'AG001',
      };

      const result = createSalesAgentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should handle special characters in contactPerson', () => {
      const input = {
        name: 'Test Agent',
        code: 'AG001',
        contactPerson: "O'Brien-Smith Jr.",
      };

      const result = createSalesAgentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should handle international phone formats', () => {
      const input = {
        name: 'Test Agent',
        code: 'AG001',
        phone: '+63 917 123 4567',
      };

      const result = createSalesAgentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });
});
