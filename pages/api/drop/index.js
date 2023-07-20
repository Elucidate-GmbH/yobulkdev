import clientPromise from '../../../lib/mongodb';
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function dropCollection(req, res) {
  switch (req.method) {
    case 'GET':
      if (!req.query?.collectionName) {
        return res.status(400).json({ error: 'collection_name is missing' });
      }
      const client = await clientPromise;
      const db = client.db(process.env.DATABASE_NAME | 'yobulk');

      try {
        let collection = await db.collection(req.query.collectionName);
        await collection.drop();
        res.status(200).json({ 'success': 'collection dropped' });
      }
      catch (err) {
        console.log('catch err', err);
        return res.status(500).json({ error: err.message });
      }
      break;
  }
}
