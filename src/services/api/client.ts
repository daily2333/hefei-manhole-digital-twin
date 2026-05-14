import axios from 'axios';
import { runtimeConfig } from '../../config/runtimeConfig';

export const apiClient = axios.create({
  baseURL: runtimeConfig.apiBaseUrl,
  timeout: 8000
});

export const setAuthToken = (token: string | null): void => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

const storedToken = sessionStorage.getItem('auth_token');
if (storedToken) {
  setAuthToken(storedToken);
}
