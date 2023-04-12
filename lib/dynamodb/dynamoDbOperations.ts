import {ScanCommand, TransactWriteCommand} from '../lambda-layer/nodejs/node_modules/@aws-sdk/lib-dynamodb';
import {DescribeTableCommand} from '../lambda-layer/nodejs/node_modules/@aws-sdk/client-dynamodb';
import {ddbDocClient} from './dynamoDbDocClient';
import {
  LastUpdatedRecordItem,
  NeptuneStreamRecord,
  NeptuneStreamResponse,
  StreamItemToSave,
  UpdateSummaryItem,
} from '../misc/interfaces';

const LAST_UPDATED_RECORD_ID = 'latest';

export async function saveUpdates(
  newStreamRecords: NeptuneStreamResponse,
  neptuneUpdatesTable: string,
  lastProcessedRecordTable: string,
  updatesSummaryTable: string,
) {
  const updateRecordsOperations = createUpdateRecordsOperation(newStreamRecords, neptuneUpdatesTable);
  console.log(`updateRecordsOperations ${JSON.stringify(updateRecordsOperations)}`);
  const updateLatestOpNumberOperation = createUpdateLatestOpNumberOperation(lastProcessedRecordTable, newStreamRecords);
  const updateSummaryOperation = createUpdateSummaryOperation(updatesSummaryTable, newStreamRecords);

  const allOperations = [...updateRecordsOperations, updateLatestOpNumberOperation, updateSummaryOperation];

  const params = {
    TransactItems: allOperations,
  };

  await retryWithExponentialBackoff(async () => {
    await ddbDocClient.send(new TransactWriteCommand(params));
  });
}

export const createUpdateRecordsOperation = (newStreamRecords: NeptuneStreamResponse, neptuneUpdatesTable: string) => {
  return newStreamRecords.records.map((record: NeptuneStreamRecord) => {
    return {
      Put: {
        TableName: neptuneUpdatesTable,
        Item: mapRecordToUpdateRecordsItem(record),
      },
    };
  });
};

const mapRecordToUpdateRecordsItem = (record: NeptuneStreamRecord): StreamItemToSave => {
  return {
    timestamp: record.commitTimestamp as number,
    operationSequence: record.eventId.opNum as number,
    commitNum: record.eventId.commitNum as number,
    operation: record.op,
    data: JSON.stringify(record.data),
  };
};

export const createUpdateSummaryOperation = (updatesSummaryTable: string, newStreamRecords: NeptuneStreamResponse) => {
  return {
    Put: {
      TableName: updatesSummaryTable,
      Item: mapRecordToUpdateSummaryItem(newStreamRecords),
    },
  };
};

const mapRecordToUpdateSummaryItem = (record: NeptuneStreamResponse): UpdateSummaryItem => {
  return {
    lastTrxTimestamp: record.lastTrxTimestamp as number,
    commitNum: record.lastEventId.commitNum as number,
    opNum: record.lastEventId.opNum as number,
  };
};

export const createUpdateLatestOpNumberOperation = (
  lastProcessedRecordTable: string,
  newStreamRecords: NeptuneStreamResponse,
) => {
  return {
    Put: {
      TableName: lastProcessedRecordTable,
      Item: mapRecordToUpdateLatestOpNumberItem(newStreamRecords),
    },
  };
};

const mapRecordToUpdateLatestOpNumberItem = (record: NeptuneStreamResponse): LastUpdatedRecordItem => {
  return {
    id: LAST_UPDATED_RECORD_ID,
    lastTrxTimestamp: record.lastTrxTimestamp as number,
    commitNum: record.lastEventId.commitNum as number,
    opNum: record.lastEventId.opNum as number,
  };
};

/**
 * Get the latest recorded Operational number
 * @returns Promise<LastUpdatedRecordItem> | undefined>
 */
export const getLatestRecordedUpdate = async (
  latestProcessedRecordTableName: string,
): Promise<LastUpdatedRecordItem | undefined> => {
  console.log(`getLatestRecordedUpdate:: latestProcessedRecordTableName ${latestProcessedRecordTableName}`);

  const params = {
    TableName: latestProcessedRecordTableName,
    Limit: 1,
    ScanIndexForward: true,
  };

  try {
    const result = await ddbDocClient.send(new ScanCommand(params));

    if (result.Items && result.Items.length > 0) {
      return result.Items[0] as LastUpdatedRecordItem;
    }
  } catch (error) {
    console.error(`Error getting the latest recorded update: ${error}`);
  }

  return undefined;
};

//Need to use an exponential back off as db can be busy with the high load
const sleep = (ms: number | undefined) => new Promise(resolve => setTimeout(resolve, ms));

export const retryWithExponentialBackoff = async (func: () => any, maxRetries = 5, baseDelay = 50, maxDelay = 1000) => {
  console.log(`retryWithExponentialBackoff::`);
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await func();
    } catch (error) {
      attempt++;

      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
      const jitter = Math.floor(Math.random() * delay);
      await sleep(jitter);
    }
  }
};

//** is used for debugging purposes only */
export const describeTable = async (tableName: string) => {
  console.log(`describeTable`);
  const params = {
    TableName: tableName,
  };

  const command = new DescribeTableCommand(params);

  try {
    const data = await ddbDocClient.send(command);
    console.log(`Table Schema: ${JSON.stringify(data)}`);
  } catch (error) {
    console.log(error);
  }
};
