import {DynamoDBClient} from '../lambda-layer/nodejs/node_modules/@aws-sdk/client-dynamodb';

const ddbClient = new DynamoDBClient({region: process.env.CDK_DEFAULT_REGION});
export {ddbClient};
