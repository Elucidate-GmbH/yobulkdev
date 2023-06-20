import axios from 'axios';
import { getEfiJwt } from './efi-jwt';

const axiosInstance = axios.create()

axiosInstance.interceptors.request.use((config) => {
  if (getEfiJwt()) config.headers.Authorization = `Bearer ${getEfiJwt()}`
  return config
})

export default axiosInstance;