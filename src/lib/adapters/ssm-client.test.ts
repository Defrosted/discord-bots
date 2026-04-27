import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SSMClient } from '@aws-sdk/client-ssm';
import { makeSsmClient } from './ssm-client';

const mockSend = vi.fn();
vi.spyOn(SSMClient.prototype, 'send').mockImplementation(mockSend);

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

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ input: { Name: '/bot/prod/myKey' } }),
    );
  });
});
