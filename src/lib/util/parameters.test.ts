import { describe, expect, test } from 'vitest';
import { getParameterName } from './parameters';

describe('getParameterName', () => {
  test('formats the parameter name as /bot/{stage}/{key}', () => {
    expect(getParameterName('prod', 'myKey')).toBe('/bot/prod/myKey');
  });

  test('works with arbitrary stage and key values', () => {
    expect(getParameterName('dev', 'reddit/clientId')).toBe('/bot/dev/reddit/clientId');
  });
});
