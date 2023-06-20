let jwt = null;

const setEfiJwt = data => jwt = data;

const getEfiJwt = () => jwt;

export { setEfiJwt, getEfiJwt };