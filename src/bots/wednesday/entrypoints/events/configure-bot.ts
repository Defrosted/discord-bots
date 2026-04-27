import { configureBotInvocationSchema } from '@lib/schemas/events/wednesday-bot';
import logger from '@lib/util/logger';
import { makeRecordValidator } from '@lib/util/record-validator';
import * as R from 'ramda';
import { getConfig } from '../../config';
import { injectConfigureBotUsecase } from '../../di';
import { ConfigureBotUsecase } from '../../orchestration/configure-bot';

interface Deps {
  configureBot: ConfigureBotUsecase;
}

const validateEvent = (event: unknown) =>
  makeRecordValidator(configureBotInvocationSchema)(event);

export const makeHandler = (deps: Deps) => async (event: unknown) => {
  try {
    return await R.pipe(validateEvent, deps.configureBot)(event);
  } catch (error) {
    logger.error('Failed to configure bot', { error });
  }
};

export const handler = makeHandler({
  configureBot: injectConfigureBotUsecase(getConfig()),
});
