import { createCrudApi } from './apiClient';
export const communityApi = createCrudApi('/communities');
export const blockApi = createCrudApi('/blocks');
export const apartmentApi = createCrudApi('/apartments');
