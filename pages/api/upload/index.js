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

async function saveFile (file, filename) {
  const filePath = './tmpFiles/' + filename
  var fstream = await fs.createWriteStream(filePath);
  file.pipe(fstream);
  fstream.on('finish', async function () {
    await uploadFile(filePath, filename)
  })
}

async function uploadFile(tempFilePath, filename) {
  const { Storage } = require('@google-cloud/storage');
  const projectId = process.env.NEXT_PUBLIC_ELU_BUCKET_NAME;
  const destBucketName = process.env.NEXT_PUBLIC_ELU_GCS_PROJECT_NAME;
  if (!projectId || !destBucketName) {
    return console.log('GCS project id or bucket name was not provided')
  }
  const storage = new Storage({ projectId });

  try {
    await storage.bucket(destBucketName).upload(tempFilePath, { destination: `yobulk/${filename}` });
    await deleteTempFile(tempFilePath)
  }
  catch (e) {
    console.log('copy file to bucket error', e)
  }
}

async function deleteTempFile (filePath) {
  fs.unlinkSync(filePath);
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

    db.collection('templates').findOne(
      { _id: ObjectId(req.headers.template_id) },
      function (err, results) {
        if (err) throw err;
        else {
          busboy.on(
            'file',
            async function (fieldname, file, filename, encoding, mimetype) {
              console.log('The file details are', filename, encoding, mimetype);
              await saveFile(file, filename.filename)

              pipeline(
                file,
                openCsvInputStream,
                headers_changes,
                datatype_validate,
                dbClient.stream,
                (err) => {
                  if (err) {
                    console.log('Pipeline failed with an error:', err);
                  } else {
                    console.log('Pipeline ended successfully');
                  }
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
                    console.log('---- collection name updateded ----');
                    //resolve(collectionName);
                  })
                  .catch((err) => {
                    console.log(err);
                    reject(collectionName);
                  });
              });
            }
          );
        }
        busboy.on('close', function () {
          console.log('---- Done parsing form! ----');
          // resolve(collectionName);
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
      }
    );
  });
}

export default async function csvUploadHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  const returnValue = await processUpload(req);
  res.status(200).end(JSON.stringify({ collection_name: returnValue }));
}
