import {ConfigParameterKey, CustomStackProps} from '../../../bin/config';

export const getCustomStackPropsTests = (): CustomStackProps => {
  const stackProps: CustomStackProps = {
    env: {region: 'us-west-2'},
    config: {
      [ConfigParameterKey.VPC_NAME]: 'NeptuneVPC',
      [ConfigParameterKey.CIDR]: '10.0.0.0/16',
      [ConfigParameterKey.AZS]: 2,
      [ConfigParameterKey.NAT_GATEWAYS]: 2,
      [ConfigParameterKey.GRAPH_DB_CLUSTER_NAME]: 'TestNeptuneCluster',
      [ConfigParameterKey.NEPTUNE_UPDATES_TABLE]: 'Test_updates_table',
      [ConfigParameterKey.LATEST_PROCESSED_RECORD_TABLE]: 'Test_latest_processed_table',
      [ConfigParameterKey.UPDATES_SUMMARY_TABLE]: 'Test_updates_summary_table',
      [ConfigParameterKey.SECURITY_GROUP_NAME]: 'securityGroupName',
      [ConfigParameterKey.ROLE_ARN]: 'roleARN',
      [ConfigParameterKey.STREAM_PARTITION_KEY]: 'streamPartitionKey',
    },
  };

  return stackProps;
};
