import axios, {AxiosRequestHeaders} from 'axios';
import {resetNeptuneDbHandler, RESET_SUCCESFUL} from '../../lambda/resetNeptuneDbHandler';
import MockAdapter from 'axios-mock-adapter';

// Create a mock instance of axios
const mockedAxios = new MockAdapter(axios);
const emptyHeaders: AxiosRequestHeaders = {} as AxiosRequestHeaders;

describe('resetNeptuneDbHandler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reset Neptune database', async () => {
    // Arrange
    const token = 'sample-token';
    // Mock the response for getTokenForNeptuneReset
    mockedAxios.onPost('https://NEPTUNE_CLUSTER_BASE_URL/system', 'action=initiateDatabaseReset').reply(200, {
      payload: {token},
      status: 200,
      statusText: 'OK',
      config: {
        headers: emptyHeaders,
      },
      headers: {},
    });

    // Mock the response for resetNeptune
    mockedAxios
      .onPost('https://NEPTUNE_CLUSTER_BASE_URL/system', `action=performDatabaseReset&token=${token}`)
      .reply(200, {});

    // Act
    const result = await resetNeptuneDbHandler(null, null);

    // Assert
    expect(result).toEqual({message: RESET_SUCCESFUL});
  });
});
