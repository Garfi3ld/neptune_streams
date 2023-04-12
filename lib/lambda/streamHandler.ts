import axios, {AxiosError} from 'axios';
import {LastUpdatedRecordItem, NeptuneStreamRecord, NeptuneStreamResponse} from '../misc/interfaces';
import {getLatestRecordedUpdate, saveUpdates} from '../dynamodb/dynamoDbOperations';
import {createAxiosConfig, processAxiosError} from '../misc/utils';
import {CONTINUE} from '../stackhelpers/stepFunctionHelper';

export const MAX_RANGE = 98; //Max allowed 100 for the TransactWriteCommand. 2 other slots will be used to update the latest and summary tables
export const AT_SEQUENCE_NUMBER_ITERATOR = 'AT_SEQUENCE_NUMBER';
export const AFTER_SEQUENCE_NUMBER_ITERATOR = 'AFTER_SEQUENCE_NUMBER';
export const LATEST_ITERATOR = 'LATEST';
export const NO_RECORDS_ERROR = 'No records returnd from stream-latest-operation table.';
export const NO_UPDATES_INFO = 'There are no updates.';
export const NO_RECORDS_TO_UPDATE_INFO = 'No records to update';
export const NO_STREAM_RECORDS_INFO = 'Did not get any stream records. Exiting.';
export const SAVED_ERROR = 'Error occurred';
export const UNDEFINED_RESPONSE_ERROR = 'Undefined response';
export const GET_LATEST_RECORDS_ERROR = 'Failed to get the latest records.';
export const GET_UPDATED_STREAM_RECORDS_ERROR = 'Failed to get updated stream records';


const STREAM_URL = 'propertygraph/stream';
const BASE_URL = `https://${process.env.NEPTUNE_CLUSTER_BASE_URL}`;
const LATEST_PROCESSED_RECORD_TABLE = process.env.LATEST_PROCESSED_RECORD_TABLE as string;
const NEPTUNE_UPDATES_TABLE = process.env.NEPTUNE_UPDATES_TABLE as string;
const UPDATES_SUMMARY_TABLE = process.env.UPDATES_SUMMARY_TABLE as string;

/**
 * StreamHandler is the main function that updates DynamoDB tables with the latest stream records.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const streamHandler = async (_event?: unknown, _context?: unknown): Promise<{status: string} | undefined> => {
  console.log('StreamHandler::');
  try {
    const latestStoredRecord: LastUpdatedRecordItem | undefined = await getLatestRecordedUpdate(
      LATEST_PROCESSED_RECORD_TABLE,
    );
    const latestStreamRecordFromNeptune = await getLatestStreamRecord();

    if (!latestStreamRecordFromNeptune) {
      console.info(NO_STREAM_RECORDS_INFO);
      return {status: CONTINUE};
    }

    const latestStreamRecord = latestStreamRecordFromNeptune as NeptuneStreamRecord;
    console.log(`latestStreamRecord : ${JSON.stringify(latestStreamRecord)}`);
    console.log(`latestStoredRecord: ${JSON.stringify(latestStoredRecord)}`);

    const storedOpNum: number = getOpNum(latestStoredRecord);
    const storedCommitNum: number = getCommitNum(latestStoredRecord);

    if (updatesAvailable(latestStreamRecord, storedCommitNum, storedOpNum)) {
      console.log(NO_UPDATES_INFO);
      return {status: CONTINUE};
    }

    const newStreamRecords = await getUpdatedStreamRecords(MAX_RANGE, storedCommitNum, storedOpNum);

    if (!newStreamRecords) {
      console.log(NO_RECORDS_TO_UPDATE_INFO);
      return {status: CONTINUE};
    }

   // console.log(`New records to update: ${JSON.stringify(newStreamRecords)}`);
    await saveUpdates(newStreamRecords, NEPTUNE_UPDATES_TABLE, LATEST_PROCESSED_RECORD_TABLE, UPDATES_SUMMARY_TABLE);

    console.log(`Updated latest record and summary, and saved new stream records`);
    return {status: CONTINUE};
  } catch (error) {
    console.error(error);
    throw new Error(SAVED_ERROR);
  }
};
/**
 * Fetches the latest stream record from Neptune.
 *  NOTE: 404 is returned when there is no data in the stream! Why not an empty stream response...
 *  Thus always read the error.resonse.data for the correct explanation
 *  https://docs.aws.amazon.com/neptune/latest/userguide/CommonErrors.html
 */
export const getLatestStreamRecord = async (): Promise<NeptuneStreamRecord | undefined> => {
  console.log(`getLatestStreamRecord::`);
  const streamLatestOperationUrl = `${STREAM_URL}?iteratorType=${LATEST_ITERATOR}`;
  const config = createAxiosConfig(BASE_URL, streamLatestOperationUrl, 'get', 'json', '');

  try {
    const {data} = await axios(config);
    if (data === null || data === undefined) {
      throw new Error(UNDEFINED_RESPONSE_ERROR);
    }

    const response: NeptuneStreamResponse = data as NeptuneStreamResponse;
    return response.records[0];
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data.code === 'StreamRecordsNotFoundException') {
      console.log(
        `There is no data in the stream. https://docs.aws.amazon.com/neptune/latest/userguide/CommonErrors.html`,
      );
      return undefined;
    } else {
      processAxiosError(error);
      return undefined;
    }
  }
};

/**
 * Fetches updated stream records with a given range, starting from a specific commitNumber and opNumber.
 */
export const getUpdatedStreamRecords = async (
  range: number,
  commitNumber: number,
  opNumber: number,
): Promise<NeptuneStreamResponse | undefined> => {
  console.log(`getUpdatedStreamRecords: range ${range} | commitNumber ${commitNumber} | opNumber ${opNumber}`);

  if (range > MAX_RANGE) {
    throw new Error(`The range cannot be higher than ${MAX_RANGE}. Provided: ${range}`);
  }

  const streamURL = getStreamUrl(range, commitNumber, opNumber);
  const config = createAxiosConfig(BASE_URL, streamURL, 'get', 'json', '');

  console.log('Getting updated stream records');

  try {
    const {data} = await axios(config);
    if (data === null || data === undefined) {
      console.error(`config: ${config}`);
      return undefined;
    }

    const response: NeptuneStreamResponse = data;
    return response;
  } catch (error) {
    processAxiosError(error);
    return undefined;
  }
};

const getIterator = (commitNumber: number, opNumber: number): string => {
  return commitNumber === 1 && opNumber === 1 ? AT_SEQUENCE_NUMBER_ITERATOR : AFTER_SEQUENCE_NUMBER_ITERATOR;
};

const getStreamUrl = (range: number, commitNumber: number, opNumber: number): string => {
  const iteratorType = getIterator(commitNumber, opNumber);
  return `${STREAM_URL}?limit=${range}&commitNum=${commitNumber}&opNum=${opNumber}&iteratorType=${iteratorType}`;
};

const getOpNum = (latestStoredRecord: LastUpdatedRecordItem | undefined): number => {
  return latestStoredRecord !== null && latestStoredRecord !== undefined ? latestStoredRecord.opNum : 1;
};

const getCommitNum = (latestStoredRecord: LastUpdatedRecordItem | undefined): number => {
  return latestStoredRecord !== null && latestStoredRecord !== undefined ? latestStoredRecord.commitNum : 1;
};

const updatesAvailable = (latestStreamRecord: NeptuneStreamRecord, storedCommitNum: number, storedOpNum: number) => {
  return latestStreamRecord.eventId.commitNum === storedCommitNum && latestStreamRecord.eventId.opNum === storedOpNum;
};
