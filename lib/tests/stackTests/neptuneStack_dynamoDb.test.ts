import {Stack} from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {CustomStackProps} from '../../../bin/config';
import {NeptuneWithVpcStack} from '../../neptuneStack';
import {NEPTUNE_STACK_NAME} from '../../../bin/neptuneStreamMain';
import { getCustomStackPropsTests } from './testHelper';

describe('Stack DynamoDb tests', () => {
  let stack: NeptuneWithVpcStack;
  let template: Template;


  const testStackProperties: CustomStackProps = getCustomStackPropsTests();
  console.log(` STACK PROPS: ${JSON.stringify(testStackProperties)}`);

  beforeEach(() => {
    stack = new NeptuneWithVpcStack(new Stack(), NEPTUNE_STACK_NAME, testStackProperties);
    template = Template.fromStack(stack);
  });

  it('should create the necessary tables', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: testStackProperties.config.UPDATES_SUMMARY_TABLE,
    });

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: testStackProperties.config.LATEST_PROCESSED_RECORD_TABLE,
    });

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: testStackProperties.config.NEPTUNE_UPDATES_TABLE,
    });
  });
});
