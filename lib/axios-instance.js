import axios from 'axios';
import { getEfiJwt } from './efi-store';

const axiosInstance = axios.create()

axiosInstance.interceptors.request.use((config) => {
  if (!config.url.includes('localhost')) {
    // Replace 'api' with 'uploader/api' if the URL is in the specified format
    config.url = config.url.replace(/(https?:\/\/[^/]+\/)(api\/)/, '$1uploader/$2');
  }
  if (getEfiJwt()) config.headers.Authorization = `Bearer ${getEfiJwt()}`

  return config
})

export default axiosInstance;