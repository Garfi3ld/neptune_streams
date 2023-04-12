import {ParameterGroup} from '@aws-cdk/aws-neptune-alpha';
import * as neptune from '@aws-cdk/aws-neptune-alpha';
import * as cdk from 'aws-cdk-lib';
import {GatewayVpcEndpoint, Vpc} from 'aws-cdk-lib/aws-ec2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import {Table} from 'aws-cdk-lib/aws-dynamodb';
import {RemovalPolicy} from 'aws-cdk-lib';

const COMMIT_NUMBER = 'commitNum';
const UPDATES_TABLE_PARTITION_KEY ='timestamp';
const UPDATES_TABLE_SORT_KEY ='operationSequence';
const UPDATES_SUMMARY_TABLE_SORT_KEY = 'lastTrxTimestamp';
const LATEST_PROCESSED_RECORD_PARTITION_KEY = 'id';
const NEPTUNE_QUERY_TIMEOUT = '120000';

export interface DynamoDbKey {
  name: string;
  type: dynamodb.AttributeType;
}

export const createDbParams = (stack: cdk.Stack): ParameterGroup => {
  return new neptune.ParameterGroup(stack, 'DbParams', {
    description: 'Db parameter group',
    family: neptune.ParameterGroupFamily.NEPTUNE_1_2, //https://github.com/aws/aws-cdk/issues/22998
    parameters: {
      neptune_query_timeout: NEPTUNE_QUERY_TIMEOUT,
    },
  });
};

export const createDynamoDbEndpoint = (stack: cdk.Stack, vpc: Vpc): GatewayVpcEndpoint => {
  const dynamoDbEndpoint: GatewayVpcEndpoint = vpc.addGatewayEndpoint('DynamoDbEndpoint', {
    service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
  });

  //TODO: check permissions, not sure if all of them are needed
  dynamoDbEndpoint.addToPolicy(
    new iam.PolicyStatement({
      principals: [new iam.AnyPrincipal()],
      actions: [
        'dynamodb:BatchGetItem',
        'dynamodb:BatchWriteItem',
        'dynamodb:ConditionCheckItem',
        'dynamodb:DescribeTable',
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:Query',
        'dynamodb:Scan',
      ],
      effect: iam.Effect.ALLOW,
      resources: ['*'],
    }),
  );

  return dynamoDbEndpoint;
};

export const createDynamoDbTable = (
  stack: cdk.Stack,
  stackEventName: string,
  tableName: string,
  _partitionKey: DynamoDbKey,
  _readCapacity: number,
  _writeCapacity: number,
  sortKey?: DynamoDbKey,
): Table => {
  const tableProps: dynamodb.TableProps = {
    tableName: tableName,
    billingMode: dynamodb.BillingMode.PROVISIONED,
    readCapacity: _readCapacity,
    writeCapacity: _writeCapacity,
    removalPolicy: RemovalPolicy.DESTROY, // make RemovalPolicy.SNAPSHOT for prod
    partitionKey: _partitionKey,
    pointInTimeRecovery: true,
  };

  if (sortKey) {
    const createdTable: Table = new dynamodb.Table(stack, stackEventName, {
      ...tableProps,
      sortKey: sortKey,
    });
    return createdTable;
  }

  const createdTable: Table = new dynamodb.Table(stack, stackEventName, tableProps);
  return createdTable;
};

export const createNeptuneUpdatesPartionKey = (): DynamoDbKey => {
  const neptuneUpdatesTablePartitionKey: DynamoDbKey = {
    name: UPDATES_TABLE_PARTITION_KEY,
    type: dynamodb.AttributeType.NUMBER,
  } as DynamoDbKey;
  return neptuneUpdatesTablePartitionKey;
};

export const createNeptuneUpdatesSortKey = (): DynamoDbKey => {
  const neptuneUpdatesTableSortKey: DynamoDbKey = {
    name: UPDATES_TABLE_SORT_KEY,
    type: dynamodb.AttributeType.NUMBER,
  } as DynamoDbKey;
  return neptuneUpdatesTableSortKey;
};

export const createUpdatesSummaryPartitionKey = (): DynamoDbKey => {
  const updatesSummaryTablePartitionKey: DynamoDbKey = {
    name: COMMIT_NUMBER,
    type: dynamodb.AttributeType.NUMBER,
  };
  return updatesSummaryTablePartitionKey;
};

export const createUpdatesSummarySortKey = (): DynamoDbKey => {
  const updatesSummaryTableSortKey: DynamoDbKey = {
    name: UPDATES_SUMMARY_TABLE_SORT_KEY,
    type: dynamodb.AttributeType.NUMBER,
  };
  return updatesSummaryTableSortKey;
};

export const createLatestProcessedRecordPartitionKey = (): DynamoDbKey => {
  const latestProcessedRecordTablePartitionKey: DynamoDbKey = {
    name: LATEST_PROCESSED_RECORD_PARTITION_KEY,
    type: dynamodb.AttributeType.STRING,
  };
  return latestProcessedRecordTablePartitionKey;
};
