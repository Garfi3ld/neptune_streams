import {ClusterParameterGroup, DatabaseCluster, ParameterGroup} from '@aws-cdk/aws-neptune-alpha';
import * as neptune from '@aws-cdk/aws-neptune-alpha';
import * as cdk from 'aws-cdk-lib';
import {SubnetSelection, Vpc} from 'aws-cdk-lib/aws-ec2';
import {CustomStackProps} from '../../bin/config';

export interface NeptuneClusterProps {
  config: {
    GRAPH_DB_CLUSTER_NAME: string;
  };
}

export const createNeptuneClusterParams = (
  stack: cdk.Stack,
  clasterParamName: string,
  desc: string,
): ClusterParameterGroup => {
  return new neptune.ClusterParameterGroup(stack, clasterParamName, {
    description: desc,
    family: neptune.ParameterGroupFamily.NEPTUNE_1_2,
    parameters: {
      neptune_enable_audit_log: '1',
      neptune_streams: '1',
    },
  });
};

export const createNeptuneCluster = (
  stack: cdk.Stack,
  neptuneClusterParamName: string,
  clusterParams: ClusterParameterGroup,
  neptuneSubnets: SubnetSelection,
  neptuneVpc: Vpc,
  dbParams: ParameterGroup,
  props: CustomStackProps,
): DatabaseCluster => {
  return new neptune.DatabaseCluster(stack, neptuneClusterParamName, {
    dbClusterName: props.config.GRAPH_DB_CLUSTER_NAME,
    vpc: neptuneVpc,
    vpcSubnets: neptuneSubnets,
    instanceType: neptune.InstanceType.T3_MEDIUM,
    clusterParameterGroup: clusterParams,
    parameterGroup: dbParams,
    deletionProtection: false, // Not recommended for production clusters. This is enabled to easily delete the example stack.
    removalPolicy: cdk.RemovalPolicy.DESTROY, // Not recommended for production clusters. This is enabled to easily delete the example stack.
  });
};
