import mongoose from 'mongoose';

export interface INotifySchema {
  start: Date;
  end: Date;
  title: string;
  text: string;
  rank?: string;
}

const notifySchema = new mongoose.Schema<INotifySchema>({
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  rank: {
    type: String,
  },
});

export default mongoose.model('notification', notifySchema);
