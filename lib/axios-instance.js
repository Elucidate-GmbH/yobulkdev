import axios from 'axios';
import { URL } from 'url';
import { getEfiJwt } from './efi-store';

const axiosInstance = axios.create()

axiosInstance.interceptors.request.use((config) => {
  const urlObject = new URL(config.url);

  if (!urlObject.hostname.includes('localhost')) {
    if (urlObject.pathname.startsWith('/api')) {
      urlObject.pathname = '/uploader' + urlObject.pathname;
    }
  }

  config.url = urlObject.toString();
  if (getEfiJwt()) config.headers.Authorization = `Bearer ${getEfiJwt()}`

  return config
})

export default axiosInstance;