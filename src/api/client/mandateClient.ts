import { createServiceClient } from './createApiClient';
import { MANDATE_SERVICE_BASE_URL } from './config';

const { client, api } = createServiceClient(MANDATE_SERVICE_BASE_URL);

export const mandateClient = client;
export const mandateApi = api;

/** @deprecated Use mandateApi — kept for incremental migration */
export default mandateClient;
