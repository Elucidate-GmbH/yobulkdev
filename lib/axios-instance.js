import axios from 'axios';
import { getEfiJwt, getEfiOrigin } from './efi-store';

const axiosInstance = axios.create()

axiosInstance.interceptors.request.use((config) => {
  let efiRegex = /^(https?:\/\/)?efi(\.(staging|demo))?\.(elucidate\.co)$/;
  if (getEfiOrigin() && efiRegex.test(getEfiOrigin()) && config.url.includes('/api')) {
    config.url = '/uploader' + config.url
  }

  if (getEfiJwt()) config.headers.Authorization = `Bearer ${getEfiJwt()}`
  return config
})

export default axiosInstance;