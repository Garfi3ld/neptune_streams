import * as cdk from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';

export const createTags = (stack: cdk.Stack, neptuneVpc:Vpc) => {
  cdk.Tags.of(stack).add('CreatedBy', 'CDK', {priority: 300});
  cdk.Tags.of(stack).add('Purpose', 'Neptune Cluster Stream demo', {priority: 300});
  cdk.Tags.of(stack).add('Owner', 'CDK', {priority: 300});

  // Tag the public subnets
   neptuneVpc.publicSubnets.forEach((subnet) => {
    cdk.Tags.of(subnet).add('NetworkType', 'Public');
  });

  // Tag the isolated subnets
  neptuneVpc.isolatedSubnets.forEach((subnet) => {
    cdk.Tags.of(subnet).add('NetworkType', 'Private');
  });
};
