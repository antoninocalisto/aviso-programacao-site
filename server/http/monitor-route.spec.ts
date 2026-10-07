import { describe, it, expect, vi } from 'vitest';
import handler, { authorized } from '../../api/monitor.js';
import type { ApiRequest, ApiResponse } from './contracts.js';
describe('cron access', () => {
  it('fails closed without a secret and validates exact bearer header', () => {
    expect(authorized(undefined, undefined)).toBe(false);
    expect(authorized('Bearer test', 'test')).toBe(true);
    expect(authorized('Bearer wrong', 'test')).toBe(false);
    expect(authorized(['Bearer test'], 'test')).toBe(false);
  });
  it('rejects unauthorized callers at HTTP boundary', async () => {
    const res = { setHeader: vi.fn(), status: vi.fn(), json: vi.fn() }; res.status.mockReturnValue(res);
    await handler({ method: 'GET', headers: {} } as ApiRequest, res as unknown as ApiResponse);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
