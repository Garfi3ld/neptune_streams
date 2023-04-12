import {ddbDocClient} from '../../dynamodb/dynamoDbDocClient';
import {saveUpdates} from '../../dynamodb/dynamoDbOperations';
import {NeptuneStreamResponse} from '../../misc/interfaces';
import {TransactWriteCommand} from '../../lambda-layer/nodejs/node_modules/@aws-sdk/lib-dynamodb';

import neptuneStreamData from './neptuneResponse_3_records.json';
jest.mock('../../dynamodb/dynamoDbDocClient');

beforeEach(() => {
  (ddbDocClient.send as jest.Mock).mockReset();
});

test('saveUpdates should call ddbDocClient.send with TransactWriteCommand', async () => {
  const newStreamRecords: NeptuneStreamResponse = neptuneStreamData;
  const neptuneUpdatesTable = 'neptuneUpdatesTable';
  const lastProcessedRecordTable = 'lastProcessedRecordTable';
  const updatesSummaryTable = 'updatesSummaryTable';

  (ddbDocClient.send as jest.Mock).mockResolvedValue({});

  await saveUpdates(newStreamRecords, neptuneUpdatesTable, lastProcessedRecordTable, updatesSummaryTable);

  expect(ddbDocClient.send).toHaveBeenCalledTimes(1);
  expect(ddbDocClient.send).toHaveBeenCalledWith(expect.any(TransactWriteCommand));
  expect(ddbDocClient.send).toHaveBeenCalledWith(
    expect.objectContaining({
      input: expect.objectContaining({
        TransactItems: expect.arrayContaining([
          // Check for the presence of updateRecordsOperations
          ...newStreamRecords.records.map((record) => {
            return expect.objectContaining({
              Put: expect.objectContaining({
                TableName: neptuneUpdatesTable,
                Item: expect.objectContaining({
                  timestamp: record.commitTimestamp,
                  operationSequence: record.eventId.opNum,
                  commitNum: record.eventId.commitNum,
                  operation: record.op,
                  data: JSON.stringify(record.data),
                }),
              }),
            });
          }),
          // Check for the presence of updateLatestOpNumberOperation
          expect.objectContaining({
            Put: expect.objectContaining({
              TableName: lastProcessedRecordTable,
              Item: expect.objectContaining({
                id: expect.any(String),
                lastTrxTimestamp: newStreamRecords.lastTrxTimestamp,
                commitNum: newStreamRecords.lastEventId.commitNum,
                opNum: newStreamRecords.lastEventId.opNum,
              }),
            }),
          }),
          // Check for the presence of updateSummaryOperation
          expect.objectContaining({
            Put: expect.objectContaining({
              TableName: updatesSummaryTable,
              Item: expect.objectContaining({
                lastTrxTimestamp: newStreamRecords.lastTrxTimestamp,
                commitNum: newStreamRecords.lastEventId.commitNum,
                opNum: newStreamRecords.lastEventId.opNum,
              }),
            }),
          }),
        ]),
      }),
    }),
  );
});
