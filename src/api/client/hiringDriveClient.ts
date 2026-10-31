import { createServiceClient } from './createApiClient';
import { HIRING_DRIVE_SERVICE_BASE_URL } from './config';

const { client, api } = createServiceClient(HIRING_DRIVE_SERVICE_BASE_URL);

export const hiringDriveClient = client;
export const hiringDriveApi = api;
