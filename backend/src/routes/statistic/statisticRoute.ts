import { Router } from 'express';
import { logger } from '../../../logger-init';
import MenuModel, { IMenuSchema } from '../../models/menuModel';
import StatisticsSchema, { ISingleOrder, IStatistics } from '../../models/statisticModel';
import UserModel, { IUserSchema } from '../../models/userModel';
import { AUTH } from '../auth/authToken';
import PERMS from '../auth/checkPerms';

const router = Router();

interface OrdersMap {
   [rank: string]: ISingleOrder[];
}

router.get('/ordercount', AUTH, PERMS.EDITOR, async (req, res) => {
   const allStatistics = (await StatisticsSchema.find({
      date: {
         $gte: new Date(new Date().getFullYear(), 0, 1),
         $lt: new Date(new Date().getFullYear(), 12, 0)
      }
   }).sort({ date: -1 }).exec()) as IStatistics[];

   res.status(200).jsonp({
      success: true,
      res: (await STAT_OrderCount(allStatistics))
   });
});

router.get('/pricecount', AUTH, PERMS.EDITOR, async (req, res) => {
   const allStatistics = (await StatisticsSchema.find({}).sort({ date: -1 }).exec()) as IStatistics[];

   res.status(200).jsonp({
      success: true,
      res: (await STAT_PriceCount(allStatistics))
   });
});

router.post('/save', AUTH, PERMS.EDITOR, async (req, res) => {

   saveAllOrdersForToday().then((ordersMap) => {
      res.status(200).jsonp({
         success: true,
         res: ordersMap
      });
   }).catch((err) => {
      res.status(500).jsonp({
         success: false,
         res: err
      });
   });
});

export async function STAT_OrderCount(allStatistics: IStatistics[]) {

   /**
    * Map statistic into following format:
    * [
    *    {
    *       rank: "1 IT",
    *       names: [ "Pizza", "Pasta", "Salad", "Soup" ],
    *       counts: [ 5, 3, 76, 4]
    *    }
    * ]
    */
   const statisticsMap = new Map<string, { names: string[], counts: number[] }>();

   allStatistics.forEach((statistic) => {

      const { rank, orders } = statistic;

      if (!statisticsMap.has(rank)) statisticsMap.set(rank, { names: [], counts: [] });

      const { names, counts } = statisticsMap.get(rank) as { names: string[], counts: number[] };

      orders.forEach((order) => {

         const { name, count } = order;

         if (!names.includes(name)) {
            names.push(name);
            counts.push(count);
         } else {
            const index = names.indexOf(name);
            counts[index] += count;
         }
      });
   });

   const statistics = Array.from(statisticsMap.entries()).map(([rank, { names, counts }]) => {
      return {
         rank: rank,
         names: names,
         counts: counts
      };
   });

   return statistics;

}

export async function STAT_PriceCount(allStatistics: IStatistics[]) {
   /**
    * Map statistic into following format:
    * [
    *    {
    *       rank: "1 IT",
    *       names: [ "Pizza", "Pasta", "Salad", "Soup" ],
    *       prices: [ 40, 234, 52, 523]
    *    }
    * ]
    * 
    * // the prices are the sum of all order times the price of the menu item
    */

   const statisticsMap = new Map<string, { names: string[], prices: number[] }>();

   allStatistics.forEach((statistic) => {

      const { rank, orders } = statistic;

      if (!statisticsMap.has(rank)) statisticsMap.set(rank, { names: [], prices: [] });

      const { names, prices } = statisticsMap.get(rank) as { names: string[], prices: number[] };

      orders.forEach((order) => {

         const { name, count, price } = order;

         if (!names.includes(name)) {
            names.push(name);
            prices.push(count * price);
         } else {
            const index = names.indexOf(name);
            prices[index] += count * price;
         }
      });
   });

   const statistics = Array.from(statisticsMap.entries()).map(([rank, { names, prices }]) => {
      return {
         rank: rank,
         names: names,
         prices: prices
      };
   }
   );

   return statistics;
}

export async function saveAllOrdersForToday() {

   const usersWithOrders = (await UserModel.find({ order: { $exists: true, $not: { $size: 0 } } }).select(['-password', '-curr_refreshToken', '-permissionID']).sort({ rank: -1 }).exec()) as IUserSchema[];

   const allMenuItems = (await MenuModel.find({}).exec()) as IMenuSchema[];

   const ordersMap = new Map<string, ISingleOrder[]>(Object.entries(usersWithOrders.reduce((map, user) => {
      const { rank, order } = user;

      if (!map[rank]) map[rank] = [];

      map[rank].push(...order.map((order) => {
         const { quantity, _id } = order;

         if (!_id) throw new Error('Menu item not found');

         const menuItem = allMenuItems.find((menuitem) => menuitem._id.toString() === _id.split('-')[0]);

         if (!menuItem) throw new Error('Menu item not found');

         const { name, price } = menuItem;

         return {
            count: quantity,
            price: price,
            name: name
         };
      }));

      return map;
   }, {} as OrdersMap)));


   const today = new Date();

   ordersMap.forEach(async (orders, rank) => {

      const newStatistic = new StatisticsSchema({
         rank: rank,
         date: today,
         orders: orders
      });

      const doc = await newStatistic.save().catch((err) => logger.error(err));

      if (doc)
         logger.info(`Saved statistic for ${rank} on ${today}`)



   });

   return ordersMap;

}

export default router;