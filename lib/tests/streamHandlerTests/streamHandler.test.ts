import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  AT_SEQUENCE_NUMBER_ITERATOR,
  getLatestStreamRecord,
  getUpdatedStreamRecords,
  LATEST_ITERATOR,
  MAX_RANGE,
} from '../../lambda/streamHandler';
import {NeptuneStreamRecord} from '../../misc/interfaces';
import streaming_response from './streaming_response.json';

// Create a mock instance of axios
const mockedAxios = new MockAdapter(axios);

describe('StreamHandler functions', () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockedAxios.reset();
  });

  test('getLatestStreamRecord returns the latest stream record', async () => {
    const mockRecord: NeptuneStreamRecord = streaming_response.data.records[0] as unknown as NeptuneStreamRecord;

    mockedAxios
      .onGet(`https://NEPTUNE_CLUSTER_BASE_URL/propertygraph/stream?iteratorType=${LATEST_ITERATOR}`)
      .reply(200, streaming_response.data);

    const result = await getLatestStreamRecord();

    expect(result).toEqual(mockRecord);
  });

  test('getUpdatedStreamRecords returns updated stream records', async () => {
    // const mockRecords: NeptuneStreamRecord[] = streaming_response.data.records as unknown as NeptuneStreamRecord;

    mockedAxios
      .onGet(
        `https://NEPTUNE_CLUSTER_BASE_URL/propertygraph/stream?limit=${MAX_RANGE}&commitNum=1&opNum=1&iteratorType=${AT_SEQUENCE_NUMBER_ITERATOR}`,
      )
      .reply(200, streaming_response.data);

    const result = await getUpdatedStreamRecords(98, 1, 1);

    expect(result).toEqual(streaming_response.data);
  });
});
