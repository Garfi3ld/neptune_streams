import {Stack} from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {CustomStackProps} from '../../../bin/config';
import {NEPTUNE_STACK_NAME} from '../../../bin/neptuneStreamMain';
import {NeptuneWithVpcStack, EMPTY_PROPS_ERROR} from '../../neptuneStack';
import {getCustomStackPropsTests} from './testHelper';

describe('Stack tests', () => {
  let stack: NeptuneWithVpcStack;
  let template: Template;
  const testStackProperties: CustomStackProps = getCustomStackPropsTests();

  beforeEach(() => {
    stack = new NeptuneWithVpcStack(new Stack(), NEPTUNE_STACK_NAME, testStackProperties);
    template = Template.fromStack(stack);
  });

  it('should throw an error when props are empty', () => {
    expect(() => {
      new NeptuneWithVpcStack(new Stack(), NEPTUNE_STACK_NAME);
    }).toThrowError(EMPTY_PROPS_ERROR);
  });

  it('should have the correct VPC', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      Tags: [
        {Key: 'CreatedBy', Value: 'CDK'},
        {Key: 'Name', Value: `Default/${NEPTUNE_STACK_NAME}/${testStackProperties.config.VPC_NAME}`},
        {Key: 'Owner', Value: 'CDK'},
        {Key: 'Purpose', Value: 'Neptune Cluster Stream demo'},
      ],
    });
  });

  it('should have the correct Cluster', () => {
    template.hasResourceProperties('AWS::Neptune::DBCluster', {
      DBClusterIdentifier: 'TestNeptuneCluster',
    });
  });
});
