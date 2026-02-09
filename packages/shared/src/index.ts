// Common schemas
export {
  paginationSchema,
  idParamSchema,
  errorResponseSchema,
  messageResponseSchema,
} from './schemas/common.js'

// Auth schemas
export {
  loginRequestSchema,
  userProfileSchema,
  loginResponseSchema,
  changePasswordRequestSchema,
  refreshRequestSchema,
  tokenResponseSchema,
  logoutRequestSchema,
} from './schemas/auth.js'

// User schemas
export {
  userResponseSchema,
  userListQuerySchema,
  userListResponseSchema,
  updateUserRequestSchema,
  importUserSchema,
  importUsersRequestSchema,
  importResultSchema,
  resetPasswordResponseSchema,
} from './schemas/user.js'

// Progress schemas
export {
  saveProgressRequestSchema,
  progressResponseSchema,
  emptyProgressResponseSchema,
} from './schemas/progress.js'

// Device schemas
export {
  registerDeviceRequestSchema,
  deviceResponseSchema,
  unregisterDeviceRequestSchema,
} from './schemas/device.js'

// Event schemas
export {
  submitEventSchema,
  submitEventsRequestSchema,
  eventsResponseSchema,
} from './schemas/event.js'

// Analytics schemas
export { chartsResponseSchema } from './schemas/analytics.js'

// Constants
export { EVENT_TYPES } from './constants/event-types.js'
