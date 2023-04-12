import * as cdk from 'aws-cdk-lib';

export const enum ConfigParameterKey {
  VPC_NAME = 'VPC_NAME',
  CIDR = 'CIDR',
  ROLE_ARN = 'ROLE_ARN',
  SECURITY_GROUP_NAME = 'SECURITY_GROUP_NAME',
  AZS = 'AZS',
  NAT_GATEWAYS = 'NAT_GATEWAYS',
  UPDATES_SUMMARY_TABLE = 'UPDATES_SUMMARY_TABLE',
  NEPTUNE_UPDATES_TABLE = 'NEPTUNE_UPDATES_TABLE',
  LATEST_PROCESSED_RECORD_TABLE = 'LATEST_PROCESSED_RECORD_TABLE',
  STREAM_PARTITION_KEY = 'STREAM_PARTITION_KEY',
  GRAPH_DB_CLUSTER_NAME = 'GRAPH_DB_CLUSTER_NAME',
}

export interface Config {
  readonly VPC_NAME: string;
  readonly SECURITY_GROUP_NAME: string;
  readonly ROLE_ARN: string;
  readonly CIDR: string;
  readonly AZS: number;
  readonly NAT_GATEWAYS: number;
  readonly STREAM_PARTITION_KEY: string;
  readonly GRAPH_DB_CLUSTER_NAME: string;
  readonly UPDATES_SUMMARY_TABLE: string;
  readonly NEPTUNE_UPDATES_TABLE: string;
  readonly LATEST_PROCESSED_RECORD_TABLE: string;
}

export interface CustomStackProps extends cdk.StackProps {
  config: Config;
}
