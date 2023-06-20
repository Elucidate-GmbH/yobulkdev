let jwt = null;
let bucketName = null;

const setEfiJwt = data => jwt = data;
const getEfiJwt = () => jwt;

const setSaveFileBucketName = origin => {
  if (origin.includes('localhost')) bucketName = 'efi-uploads-staging';
  else bucketName = 'efi-uploads-' + getSubdomain(origin);
}
const getSaveFileBucketName = () => bucketName;

export { setEfiJwt, getEfiJwt, setSaveFileBucketName, getSaveFileBucketName };


function getSubdomain(s) {
  const match = s.match(/^efi\.(\w+)?\.elucidate\.co$/);
  return match ? match[1] : 'prod'
}