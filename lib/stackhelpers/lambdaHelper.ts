import {NodejsFunction, SourceMapMode} from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import path = require('path');
import * as cdk from 'aws-cdk-lib';
import {SubnetSelection, Vpc} from 'aws-cdk-lib/aws-ec2';
import {LayerVersion} from 'aws-cdk-lib/aws-lambda';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {Duration} from 'aws-cdk-lib';

export const PATH_TO_LAMBDAS = './lib/lambda/index.ts';
export const PATH_TO_LAMBDA_LAYER = '../lambda-layer';
export const LAMBDA_TIMEOUT_SECONDS = 180;
const LAMBDA_RUNTIME: lambda.Runtime = lambda.Runtime.NODEJS_18_X;
const LAMBDA_MEMORY_SIZE = 256;

export const createLambda = (
  stack: cdk.Stack,
  stackEventName: string,
  neptuneVpc: Vpc,
  lambdaSubnets: SubnetSelection,
  handlerName: string,
  customLayer: LayerVersion,
  envProps: {[key: string]: string} | undefined,
  externalModules: string[],
): NodejsFunction => {
  const resetDbHandler = new NodejsFunction(stack, stackEventName, {
    runtime: LAMBDA_RUNTIME,
    memorySize: LAMBDA_MEMORY_SIZE,
    vpc: neptuneVpc,
    vpcSubnets: lambdaSubnets,
    allowPublicSubnet: true,
    entry: path.resolve(PATH_TO_LAMBDAS),
    handler: handlerName,
    layers: [customLayer],
    logRetention: RetentionDays.ONE_MONTH,
    timeout: Duration.seconds(LAMBDA_TIMEOUT_SECONDS),
    environment: envProps,
    bundling: {
      minify: true,
      sourceMap: true,
      sourceMapMode: SourceMapMode.DEFAULT,
      externalModules: externalModules,
    },
  });

  return resetDbHandler;
};

export const createLambdaLayer = (stack: cdk.Stack ): LayerVersion => {
  const lambdaLayer = new lambda.LayerVersion(stack, 'LambdasLayer', {
    compatibleRuntimes: [LAMBDA_RUNTIME], 
    code: lambda.Code.fromAsset(path.join(__dirname, PATH_TO_LAMBDA_LAYER)),
  });

  return lambdaLayer;
};
