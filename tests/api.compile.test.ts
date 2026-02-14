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
  it('should normalize message (trim and newlines) and generate stable ID', async () => {
    const rawMessage = "\n  Fix bug\r\nUpdate UI  \n";
    const normalizedMessage = "Fix bug\nUpdate UI";
    
    const request1 = new NextRequest('http://localhost/api/compile', {
      method: 'POST',
      body: JSON.stringify({ message: rawMessage }),
    });

    const request2 = new NextRequest('http://localhost/api/compile', {
      method: 'POST',
      body: JSON.stringify({ message: normalizedMessage }),
    });

    const response1 = await POST(request1);
    const data1 = await response1.json();

    const response2 = await POST(request2);
    const data2 = await response2.json();

    expect(data1.proposal_id).toBe(data2.proposal_id);
    expect(data1.input.message).toBe(normalizedMessage);
    expect(data1.proposal.title).not.toContain('\n');
    expect(data1.proposal.title).not.toContain('\r');
  });
});
