import {Stack} from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {CustomStackProps} from '../../../bin/config';
import {NeptuneWithVpcStack} from '../../neptuneStack';

describe('Stack DynamoDb tests', () => {
  let stack: NeptuneWithVpcStack;
  let template: Template;
  const REGION = 'us-west-2';
  const VPC_NAME = 'NeptuneVPC';
  const NEPTUNE_WITH_VPC_STACK = 'NeptuneWithVpcStack';
  const stackProps: CustomStackProps = {
    env: {region: REGION},
    config: {
      VPC_NAME: VPC_NAME,
      CIDR: '10.0.0.0/16',
      AZS: 2,
      NAT_GATEWAYS: 2,
      GRAPH_DB_CLUSTER_NAME: 'TestNeptuneCluster',
      NEPTUNE_UPDATES_TABLE: 'Test_neptune_updates_table',
      LATEST_PROCESSED_RECORD_TABLE: 'Test_latest_update_table',
      UPDATES_SUMMARY_TABLE: 'Test_updates_summary_table',
      SECURITY_GROUP_NAME: 'securityGroupName',
      ROLE_ARN: 'roleARN',
      STREAM_PARTITION_KEY: 'streamPartitionKey',
    },
  };

  beforeEach(() => {
    stack = new NeptuneWithVpcStack(new Stack(), NEPTUNE_WITH_VPC_STACK, stackProps);
    template = Template.fromStack(stack);
  });

  it('should create the necessary tables', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: stackProps.config.UPDATES_SUMMARY_TABLE,
    });

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: stackProps.config.LATEST_PROCESSED_RECORD_TABLE,
    });

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: stackProps.config.NEPTUNE_UPDATES_TABLE,
    });
  });
});
