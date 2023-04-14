import {Stack} from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {CustomStackProps} from '../../../bin/config';
import {NeptuneWithVpcStack} from '../../neptuneStack';
import {NEPTUNE_STACK_NAME} from '../../../bin/neptuneStreamMain';
import {getCustomStackPropsTests} from './testHelper';

describe('Stack DynamoDb tests', () => {
  let stack: NeptuneWithVpcStack;
  let template: Template;

  const testStackProperties: CustomStackProps = getCustomStackPropsTests();

  beforeEach(() => {
    stack = new NeptuneWithVpcStack(new Stack(), NEPTUNE_STACK_NAME, testStackProperties);
    template = Template.fromStack(stack);
  });

  const tableConfigs = [
    {name: testStackProperties.config.UPDATES_SUMMARY_TABLE, readCapacity: 1, writeCapacity: 1},
    {name: testStackProperties.config.LATEST_PROCESSED_RECORD_TABLE, readCapacity: 1, writeCapacity: 1},
    {name: testStackProperties.config.NEPTUNE_UPDATES_TABLE, readCapacity: 1, writeCapacity: 15},
  ];

  tableConfigs.forEach(({name, readCapacity, writeCapacity}) => {
    it(`should create the ${name} table with proper properties`, () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: name,
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: readCapacity,
          WriteCapacityUnits: writeCapacity,
        },
        Tags: [
          {Key: 'CreatedBy', Value: 'CDK'},
          {Key: 'Owner', Value: 'CDK'},
          {Key: 'Purpose', Value: 'Neptune Cluster Stream demo'},
        ],
      });
    });
  });
});
