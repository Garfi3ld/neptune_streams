#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NeptuneWithVpcStack } from '../lib/neptuneStack';
import { ConfigParameterKey, Config } from './config';
import fs from 'fs';
import path from 'path';

const app = new cdk.App();
export const NEPTUNE_STACK_NAME = 'Neptune-With-VPC-Stack';
async function Main() {

  const envProps = {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  };

  const config = getConfigFromJSON();
  console.log(`neptuneStreamMain:: `);
  console.log(`CONFIG ${JSON.stringify(config)}`);


  const buildParameters: Config = {
    [ConfigParameterKey.VPC_NAME]:                          config[ConfigParameterKey.VPC_NAME],
    [ConfigParameterKey.CIDR]:                              config[ConfigParameterKey.CIDR],
    [ConfigParameterKey.ROLE_ARN]:                          config[ConfigParameterKey.ROLE_ARN],
    [ConfigParameterKey.SECURITY_GROUP_NAME]:               config[ConfigParameterKey.SECURITY_GROUP_NAME],
    [ConfigParameterKey.AZS]:                               config[ConfigParameterKey.AZS],
    [ConfigParameterKey.NAT_GATEWAYS]:                      config[ConfigParameterKey.NAT_GATEWAYS],
    [ConfigParameterKey.NEPTUNE_UPDATES_TABLE]:             config[ConfigParameterKey.NEPTUNE_UPDATES_TABLE],
    [ConfigParameterKey.LATEST_PROCESSED_RECORD_TABLE]:     config[ConfigParameterKey.LATEST_PROCESSED_RECORD_TABLE],
    [ConfigParameterKey.UPDATES_SUMMARY_TABLE]:             config[ConfigParameterKey.UPDATES_SUMMARY_TABLE],
    [ConfigParameterKey.STREAM_PARTITION_KEY]:              config[ConfigParameterKey.STREAM_PARTITION_KEY],
    [ConfigParameterKey.GRAPH_DB_CLUSTER_NAME]:             config[ConfigParameterKey.GRAPH_DB_CLUSTER_NAME],
  }


  new NeptuneWithVpcStack(app, NEPTUNE_STACK_NAME, {
    env: envProps,
    config: buildParameters,
  });
}

const getConfigFromJSON = (): Config => {
  const configFile = path.join(__dirname, 'default.config.json');
  const rawConfig = fs.readFileSync(configFile, 'utf-8');
  const configJson = JSON.parse(rawConfig);

  return {
    ...configJson,
  };
}


Main();
