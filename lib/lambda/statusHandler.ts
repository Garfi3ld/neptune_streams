import axios from 'axios';
export const ERROR_MESSAGES = {
  AXIOS_ERROR: 'error message: ',
  UNEXPECTED_ERROR: 'An unexpected error occurred',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const statusHandler = async (_event: unknown, _context: unknown): Promise<unknown> => {
  try {
    const statusUrl = 'https://' + process.env.NEPTUNE_CLUSTER_BASE_URL + '/status';
    console.log(`BASE URL : ${statusUrl}`);
    const {data} = await axios.get(statusUrl);
    console.log(`RESPONSE DATA : ${JSON.stringify(data, null, 4)}`);

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`${ERROR_MESSAGES.AXIOS_ERROR}${error.message}`);
      return error.message;
    } else {
      console.error(`${ERROR_MESSAGES.UNEXPECTED_ERROR}`, error);
      return ERROR_MESSAGES.UNEXPECTED_ERROR;
    }
  }
};
