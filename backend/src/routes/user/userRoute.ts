import bcrypt from 'bcrypt';
import { Request, Response, Router } from 'express';
import { check } from 'express-validator';
import { ObjectId } from 'mongodb';
import mongoose, { CallbackError, MongooseError } from 'mongoose';

import config from '../../../config';
import { userRouteLogger } from '../../../logger-init';
import MenuModel, { ImenuSchema } from '../../models/menuModel';
import UserModel, {
  IorderSchema,
  IsauceSchema, IUserSchema
} from '../../models/userModel';
import UserSettingsModel, {
  IUserSettings,
  Runners
} from '../../models/userSettingsModel';
import { permissionIDTranslator } from '../../tools/tools';
import { getUserRank } from '../admin/adminTools';
import { AUTH } from '../auth/authToken';
import PERMS from '../auth/checkPerms';

const router = Router();

//Getting all users
router.get('/', AUTH, PERMS.ADMIN, async (req: Request, res: Response) => {
  var rank = (await getUserRank(req.body._id));
  var userFilter = req.body.isEditor && !req.body.filter ? {} : { rank: rank };

  UserModel.find(userFilter).select(['-password', '-username', '-curr_refreshToken'])
    .then((data: Array<IUserSchema> | undefined) => {
      if (!data || data.length === 0) {
        userRouteLogger.warn('Error while finding users');
        return res.status(200).jsonp({
          access: true,
          error: 'No users found',
          res: { rank: rank },
        });
      }
      //Override permissionID with ActualRanks
      data.forEach(
        (element) =>
        (element.permissionID = permissionIDTranslator(
          element.permissionID,
          config
        ))
      );

      userRouteLogger.debug('sending users to client with status 200');
      res.status(200).jsonp({ access: true, res: data });
    }).catch((err: MongooseError) => {

        userRouteLogger.error('Error while finding users', { stack: err });
        return res.status(400).jsonp({
          access: false,
          error: err,
          res: 'Error while finding users',
        });
      }
    )
});

//Get Userdata
router.get('/data', [AUTH, PERMS.USER], async (req: Request, res: Response) => {
  UserModel.findById(req.body._id).select(['-password', '-curr_refreshToken']).then((data) => {

    if (!data) {
      userRouteLogger.warn('No users found');
      return res.status(200).jsonp({
        access: true,
        error: 'No users found',
        res: [],
      });
    }

    //Override permissionID with ActualRanks
    data.permissionID = permissionIDTranslator(data.permissionID, config);

    userRouteLogger.debug('sending userdata to client with status 200');
    res.status(200).jsonp({ access: true, res: data });
  }).catch((err: MongooseError, ) => {
      userRouteLogger.error('Error while finding users', { stack: err });
      return res.status(400).jsonp({
        access: false,
        error: err,
        res: 'Error while finding users',
      });
    }
  );
});

router.get(
  '/isOrdered',
  [AUTH, PERMS.USER],
  async (req: Request, res: Response) => {
    const rank = await getUserRank(req.body._id);

    UserSettingsModel.findOne({ rank: rank }).select('ordered').then((mongores: { ordered: mongoose.Types.ObjectId[], _id: mongoose.Types.ObjectId } | null) => {

      if (!mongores?.ordered) {
        userRouteLogger.warn('No usersettings found');
        return res.status(200).jsonp({
          access: true,
          error: 'No usersettings found',
          res: [],
        });
      }

      userRouteLogger.debug(
        "sending 'isOrdered'-Array to client with status 200"
      );

      return res.status(200).jsonp({
        access: true,
        res: mongores.ordered,
      });
    }).catch((err: MongooseError) => {
      userRouteLogger.error('Error while finding usersettings', {
        stack: err,
      });
      return res.status(500).jsonp({
        access: false,
        error: 'Error while finding usersettings',
        res: 'Error while finding usersettings',
      });
    });
  }
);

router.get('/runner', AUTH, PERMS.USER, async (req: Request, res: Response) => {
  const rank = await getUserRank(req.body._id);

  UserModel.find({ rank: rank }).select(['forename', 'surname']).then(
    (data: Array<IUserSchema>) => {
      if (!data) {
        userRouteLogger.warn('No users found');
        return res.status(200).jsonp({
          access: true,
          error: 'No users found',
          res: [],
        });
      }

      UserSettingsModel.findOne({ rank: rank }).then((mongores: IUserSettings | null) => {
        if (!mongores) {
          userRouteLogger.warn('No usersettings found');
          return res.status(200).jsonp({
            access: true,
            error: 'No usersettings found',
            res: { rank: rank },
          });
        }

        const filteredRunners: Runners | undefined = mongores.runners.find(
          (item) => item.siteID.toString() === req.headers.siteid
        );

        userRouteLogger.debug('sending runner to client with status 200');
        return res.status(200).jsonp({
          access: true,
          res: {
            lastrunnerID: filteredRunners?.lastrunnerID,
            lastrunner: filteredRunners?.lastrunner,
            runnerID: filteredRunners?.runnerID,
            runner: filteredRunners?.runner,
            users: data,
          },
        });
      }).catch((UserSettingsError: MongooseError) => {
        userRouteLogger.error('Error while finding usersettings', {
          stack: UserSettingsError,
        });
        return res.status(500).jsonp({
          access: false,
          error: UserSettingsError,
          res: 'Error while finding usersettings',
        });
      });
    }
  ).catch((UserModelError: MongooseError) => {
    userRouteLogger.error('Error while finding users', {
      stack: UserModelError,
    });
    return res.status(400).jsonp({
      access: false,
      error: UserModelError,
      res: 'Error while finding users',
    });
  })
});

router.get(
  '/runnerinfo',
  AUTH,
  PERMS.USER,
  async (req: Request, res: Response) => {
    const rank = await getUserRank(req.body._id);

    const runner = (await UserSettingsModel.findOne<{ _id: mongoose.Types.ObjectId, runners: Runners[] }>({
      rank: rank,
      'runners.siteID': new ObjectId(req.headers.siteid as string),
    }).select('runners'))?.runners[0];

    const order = await UserModel.find<{ _id: mongoose.Types.ObjectId, order: IorderSchema[] }>({
      rank: rank,
      order: { $ne: [] },
      'order.siteID': req.headers.siteid,
    }).select('order');

    const breadcount = order.flatMap(item => item.order.flat(1)).reduce((acc, item) => acc + item.quantity, 0);

    userRouteLogger.debug(
      `${order.length} orders, with ${breadcount} items for rank ${rank} found!`
    );


    userRouteLogger.debug(
      'sending runnerdetails with status 200'
    );
    return res.status(200).jsonp({
      access: true,
      res: {
        isRunner: runner?.runnerID === req.body._id,
        ordercount: order.length,
        breadcount: breadcount,
      },
    });
  }
);

router.get('/orders', [AUTH, PERMS.USER], (req: Request, res: Response) => {
  UserModel.find(
    { _id: req.body._id }).then((data: Array<IUserSchema>) => {
      userRouteLogger.debug('sending user-orders with status 200');
      //TODO: What if data doesnt exists? Optional
      res.status(200).jsonp({ access: true, res: data[0].order });
    }).catch((err: MongooseError,) => {
      userRouteLogger.error('Error while finding users', {
        stack: err,
      });
      return res.status(500).jsonp({
        access: true,
        error: err,
        res: 'Error while finding orders',
      });
    }
    );
});

//TODO change to delete
router.put(
  '/deleteorder',
  [AUTH, check('order_id').notEmpty(), PERMS.VALIDATE],
  (req: Request, res: Response) => {
    UserModel.updateOne(
      {
        _id: req.body._id,
        order: { $elemMatch: { _id: req.body.order_id } },
      },
      {
        $pull: { order: { _id: req.body.order_id } },
      }).then((mongores) => {
        userRouteLogger.debug(`order ${req.body.order_id} deleted`);
        res.json({
          access: true,
          res: `${req.body.order_id} deleted`,
        });
      }).catch((err: CallbackError) => {
        userRouteLogger.error('Error while finding users', {
          stack: err,
        });
        return res.status(500).jsonp({
          access: true,
          error: err,
          res: 'Error while finding orders',
        });
      }
      );
  }
);

router.put(
  '/pwreset',
  [AUTH, PERMS.USER, check('password').isStrongPassword(), PERMS.VALIDATE],
  async (req: Request, res: Response) => {
    const hashedpw = await bcrypt.hash(req.body.password, 10);

    UserModel.findByIdAndUpdate(req.body._id, { password: hashedpw }).then((mongores) => {
      userRouteLogger.info(`password of ${req.body._id} changed`);
      return res.status(200).jsonp({
        access: true,
        res: 'password changed',
      });
    }).catch(
      (err: CallbackError) => {
        userRouteLogger.error('Error while finding users', {
          stack: err,
        });
        return res.status(500).jsonp({
          access: true,
          error: err,
          res: 'Error while finding orders',
        });
      }
    );
  }
);

router.post(
  '/runner',
  [AUTH, PERMS.USER, check('siteid').isMongoId(), PERMS.VALIDATE],
  async (req: Request, res: Response) => {
    const user: IUserSchema | null = await UserModel.findById({
      _id: req.body._id,
    }).select(['rank', '_id', 'forename', 'surname']);

    if (!user) {
      userRouteLogger.error('UserID not found');
      return res.status(404).jsonp({
        access: true,
        error: 'UserID not found',
        res: 'UserID not found',
      });
    }

    const userSettings: {
      _id: mongoose.Types.ObjectId;
      runners: Runners[];
    } | null = await UserSettingsModel.findOne(
      {
        rank: user.rank,
      },
      'runners'
    );

    if (!userSettings) {
      userRouteLogger.info(
        'No usersettings found! creating new with current user!'
      );

      const newsettings = new UserSettingsModel({
        rank: user.rank,
        ordered: [],
        runners: [
          {
            //TODO: check if siteID exists
            siteID: new mongoose.Types.ObjectId(req.headers.siteid as string),
            runner: `${user.forename} ${user.surname}`,
            runnerID: user._id,
            lastrunner: '',
            lastrunnerID: '',
          },
        ],
      });

      newsettings.save().then((res) => {
        userRouteLogger.info('New usersettings saved! sending status 200');
      });

      return res.status(200).jsonp({
        access: true,
        res: 'Du bist jetzt der Runner',
      });
    }

    if (userSettings.runners.length === 0) {
      UserSettingsModel.updateOne(
        {
          rank: user.rank,
        },
        {
          $set: {
            runners: [
              {
                //TODO: check if siteID exists
                siteID: new mongoose.Types.ObjectId(
                  req.headers.siteid as string
                ),
                runner: `${user.forename} ${user.surname}`,
                runnerID: user._id,
                lastrunner: '',
                lastrunnerID: '',
              },
            ],
          },
        }).catch(
          (UserSettingsError: CallbackError) => {
            if (UserSettingsError) {
              userRouteLogger.error('Error while updating usersettings', {
                stack: UserSettingsError,
              });
              return res.status(500).jsonp({
                access: false,
                error: UserSettingsError,
                res: 'Error while updating usersettings',
              });
            }

            userRouteLogger.debug(
              `Found new runner (${user._id})! sending status 200`
            );
            return res.status(200).jsonp({
              access: true,
              res: 'Du bist jetzt der Runner',
            });
          }
        );
    } else {
      UserSettingsModel.updateOne(
        {
          rank: user.rank,
          'runners.siteID': new mongoose.Types.ObjectId(
            req.headers.siteid as string
          ),
        },
        {
          $set: {
            'runners.$.runnerID': user._id,
            'runners.$.runner': `${user.forename} ${user.surname}`,
          },
        }).then((mongores) => {
          userRouteLogger.debug(
            `Found new runner (${user._id})! sending status 200`
          );
          return res.status(200).jsonp({
            access: true,
            res: 'Du bist jetzt der Runner',
          });
        }).catch((UserSettingsError: CallbackError) => {

          userRouteLogger.error('Error while updating usersettings', {
            stack: UserSettingsError,
          });
          return res.status(500).jsonp({
            access: false,
            error: UserSettingsError,
            res: 'Error while updating usersettings',
          });
        }
        );
    }
  }
);

router.post(
  '/orderlist',
  [
    AUTH,
    check('siteid').isLength({ min: 4 }),
    check('_id').isLength({ min: 10 }),
    check('order.comment').exists().isLength({ max: 30 }),
    check('order.ketchup')
      .toFloat()
      .isFloat({ min: 0, max: 10 })
      .custom((value, { req }) => {
        if (!value) return true;

        if (value > req.body.order.quantity + 1) {
          throw new Error('Sauce cannot be greater than quantity');
        }
        return true;
      }),
    //check if sauce is min 0 and not greater that quantity
    check('order.mustard')
      .toFloat()
      .isFloat({ min: 0, max: 10 })
      .custom((value, { req }) => {
        if (!value) return true;

        if (value > req.body.order.quantity + 1) {
          throw new Error('Sauce cannot be greater than quantity');
        }
        return true;
      }),
    //check if sauce is min 0 and not greater that quantity
    check('order.sweetMustard')
      .toFloat()
      .isFloat({ min: 0, max: 10 })
      .custom((value, { req }) => {
        if (value > req.body.order.quantity + 1) {
          throw new Error('Sauce cannot be greater than quantity');
        }
        return true;
      }),
    //check if bread is min 1 and not greater that quantity
    check('order.quantity')
      .toFloat()
      .isFloat({ min: 1, max: 10 })
      .custom((value, { req }) => {
        if (value > req.body.order.quantity + 1) {
          throw new Error('Bread cannot be greater than quantity');
        }
        return true;
      }),
    check('order._id')
      .notEmpty()
      .custom((value) => {
        MenuModel.find(
          { _id: value }).then((data: Array<ImenuSchema>) => {
            if (data.length === 0) {
              throw new Error('Menu item not found');
            }
          }
          );

        return true;
      }),
    PERMS.VALIDATE,
  ],
  (req: Request, res: Response) => {
    const order: IorderSchema = req.body.order;

    if (!order.bread) order.bread = 'normal';

    const sauce: IsauceSchema = {
      ketchup: Number(req.body.order.ketchup) ?? 0,
      mustard: Number(req.body.order.mustard) ?? 0,
      sweetMustard: Number(req.body.order.sweetMustard) ?? 0,
    };

    const siteID = new mongoose.Types.ObjectId(req.headers.siteid as string);

    //Check if Item-ID exist in Menu
    const neworder: IorderSchema = {
      _id: `${order._id}-${order.bread}`,
      siteID: siteID,
      name: `${order.name}`,
      sauce: sauce,
      bread: order.bread,
      quantity: Number(order.quantity),
      //Removes empty strings
      //TODO: check if comment is in DB
      comment: order.comment.filter((comment) => comment),
    };

    UserModel.updateOne(
      {
        _id: req.body._id,
      },
      {
        $set: { 'order.$[elem]': neworder },
      },
      {
        arrayFilters: [
          {
            'elem._id': `${order._id}-${order.bread}`,
            'elem.siteID': siteID,
          },
        ],
      }).catch(
        (err: CallbackError) => {
          userRouteLogger.error('Error while finding users', {
            stack: err,
          });
          return res.status(500).jsonp({
            access: true,
            error: err,
            res: 'Error while finding orders',
          });
        }).then((mongores) => {
          //update type
          mongores = mongores as mongoose.mongo.UpdateResult

          //Wenn kein Element geupdated werden kann, dann erstelle ein neues
          if (mongores.modifiedCount == 0) {
            UserModel.updateOne(
              {
                _id: req.body._id,
                $or: [
                  {
                    'order._id': {
                      $nin: [`${order._id}-${order.bread}`],
                    },
                    // removed siteID : only one order possible
                    // 'order.siteID': {
                    //   $nin: [siteID],
                    // },
                  },
                ],
              },
              { $addToSet: { order: neworder } }).catch(
                (updateError: CallbackError) => {
                  userRouteLogger.error('Error while updating users', {
                    stack: updateError,
                  });
                  return res.status(500).jsonp({
                    access: true,
                    error: updateError,
                    res: 'Error while updating orders',
                  });
                }
              ).then((mongores) => {
                userRouteLogger.info(
                  `CREATED new order ${order._id}-${order.bread} with quantity ${order.quantity}! sending status 200`
                );

                res.status(200).jsonp({
                  access: true,
                  res: `${neworder.name} created`,
                });
              })
          } else {
            userRouteLogger.info(
              `UPDATED new order ${order._id}-${order.bread} with quantity ${order.quantity}! sending status 200`
            );

            res.status(200).jsonp({
              access: true,
              res: `${neworder.name} updated`,
            });
          }
        })

  }
);

export default router;
