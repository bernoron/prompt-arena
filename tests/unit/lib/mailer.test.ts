// @spec AC-01-015
import { describe, it, expect, afterEach, vi } from 'vitest';
import { getMailTransport, createResendTransport, sendPasswordResetEmail } from '../../../lib/mailer';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getMailTransport', () => {
  it('falls back to the log transport when RESEND_API_KEY is unset', () => {
    vi.stubEnv('RESEND_API_KEY', '');
    expect(getMailTransport().name).toBe('log');
  });

  it('selects the resend transport when RESEND_API_KEY is set', () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    expect(getMailTransport().name).toBe('resend');
  });
});

describe('createResendTransport', () => {
  it('POSTs to the Resend API with bearer auth and the message payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'abc' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('MAIL_FROM', 'PromptArena <no-reply@example.com>');

    await createResendTransport('re_secret').send({
      to: 'user@example.com',
      subject: 'Hallo',
      text: 'Inhalt',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(opts.method).toBe('POST');
    expect(opts.headers.Authorization).toBe('Bearer re_secret');
    const body = JSON.parse(opts.body);
    expect(body).toMatchObject({
      from: 'PromptArena <no-reply@example.com>',
      to: ['user@example.com'],
      subject: 'Hallo',
      text: 'Inhalt',
    });
  });

  it('throws when the Resend API responds with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 422 })));
    await expect(
      createResendTransport('re_secret').send({ to: 'x@y.z', subject: 's', text: 't' }),
    ).rejects.toThrow(/Resend API error 422/);
  });
});

describe('sendPasswordResetEmail', () => {
  it('sends a German reset mail containing the reset URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_secret');

    const url = 'https://arena.example/reset-password?token=deadbeef';
    await sendPasswordResetEmail('user@example.com', url);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual(['user@example.com']);
    expect(body.subject).toContain('Passwort zurücksetzen');
    expect(body.text).toContain(url);
  });
});
