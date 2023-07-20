import clientPromise from '../../../lib/mongodb';
import Papa from 'papaparse';
import { Storage } from '@google-cloud/storage';
import crypto from 'crypto';
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

function generateRandomString () {
  return crypto.randomBytes(10).toString('base64').replace(/[=/+]/g, '');
}
export default async function downloadFile(req, res) {
  switch (req.method) {
    case 'GET':
      if (!req.query?.bucketName) {
        return res.status(400).json({ error: 'bucketName is missing' });
      }
      if (!req.query?.fileName) {
        return res.status(400).json({ error: 'fileName is missing' });
      }
      if (!req?.query?.collectionName) {
        return res.status(400).json({ error: 'collectionName is missing' });
      }

      const client = await clientPromise;
      const db = client.db(process.env.DATABASE_NAME | 'yobulk');
      const storage = new Storage();
      const bucketName = req.query.bucketName;
      const fileName = req.query.fileName;
      const bucketFileDestination = `tmp/${generateRandomString()}/${fileName}`
      const file = storage.bucket(bucketName).file(bucketFileDestination);

      let uploadError = null;
      try {
        let count = 0;
        let collection = await db.collection(req.query.collectionName);
        var stream = await collection
          .find({})
          .project({ _id: 0, validationData: 0, _corrections: 0, _old: 0 })
          .stream();
        let header = true;
        const csvStream = file.createWriteStream({ resumable: false });

        stream.on('data', async function (data) {
          let columnsHeaders = Object.keys(data);

          if (uploadError) return;

          if (header) {
            header = false;
            count++;
            let csvDataFirstRow = await Papa.unparse(new Array(data), {
              header: true,
              columns: columnsHeaders,
              newline: '\r\n',
            });

            csvStream.write(csvDataFirstRow);
          }
          else {
            var csvData = await Papa.unparse(new Array(data), {
              header: false,
              columns: columnsHeaders,
              newline: '\r\n',
            });
            csvData = '\r\n' + csvData;
            count++;
            csvStream.write(csvData);
          }
        });

        stream.on('end', function (err) {
          if (err || uploadError) {
            const errorMessage = err ? err.message : uploadError.message;
            console.error('stream on end error', errorMessage);
            return res.status(500).json({ error: errorMessage });
          }
          res.status(200).json({
            success: `CSV file has been uploaded to ${bucketName}/${bucketFileDestination}`,
            filePath: '/' + bucketFileDestination
          });
          csvStream.end();
        });

        stream.on('error', (err) => {
          console.error('upload file to bucket: collection stream error: ', err);
          return res.status(500).json({ error: err.toString() });
        });
      }
      catch (err) {
        return res.status(500).json({ error: err.message });
      }
      break;
  }
}
