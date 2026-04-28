import { sendCatPhotoInvocationSchema } from '@lib/schemas/events/nyan-bot';
import logger from '@lib/util/logger';
import { makeRecordValidator } from '@lib/util/record-validator';
import * as R from 'ramda';
import { getConfig } from '../../config';
import { injectSendCatPhotoUsecase } from '../../di';
import { SendCatPhotoUsecase } from '../../usecases/send-cat-photo';

interface Deps {
  sendCatPhoto: SendCatPhotoUsecase;
}

const validateEvent = (event: unknown) =>
  makeRecordValidator(sendCatPhotoInvocationSchema)(event);

export const makeHandler = (deps: Deps) => async (event: unknown) => {
  try {
    return await R.pipe(validateEvent, deps.sendCatPhoto)(event);
  } catch (error) {
    logger.error('Failed to send cat photo', { error });
  }
};

export const handler = makeHandler({
  sendCatPhoto: injectSendCatPhotoUsecase(getConfig()),
});
