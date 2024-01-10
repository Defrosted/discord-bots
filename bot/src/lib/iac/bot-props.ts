import { StackProps } from 'aws-cdk-lib';

export interface BotProps extends StackProps {
  stage: string;
}
