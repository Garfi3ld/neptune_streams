import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as cdk from 'aws-cdk-lib';
import {LambdaInvoke} from 'aws-cdk-lib/aws-stepfunctions-tasks';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import {LAMBDA_TIMEOUT_SECONDS} from './lambdaHelper';

export const CONTINUE = 'CONTINUE';
export const COMPLETED = 'COMPLETED';
const WAIT_STATE_SECONDS = 10;

export const setupStepFunction = (stack: cdk.Stack, streamHandler: NodejsFunction) => {
  // Create a loop in the Step Function

  // Define the Lambda Task in the Step Function
  const lambdaTask: LambdaInvoke = new tasks.LambdaInvoke(stack, 'InvokeStreamHandler', {
    lambdaFunction: streamHandler,
    outputPath: '$.Payload',
    taskTimeout: sfn.Timeout.duration(cdk.Duration.seconds(LAMBDA_TIMEOUT_SECONDS)),
  });

  // Create a Choice state to decide whether to continue or stop based on the Lambda output
  const choice = new sfn.Choice(stack, 'ContinueOrStop');
  const continueCondition = sfn.Condition.stringEquals('$.status', CONTINUE);
  const succeedState = new sfn.Succeed(stack, 'SucceedState'); //never used as I want to loop it continiously
  const waitState = new sfn.Wait(stack, 'WaitState', {
    time: sfn.WaitTime.duration(cdk.Duration.seconds(WAIT_STATE_SECONDS)),
  });

  choice.when(continueCondition, lambdaTask).otherwise(succeedState);

  // Connect the Lambda Task to the Choice state
  lambdaTask.next(waitState);
  waitState.next(choice);

  // Create the Step Function
  new sfn.StateMachine(stack, 'StreamHandlerStateMachine', {
    definition: lambdaTask,
    timeout: cdk.Duration.days(364), // This is the max timeout 
  });
};
