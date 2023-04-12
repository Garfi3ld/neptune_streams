import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {SubnetConfiguration} from 'aws-cdk-lib/aws-ec2';

/**
 * Each entry in this list configures a Subnet Group
 *
 * ISOLATED: Isolated Subnets do not route traffic to the Internet (in this VPC).
 * PRIVATE.: Subnet that routes to the internet, but not vice versa.
 * PUBLIC..: Subnet connected to the Internet.
 */
export const getNetworkConfig = (): SubnetConfiguration[] => {
  const isolatedPrivateSubnet = {
    cidrMask: 24,
    name: 'db',
    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
  };

  const publicSubnet = {
    cidrMask: 24,
    name: 'dmz',
    subnetType: ec2.SubnetType.PUBLIC,
  };

  return [isolatedPrivateSubnet, publicSubnet];
};
