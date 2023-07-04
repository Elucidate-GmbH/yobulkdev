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


let _bucketFilePath = null
let _bucketName = null
let _fileName = null;
function tempDiskFilePath (filename) {
  return `./tmpFiles/${filename}`;
}
function generateRandomString () {
  return crypto.randomBytes(10).toString('base64').replace(/[=/+]/g, '');
}

async function saveFile (file, filename, _bucketDestination) {
  await new Promise(resolve => {
    if (!fs.existsSync('./tmpFiles')) {
      fs.mkdirSync('./tmpFiles', { recursive: true });
    }
    var fstream = fs.createWriteStream(tempDiskFilePath(filename));
    file.pipe(fstream);
    fstream.on('finish', async () => resolve());
  })
  await uploadFile(filename, _bucketDestination)
}

async function uploadFile(filename, _bucketDestination) {
  const { Storage } = require('@google-cloud/storage');
  const projectId = process.env.NEXT_PUBLIC_ELU_PROJECT_NAME;

  if (!projectId || !_bucketName) {
    _bucketFilePath = null
    await deleteTempFile(filename)
    return console.log('GCS project id or bucket name was not provided')
  }
  const storage = new Storage({ projectId });
  try {
    await storage.bucket(_bucketName).upload(tempDiskFilePath(filename), { destination: `${_bucketDestination}${filename}` });
  }
  catch (e) {
    _bucketFilePath = null
    await deleteTempFile(filename)
    console.log('copy file to bucket error', e)
  }
}

async function deleteTempFile (filename) {
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
const dbURL = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;

async function processUpload(req) {
  _bucketName = req.query?.bucketName;
  const _bucketDestination = `tmp/${generateRandomString()}/`
  _fileName = req.query?.fileName;

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
        _bucketFilePath = '/' + _bucketDestination + _fileName
        await saveFile(file, _fileName, _bucketDestination)
        console.log('saved file ', _fileName, ' in ', _bucketFilePath);
        const readableStream = fs.createReadStream(tempDiskFilePath(_fileName));

        pipeline(
          readableStream,
          openCsvInputStream,
          headers_changes,
          datatype_validate,
          dbClient.stream,
          async (err) => {
            if (err) console.log('Pipeline failed with an error:', err);
            else console.log('Pipeline ended successfully');
            await deleteTempFile(_fileName)
          }
        );
        file.on('end', function () {
          db.collection('templates')
            .updateOne(
              { _id: ObjectId(req.headers.template_id) },
              { $set: { collection_name: collectionName } },
              { upsert: true }
            )
            .then((result, err) => {
              resolve({ collection_name: collectionName, filePath: _bucketFilePath });
            })
            .catch((err) => {
              console.log('file on end error ', err);
              reject({ collection_name: collectionName, filePath: _bucketFilePath });
            });
        });
      }
    );
    busboy.on('close', () => {
      resolve({ collection_name: collectionName, filePath: _bucketFilePath });
    });
    busboy.on('error', err => console.log('Error in busboy:', err));

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
  res.status(200).end(JSON.stringify(returnValue));
}
