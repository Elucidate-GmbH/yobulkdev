import Busboy from 'busboy';
import Papa from 'papaparse';
import { nameByRace } from 'fantasy-name-generator';
import { ObjectId } from 'mongodb';
import { Transform, pipeline } from 'stream';
import StreamToMongoDB from '../../../lib/mongostream';
import clientPromise from '../../../lib/mongodb';
import { dataValidate, transformer } from './dataValidate';
import { openCsvInputStream } from './papaStream';
import { ajvCompileCustomValidator } from '../../../lib/validation_util/yovalidator';

let taskId = null;

export const config = {
  api: {
    bodyParser: false
  }
};
// const papaOptions = {
//   worker: true,
//   header: true,
//   dynamicTyping: true,
//   skipEmptyLines: true,
// };
// const parseStream = Papa.parse(Papa.NODE_STREAM_INPUT, papaOptions);

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
    console.log('collectionName that will be created', collectionName);
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
      async function (fieldname, file) {
        const resp = await db.collection('tasks').insertOne({ status: 'queued' });
        taskId = resp.insertedId.toString();

        pipeline(
          file,
          openCsvInputStream,
          headers_changes,
          datatype_validate,
          dbClient.stream,
          async (err) => {
            if (err) console.log('Pipeline failed with an error:', err);
            else {
              console.log('~~~~~~~~~~~~pipeline finished', taskId);
              try {
                await db
                  .collection('tasks')
                  .updateOne(
                    { _id: ObjectId(taskId) },
                    { $set: { 'status': 'completed' } },
                    { upsert: false }
                  );
                console.log('Pipeline ended successfully');
              }
              catch (e) {
                console.log('error update task to completed');
              }
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
            .then((result, err) => console.log('file finished inserting in db'))
            .catch((err) => console.log('file on end error ', err))
        });
      }
    );
    busboy.on('close', async () => {
      resolve({ collection_name: collectionName, taskId });
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
