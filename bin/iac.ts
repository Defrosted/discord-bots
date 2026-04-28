import { App, Tags } from 'aws-cdk-lib';
import { makeRecordValidator } from '@lib/util/record-validator';
import {
  wednesdayPropsSchema,
  WednesdayStack,
} from '../src/bots/wednesday/iac/wednesday-stack';
import {
  nyanPropsSchema,
  NyanStack,
} from '../src/bots/nyan/iac/nyan-stack';

const wednesdayProps = makeRecordValidator(wednesdayPropsSchema)({
  stage: process.env.STAGE,
});
const nyanProps = makeRecordValidator(nyanPropsSchema)({
  stage: process.env.STAGE,
});

const app = new App();
new WednesdayStack(app, `wednesday-bot-${wednesdayProps.stage}`, wednesdayProps);
new NyanStack(app, `nyan-bot-${nyanProps.stage}`, nyanProps);

Tags.of(app).add('app', 'bots');
Tags.of(app).add('stage', wednesdayProps.stage);
