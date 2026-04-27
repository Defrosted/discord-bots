import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockSend = vi.hoisted(() => vi.fn());

vi.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: vi.fn(() => ({ send: mockSend })),
  GetParameterCommand: vi.fn((input) => input),
}));

import { GetParameterCommand } from '@aws-sdk/client-ssm';
import { makeSsmClient } from './ssm-client';

describe('makeSsmClient', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  test('getParameterValue returns Parameter.Value from SSM response', async () => {
    mockSend.mockResolvedValue({ Parameter: { Value: 'secret-value' } });
    const client = makeSsmClient({ region: 'eu-west-1' });

    const result = await client.getParameterValue('/bot/prod/myKey');

    expect(result).toBe('secret-value');
  });

  test('getParameterValue returns undefined when Parameter is absent', async () => {
    mockSend.mockResolvedValue({});
    const client = makeSsmClient({ region: 'eu-west-1' });

    const result = await client.getParameterValue('/bot/prod/myKey');

    expect(result).toBeUndefined();
  });

  test('passes the Name argument to GetParameterCommand', async () => {
    mockSend.mockResolvedValue({ Parameter: { Value: 'x' } });
    const client = makeSsmClient({ region: 'eu-west-1' });

    await client.getParameterValue('/bot/prod/myKey');

    expect(GetParameterCommand).toHaveBeenCalledWith({ Name: '/bot/prod/myKey' });
  });
});
