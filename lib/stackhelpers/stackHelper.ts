import * as cdk from 'aws-cdk-lib';

export const createTags = (stack: cdk.Stack) => {
    cdk.Tags.of(stack).add('CreatedBy', 'CDK', {priority: 300});
    cdk.Tags.of(stack).add('Purpose', 'Neptune Cluster Stream demo', {priority: 300});
    cdk.Tags.of(stack).add('Owner', 'CDK', {priority: 300});
}

