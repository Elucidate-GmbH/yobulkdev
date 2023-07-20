import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

var intervalId;
export default async function taskStatus(req, res) {
  const client = await clientPromise;
  const db = client.db(process.env.DATABASE_NAME | 'yobulk');

  switch (req.method) {
    case 'GET':
      if (!req.query.taskId) return res.status(400).json({ error: 'taskId is missing' });
      try {
        const taskStatus = await db.collection('tasks').findOne({ _id: ObjectId(req.query.taskId) });

        if (!taskStatus) {
          return res.status(404).json({ error: `Task with id ${req.query.taskId} not found` });
        }

        return res.status(200).json({ status: taskStatus?.status });
      }
      catch (err) {
        return res.status(500).json({ error: 'failed to load data' });
      }

    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}


