import axios from 'axios';
import { getEfiJwt } from './efi-jwt';

const axiosInstance = axios.create()

axiosInstance.interceptors.request.use((config) => {
  const { jwt } = getEfiJwt()
  config.headers.Authorization = jwt ? `Bearer ${jwt}` : ''
  return config
})

export default axiosInstance;