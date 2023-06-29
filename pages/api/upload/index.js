import Busboy from 'busboy';
import Papa from 'papaparse';
import { nameByRace } from 'fantasy-name-generator';
import { ObjectId } from 'mongodb';
import stream, { Transform, pipeline } from 'stream';
import StreamToMongoDB from '../../../lib/mongostream';
import clientPromise from '../../../lib/mongodb';
import { dataValidate, transformer } from './dataValidate';
import { openCsvInputStream } from './papaStream';
import { ajvCompileCustomValidator } from '../../../lib/validation_util/yovalidator';
import fs from 'fs';
import crypto from 'crypto';


const bucketDestination = `tmp/${generateRandomString()}/`
let bucketFilePath = null
let bucketName = null
function tempDiskFilePath (filename) {
  return `./tmpFiles/${filename}`;
}
function generateRandomString () {
  let ret = crypto.randomBytes(10).toString('base64').replace(/[=/+]/g, '');
  console.log('generateRandomString for bucket file', ret);
  return ret

}

async function saveFile (file, filename) {
  await new Promise(resolve => {
    if (!fs.existsSync('./tmpFiles')) {
      fs.mkdirSync('./tmpFiles', { recursive: true });
    }
    var fstream = fs.createWriteStream(tempDiskFilePath(filename));
    file.pipe(fstream);
    fstream.on('finish', async () => resolve())
  })
  await uploadFile(filename)
}

async function uploadFile(filename) {
  const { Storage } = require('@google-cloud/storage');
  const projectId = process.env.NEXT_PUBLIC_ELU_BUCKET_NAME;

  if (!projectId || !bucketName) {
    bucketFilePath = null
    await deleteTempFile(filename, 'uploade file 71')
    return console.log('GCS project id or bucket name was not provided')
  }
  const storage = new Storage({ projectId });
  try {
    console.log('before bucket storage', filename);
    await storage.bucket(bucketName).upload(tempDiskFilePath(filename), { destination: `${bucketDestination}${filename}` });
  }
  catch (e) {
    bucketFilePath = null
    await deleteTempFile(filename, 'upload file error')
    console.log('copy file to bucket error', e)
  }
}

async function deleteTempFile (filename, from) {
  console.log('deleteTempFile from ', from);
  fs.unlinkSync(tempDiskFilePath(filename));
}
export const config = {
  api: {
    bodyParser: false,
  },
};
const papaOptions = {
  worker: true,
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
};
const parseStream = Papa.parse(Papa.NODE_STREAM_INPUT, papaOptions);

const dbURL = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;

async function processUpload(req) {
  bucketName = req.query?.bucketName
  return new Promise(async (resolve, reject) => {
    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
      },
    });

    const collectionName = nameByRace('elf', { gender: 'female' });
    const client = await clientPromise;
    const dbConfig = { dbURL, collectionName, dbName, client, resolve, reject };
    const dbClient = new StreamToMongoDB(dbConfig);
    const db = client.db(process.env.DATABASE_NAME | 'yobulk');

    let results;
    console.log('req.headers.template_id', req.headers.template_id);
    try {
      results = await db.collection('templates').findOne({ _id: ObjectId(req.headers.template_id) });
      if (!results) {
        reject(new Error('No matching template found'));
        return;
      }
    } catch (err) {
      reject(err);
      return;
    }
    busboy.on(
      'file',
      async function (fieldname, file, filename, encoding, mimetype) {
        console.log('busboy on file, fieldname: ', fieldname, ' filename ', filename);
        bucketFilePath = '/' + bucketDestination + filename.filename
        await saveFile(file, filename.filename)
        console.log('saved file ', filename.filename, ' in ', bucketFilePath);
        const readableStream = fs.createReadStream(tempDiskFilePath(filename.filename));

        pipeline(
          readableStream,
          openCsvInputStream,
          headers_changes,
          datatype_validate,
          dbClient.stream,
          async (err) => {
            if (err) {
              console.log('Pipeline failed with an error:', err);
            } else {
              await deleteTempFile(filename.filename, 'where its supposed to')
              console.log('Pipeline ended successfully');
            }
          }
        );
        file.on('end', function () {
          console.log('file.on end');
          db.collection('templates')
            .updateOne(
              { _id: ObjectId(req.headers.template_id) },
              { $set: { collection_name: collectionName } },
              { upsert: true }
            )
            .then((result, err) => {
              resolve({ collection_name: collectionName, filePath: bucketFilePath });
            })
            .catch((err) => {
              console.log(err);
              reject({ collection_name: collectionName, filePath: bucketFilePath });
            });
        });
      }
    );
    busboy.on('close', () => {
      console.log('busboy on close');
      resolve({ collection_name: collectionName, filePath: bucketFilePath });
    });
    busboy.on('error', function(err) {
      console.log('Error in busboy:', err);
    });

    var headers_changes = new Transform({
      readableObjectMode: true,
      writableObjectMode: true,
    });
    headers_changes._transform = async function (data, enc, cb) {
      var newdata = await transformer({
        data,
        transformArrSchema: results.columns,
      });
      headers_changes.push(newdata);
      cb();
    };
    var datatype_validate = new Transform({
      readableObjectMode: true,
      writableObjectMode: true,
    });
    let ajv = ajvCompileCustomValidator({ template: results });
    datatype_validate._transform = function (data, enc, cb) {
      var newdata = dataValidate({ data, colSchema: results, ajv });
      datatype_validate.push(newdata);
      cb();
    };
    req.pipe(busboy);
  });
}

export default async function csvUploadHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const returnValue = await processUpload(req);
  console.log('~~~~~return value~~~~~', returnValue);
  res.status(200).end(JSON.stringify(returnValue));
}
