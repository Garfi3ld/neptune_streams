import axios, {AxiosRequestConfig} from 'axios';

export const createAxiosConfig = (
  inputBaseUrl: string,
  inputUrl: string,
  httpMethod: 'get' | 'post' | 'put' | 'delete',
  headersType: string,
  inputData: unknown,
): AxiosRequestConfig => {
  const config: AxiosRequestConfig = {
    baseURL: inputBaseUrl,
    headers: createAxiosHeaders(headersType),
    url: inputUrl,
    method: httpMethod,
    data: inputData,
  };

  return config;
};

export const processAxiosError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    // NOTE: 404 is returned when there is no data in the stream! Why not an empty stream response...
    // Thus always read the error.resonse.data for the correct explanation
    // https://docs.aws.amazon.com/neptune/latest/userguide/CommonErrors.html
    console.error('Axios error message: ', error.message);
    console.error('Axios error response: ', error.response?.data);
  } else {
    console.error('Axios unexpected error: ', error);
  }
};

const createAxiosHeaders = (type: string) => {
  let headers = {};
  if (type.length > 0 && type.toLowerCase() === 'json') {
    headers = {'Content-Type': 'application/json', Accept: 'application/json'};
  }

  if (type.length > 0 && type.length === 0) {
    headers = {'Content-Type': 'application/x-www-form-urlencoded'};
  }

  return headers;
};
