import {Context} from 'aws-lambda';
import 'jest';
import {StatusResponse} from '../../misc/interfaces';
import {statusHandler} from '../../lambda/statusHandler';
import axios from 'axios';
import * as neptuneStatusResponse from './status_response.json';

const event = {};
const context = {} as Context;
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Status Handler tests', () => {
  it('Should return succesful status from Neptune', async () => {
    // console.log(`Response: ${JSON.stringify(neptuneStreamingResponse)}`);
    mockedAxios.get.mockResolvedValueOnce(neptuneStatusResponse);
    const result: StatusResponse = (await statusHandler(event, context)) as StatusResponse;

    expect(result).toBeDefined();
    expect((result.gremlin.version = 'tinkerpop-3.5.2'));
  });
});
