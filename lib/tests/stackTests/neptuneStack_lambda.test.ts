import {Stack} from 'aws-cdk-lib';
import {Match, Template} from 'aws-cdk-lib/assertions';
import {CustomStackProps} from '../../../bin/config';
import {NEPTUNE_STACK_NAME} from '../../../bin/neptuneStreamMain';
import {NeptuneWithVpcStack} from '../../neptuneStack';
import {getCustomStackPropsTests} from './testHelper';

describe('Stack Lambda tests', () => {
  let stack: NeptuneWithVpcStack;
  let template: Template;
  const testStackProperties: CustomStackProps = getCustomStackPropsTests();
  console.log(` STACK PROPS: ${JSON.stringify(testStackProperties)}`);

  beforeEach(() => {
    stack = new NeptuneWithVpcStack(new Stack(), NEPTUNE_STACK_NAME, testStackProperties);
    template = Template.fromStack(stack);
  });

  it('should have 4 Lambdas', () => {
    template.resourceCountIs('AWS::Lambda::Function', 4);
  });

  it('should have the correct stream handler lambda', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.streamHandler',
      Runtime: 'nodejs18.x',
      MemorySize: 256,
      Layers: [Match.anyValue()], // TODO: check the correct lambda layer
    });
  });
});
