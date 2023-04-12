import {CfnOutput} from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';

export const createCFNOutputs = (
  stack: cdk.Stack,
  neptuneReadAddress: string,
  neptuneWriteAddress: string,
  vpcId: string,
) => {
  createCfnOutput(
    stack,
    'NeptuneClusterReadAddress',
    neptuneReadAddress,
    'Neptune Cluster Read Address',
    'NeptuneWithVpcStack:NeptuneClusterReadAddress',
  );
  createCfnOutput(
    stack,
    'NeptuneClusterWriteAddress',
    neptuneWriteAddress,
    'Neptune Cluster Write Address',
    'NeptuneWithVpcStack:NeptuneClusterWriteAddress',
  );
  createCfnOutput(stack, 'VPCId', vpcId, 'Neptune VPC ID', 'NeptuneWithVpcStack:vpcId');
};

const createCfnOutput = (
  stack: cdk.Stack,
  cdkId: string,
  value: string,
  desc: string,
  exportName: string,
): CfnOutput => {
  return new cdk.CfnOutput(stack, cdkId, {
    value: value,
    description: desc,
    exportName: exportName,
  });
};
