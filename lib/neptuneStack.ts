import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {Construct} from 'constructs';
import {ConfigParameterKey, CustomStackProps} from '../bin/config';
import 'source-map-support/register';
import {ClusterParameterGroup, DatabaseCluster, ParameterGroup} from '@aws-cdk/aws-neptune-alpha';
import {
  createDbParams,
  createDynamoDbEndpoint,
  createDynamoDbTable,
  createLatestProcessedRecordPartitionKey,
  createNeptuneUpdatesPartionKey,
  createNeptuneUpdatesSortKey,
  createUpdatesSummaryPartitionKey,
  createUpdatesSummarySortKey,
} from './stackhelpers/dynamoDbHelper';
import {IpAddresses, Vpc} from 'aws-cdk-lib/aws-ec2';
import {createLambda, createLambdaLayer} from './stackhelpers/lambdaHelper';
import {Table} from 'aws-cdk-lib/aws-dynamodb';
import {getNetworkConfig} from './stackhelpers/networkHelper';
import {createNeptuneClusterParams, createNeptuneCluster} from './stackhelpers/neptuneClusterHelper';
import {setupStepFunction} from './stackhelpers/stepFunctionHelper';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {createCFNOutputs} from './stackhelpers/cfnOutPutHelper';
import {createTags} from './stackhelpers/stackHelper';

export const EMPTY_PROPS_ERROR = 'EMPTY PROPS';

export class NeptuneWithVpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: CustomStackProps) {
    super(scope, id, props);

    if (props === undefined || props === null) {
      throw new Error(EMPTY_PROPS_ERROR);
    }

    // Create VPC for use with Neptune
    const neptuneVpc: Vpc = new ec2.Vpc(this, props.config.VPC_NAME, {
      ipAddresses: IpAddresses.cidr(props.config.CIDR),
      maxAzs: props.config.AZS,
      natGateways: props.config.NAT_GATEWAYS,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: getNetworkConfig(),
    });

    // Get lists of Subnets by type
    const neptunePublicSubnets = neptuneVpc.publicSubnets;
    // const neptunePrivateSubnets = neptuneVpc.privateSubnets;
    const neptuneIsolatedSubnets = neptuneVpc.isolatedSubnets;

    // Create Subnet group list to be used with Neptune.
    const neptuneSubnets: ec2.SubnetSelection = {subnets: neptuneIsolatedSubnets};
    const lambdaSubnets: ec2.SubnetSelection = {subnets: neptunePublicSubnets};

    //NEPTUNE Cluster
    const clusterParams: ClusterParameterGroup = createNeptuneClusterParams(
      this,
      'ClusterParams',
      'Neptune cluster parameter group',
    );
    const dbParams: ParameterGroup = createDbParams(this);
    const neptuneCluster: DatabaseCluster = createNeptuneCluster(
      this,
      'NeptuneCluster',
      clusterParams,
      neptuneSubnets,
      neptuneVpc,
      dbParams,
      props,
    );
    // Update Neptune Security Group to allow-all-in
    neptuneCluster.connections.allowDefaultPortFromAnyIpv4('Allow From All');
    // Output the Neptune read/write addresses
    const neptuneClusterWriteAddress: string = neptuneCluster.clusterEndpoint.socketAddress;
    const neptuneClusterReadAddress: string = neptuneCluster.clusterReadEndpoint.socketAddress;

    //DYNAMO DB
    // To access Dynamo DB need to configure GateWay Endpoint
    createDynamoDbEndpoint(this, neptuneVpc);
    // Neptune updates table
    const neptuneUpdatesTable: Table = createDynamoDbTable(
      this,
      'NeptuneUpdatesTable',
      props.config.NEPTUNE_UPDATES_TABLE,
      createNeptuneUpdatesPartionKey(),
      1,
      15,
      createNeptuneUpdatesSortKey(),
    );
    // Updates summary table
    const updatesSummaryTable: Table = createDynamoDbTable(
      this,
      'UpdatesSummaryTable',
      props.config.UPDATES_SUMMARY_TABLE,
      createUpdatesSummaryPartitionKey(),
      1,
      1,
      createUpdatesSummarySortKey(),
    );

    // Latest Process record table
    const latestProcessedRecordTable: Table = createDynamoDbTable(
      this,
      'LatestProcessedRecordTable',
      props.config.LATEST_PROCESSED_RECORD_TABLE,
      createLatestProcessedRecordPartitionKey(),
      1,
      1,
      undefined,
    );

    //LAMBDAs
    //Note: can only be created 1 time.
    const lambdaLayer = createLambdaLayer(this);
    // STATUS Handler
    const envStatusHandler = {NEPTUNE_CLUSTER_BASE_URL: neptuneClusterReadAddress};
    const externalModulesStatusHandler = ['axios'];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const statusHandler = createLambda(
      this,
      'Status-Handler',
      neptuneVpc,
      lambdaSubnets,
      'statusHandler',
      lambdaLayer,
      envStatusHandler,
      externalModulesStatusHandler,
    );

    //RESET Handler
    const envResetHandler = {NEPTUNE_CLUSTER_BASE_URL: neptuneClusterReadAddress};
    const externalModulesResetHandler = ['axios'];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const resetDbHandler = createLambda(
      this,
      'Reset-DB-Handler',
      neptuneVpc,
      lambdaSubnets,
      'resetNeptuneDbHandler',
      lambdaLayer,
      envResetHandler,
      externalModulesResetHandler,
    );

    //STREAM Handler
    const envStreamHandler = {
      NEPTUNE_CLUSTER_BASE_URL: neptuneClusterReadAddress,
      [ConfigParameterKey.LATEST_PROCESSED_RECORD_TABLE]: props.config.LATEST_PROCESSED_RECORD_TABLE,
      [ConfigParameterKey.NEPTUNE_UPDATES_TABLE]: props.config.NEPTUNE_UPDATES_TABLE,
      [ConfigParameterKey.UPDATES_SUMMARY_TABLE]: props.config.UPDATES_SUMMARY_TABLE,
    };

    const externalModulesSreamHandler = ['aws-sdk/client-dynamodb', 'aws-sdk/lib-dynamodb', 'axios'];
    const streamHandler: NodejsFunction = createLambda(
      this,
      'Stream-Handler',
      neptuneVpc,
      lambdaSubnets,
      'streamHandler',
      lambdaLayer,
      envStreamHandler,
      externalModulesSreamHandler,
    );

    //Granting DynamoDb permissions to lambdas
    neptuneUpdatesTable.grantReadWriteData(streamHandler);
    updatesSummaryTable.grantReadWriteData(streamHandler);
    latestProcessedRecordTable.grantReadWriteData(streamHandler);

    //Setting up step function to loop continiosly
    setupStepFunction(this, streamHandler);

    createCFNOutputs(this, neptuneClusterReadAddress, neptuneClusterWriteAddress, neptuneVpc.vpcId);
    // Add tags to all assets within this stack
    createTags(this, neptuneVpc);
  }
}
