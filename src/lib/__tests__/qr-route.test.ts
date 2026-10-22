import { beforeEach, describe, expect, it, vi } from 'vitest';

const { firstRow, toString } = vi.hoisted(() => ({
  firstRow: vi.fn(),
  toString: vi.fn().mockResolvedValue('<svg/>'),
}));
vi.mock('../db-query', () => ({ firstRow }));
vi.mock('qrcode', () => ({ default: { toString } }));
vi.mock('../db', () => ({
  db: { select: () => ({ from: () => ({ where: () => ({ limit: () => null }) }) }) },
}));
import { GET } from '../../pages/api/qr/[slug]';

function request(url: string) {
  return GET({ params: { slug: 'moon-bowl-cafe' }, request: new Request(url) } as any);
}

describe('QR destination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firstRow.mockResolvedValue({ slug: 'moon-bowl-cafe' });
  });

  it('uses the actual demo origin for shop sharing', async () => {
    const response = await request('https://demo.example/api/qr/moon-bowl-cafe');
    expect(response.status).toBe(200);
    expect(toString).toHaveBeenCalledWith('https://demo.example/moon-bowl-cafe', expect.any(Object));
  });

  it('uses the canonical, encoded deal route and ignores forwarded origin headers', async () => {
    const response = await GET({
      params: { slug: 'moon-bowl-cafe' },
      request: new Request('http://localhost:4321/api/qr/moon-bowl-cafe?deal=a%2Fb%3Fc&size=99999', {
        headers: { 'x-forwarded-host': 'untrusted.example' },
      }),
    } as any);
    expect(response.status).toBe(200);
    expect(toString).toHaveBeenCalledWith('http://localhost:4321/deal/a%2Fb%3Fc', expect.objectContaining({ width: 1200 }));
  });

  it('does not generate a QR for an unknown shop', async () => {
    firstRow.mockResolvedValue(null);
    expect((await request('https://demo.example/api/qr/missing')).status).toBe(404);
    expect(toString).not.toHaveBeenCalled();
  });
});
