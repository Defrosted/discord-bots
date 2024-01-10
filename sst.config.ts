import { SSTConfig } from 'sst';
import { WednesdayStack } from './bot/src/wednesday/iac/wednesday-stack';

export default {
  config() {
    return {
      name: 'bots',
      region: process.env.AWS_REGION,
      stage: process.env.STAGE,
    };
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      runtime: 'nodejs20.x',
      architecture: 'arm_64',
    });

    app.stack(WednesdayStack);
  },
} satisfies SSTConfig;
