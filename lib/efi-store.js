let jwt = null;
let bucketName = null;
let efiOrigin = null;

const setEfiJwt = data => jwt = data;
const getEfiJwt = () => jwt;

const setEfiOrigin = data => efiOrigin = data;
const getEfiOrigin = () => efiOrigin;

const setSaveFileBucketName = origin => {
  if (getSubdomain(origin) === 'prod') bucketName = 'uploads.elucidate.co';
  else bucketName = 'efi-uploads-staging';
}
const getSaveFileBucketName = () => bucketName;

export { setEfiJwt, getEfiJwt, setSaveFileBucketName, getSaveFileBucketName, setEfiOrigin, getEfiOrigin };


function getSubdomain(url) {
  if (url.includes('localhost')) return 'local'

  var regex = /^https?:\/\/efi(\.(.+))?\.elucidate\.co$/;
  var match = regex.exec(url);
  var env = match && match[2] ? match[2] : 'prod';
  return env;
}