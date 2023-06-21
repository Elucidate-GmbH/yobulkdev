let jwt = null;
let bucketName = null;

const setEfiJwt = data => jwt = data;
const getEfiJwt = () => jwt;

const setSaveFileBucketName = origin => {
  if (getSubdomain(origin) === 'prod') bucketName = 'uploads.elucidate.co';
  else bucketName = 'efi-uploads-staging';
}
const getSaveFileBucketName = () => bucketName;

export { setEfiJwt, getEfiJwt, setSaveFileBucketName, getSaveFileBucketName };


function getSubdomain(s) {
  if (s.includes('localhost')) return 'local'
  const match = s.match(/^efi\.(\w+)?\.elucidate\.co$/);
  return match ? match[1] : 'prod'
}