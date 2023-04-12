/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {AxiosResponse} from 'axios';
import {createAxiosConfig, processAxiosError} from '../misc/utils';

export const BASE_URL_NOT_DEFINED =
  'BASE_URL is not defined. Please set the appropriate environment variable or update the configuration file.';
export const ERROR_RESETING_NEPTUNE_DB = 'An error occurred while resetting the Neptune database.';
export const UNEXPECTED_ERROR = 'An unexpected error occurred while resetting the Neptune database.';
export const RESET_SUCCESFUL = 'Reset successful';

const BASE_URL = `https://${process.env.NEPTUNE_CLUSTER_BASE_URL}`;
/**
 * Resets the Neptune database. Used for testing.
 *
 * @async
 * @param {any} _event - The event object. Not used in the function.
 * @param {any} _context - The context object. Not used in the function.
 * @returns {Promise<any>} A promise that resolves to the reset response data, or throws an error if an error occurs.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const resetNeptuneDbHandler = async (_event: any, _context: any): Promise<any> => {
  try {
    if (BASE_URL.length === 0) {
      throw new Error(BASE_URL_NOT_DEFINED);
    }

    const response: AxiosResponse = await getTokenForNeptuneReset();

    const resetDbResponse = await resetNeptune(response.data.payload.token);
    console.log(`resetDbResponse ${resetDbResponse}`);
    return {message: RESET_SUCCESFUL};
  } catch (error) {
    if (axios.isAxiosError(error)) {
      processAxiosError(error);
      throw new Error(`${ERROR_RESETING_NEPTUNE_DB}: ${error}`);
    } else {
      console.error('Error :', error);
      throw new Error(`${UNEXPECTED_ERROR}: ${error}`);
    }
  }
};

/**
 * Gets the token for the Neptune database reset.
 *
 * @async
 * @returns {Promise<AxiosResponse<any>>} A promise that resolves to the token response data.
 */
export const getTokenForNeptuneReset = async (): Promise<AxiosResponse<any>> => {
  console.log(`getTokenForNeptuneReset::`); // ${process.env.NEPTUNE_CLUSTER_BASE_URL}`);

  const configInitiateReset = createAxiosConfig(BASE_URL, '/system', 'post', '', 'action=initiateDatabaseReset');

  return axios(configInitiateReset);
};

/**
 * Resets the Neptune database using the provided token.
 *
 * @async
 * @param {string} token - The token string to use for the database reset.
 * @returns {Promise<AxiosResponse<any>>} A promise that resolves to the reset response data.
 */
export const resetNeptune = async (token: string): Promise<AxiosResponse<any>> => {
  const resetDbConfig = createAxiosConfig(
    BASE_URL,
    '/system',
    'post',
    '',
    `action=performDatabaseReset&token=${token}`,
  );

  return axios(resetDbConfig);
};
