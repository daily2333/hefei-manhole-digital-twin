import axios from 'axios';
import { runtimeConfig } from '../../config/runtimeConfig';

export const apiClient = axios.create({
  baseURL: runtimeConfig.apiBaseUrl,
  timeout: 8000
});
