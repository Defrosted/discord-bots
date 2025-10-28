import {
  SendWednesdayMemeInvocation,
  sendWednesdayMemeInvocationSchema,
} from '@lib/schemas/events/wednesday-bot';
import logger from '@lib/util/logger';
import { makeRecordValidator } from '@lib/util/record-validator';
import * as R from 'ramda';
import { getConfig } from '../../config';
import { injectSendWednesdayMemeUsecase } from '../../di';
import {
  SendWednesdayMemeUsecase,
  SendWednesdayMemeUsecaseParams,
} from '../../usecases/send-wednesday-meme';

interface Deps {
  sendWednesdayMeme: SendWednesdayMemeUsecase;
}

const validateEvent = (event: unknown) =>
  makeRecordValidator(sendWednesdayMemeInvocationSchema)(event);

const toParams = (
  input: SendWednesdayMemeInvocation,
): SendWednesdayMemeUsecaseParams =>
  Object.keys(input).length > 0
    ? (input as SendWednesdayMemeUsecaseParams)
    : undefined;

export const makeHandler = (deps: Deps) => async (event: unknown) => {
  try {
    return await R.pipe(validateEvent, toParams, deps.sendWednesdayMeme)(event);
  } catch (error) {
    logger.error('Failed to send wednesday meme', { error });
  }
};

export const handler = makeHandler({
  sendWednesdayMeme: injectSendWednesdayMemeUsecase(getConfig()),
});
