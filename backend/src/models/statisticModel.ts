import mongoose from "mongoose";

export interface ISingleOrder {
   count: number;
   price: number;
   name: string;
}

export interface IStatistics {
   _id: mongoose.Types.ObjectId;
   rank: string;
   date: Date;
   orders: ISingleOrder[]
}

const StatisticsSchema = new mongoose.Schema<IStatistics>({
   rank: {
      type: String,
      required: true
   },
   date: {
      type: Date,
      required: true
   },
   orders: [{
      count: {
         type: Number,
         required: true
      },
      price: {
         type: Number,
         required: true
      },
      name: {
         type: String,
         required: true
      }
   }]
});

export default mongoose.model<IStatistics>("statistic", StatisticsSchema);
