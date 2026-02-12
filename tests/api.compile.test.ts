import { describe, it, expect } from 'vitest';
import { POST } from '../app/api/compile/route';
import { NextRequest } from 'next/server';

describe('API: /api/compile', () => {
  it('should return 200 and a valid proposal for valid input', async () => {
    const message = 'Test message';
    const request = new NextRequest('http://localhost/api/compile', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.proposal_id).toContain('prop_');
    expect(data.input.message).toBe(message);
    expect(data.proposal.title).toBeDefined();
  });

  it('should return 400 for empty message', async () => {
    const request = new NextRequest('http://localhost/api/compile', {
      method: 'POST',
      body: JSON.stringify({ message: '' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should return 400 for missing message field', async () => {
    const request = new NextRequest('http://localhost/api/compile', {
      method: 'POST',
      body: JSON.stringify({ something: 'else' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
