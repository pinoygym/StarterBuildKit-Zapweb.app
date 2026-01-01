import { vi, Mocked } from 'vitest';

// Mock jsonwebtoken module
vi.mock('jsonwebtoken');

describe('JWT Mocking Test', () => {
  it('should work with vi.spyOn', () => {
    const jwt = require('jsonwebtoken');
    const verifyMock = vi.spyOn(jwt, 'verify').mockReturnValue({
      userId: '123',
      email: 'test@example.com',
    });

    const result = jwt.verify('token', 'secret');

    expect(result.userId).toBe('123');
    expect(verifyMock).toHaveBeenCalled();

    verifyMock.mockRestore();
  });

  it('should work with vi.mocked', () => {
    const jwt = require('jsonwebtoken');
    const mockVerify = vi.fn().mockReturnValue({
      userId: '456',
      email: 'test2@example.com',
    });
    jwt.verify = mockVerify;

    const result = jwt.verify('token', 'secret');

    expect(result.userId).toBe('456');
  });
});
