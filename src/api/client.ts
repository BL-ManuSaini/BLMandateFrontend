import { mandateApi } from './client/mandateClient';
import { hiringDriveApi } from './client/hiringDriveClient';

export { mandateApi, mandateClient } from './client/mandateClient';
export { hiringDriveApi, hiringDriveClient } from './client/hiringDriveClient';
export {
  MANDATE_SERVICE_BASE_URL,
  HIRING_DRIVE_SERVICE_BASE_URL,
  MANDATE_SERVICE_HOST,
  HIRING_DRIVE_SERVICE_HOST,
  GOOGLE_CLIENT_ID,
} from './client/config';

/** Mandate service API — default for mandate-domain hooks */
export const api = mandateApi;

/** @deprecated Use mandateClient */
export { default } from './client/mandateClient';
