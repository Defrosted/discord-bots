import { App, Tags } from "aws-cdk-lib";
import { makeRecordValidator } from "../bot/src/lib/util/record-validator";
import { wednesdayPropsSchema, WednesdayStack } from "../bot/src/wednesday/iac/wednesday-stack";

const props = makeRecordValidator(wednesdayPropsSchema)({
  stage: process.env.STAGE
})

const app = new App();
new WednesdayStack(app, `wednesday-bot-${props.stage}`, props)

Tags.of(app).add('app', 'bots')
Tags.of(app).add('stage', props.stage);
