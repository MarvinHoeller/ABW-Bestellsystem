import { Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import { AUTH } from '../auth/authToken';
import mongoose, { MongooseError } from 'mongoose';
import { ObjectId } from 'mongodb';

import Job from '../editor/Scheduler';

import PERMS from "../auth/checkPerms";

import UserSettingsModel from '../../models/userSettingsModel';
import SiteSettingsModel, {
  ISiteSettingsSchema,
  MenuAdditions,
} from '../../models/siteSettingsModel';
import UserModel from '../../models/userModel';
import siteSettingsModel from '../../models/siteSettingsModel';
import MenuModel from '../../models/menuModel';
import { customPageLogger } from '../../../logger-init';

const router = Router();

//async Mongoose delete all UserOrders and return true if success
async function deleteAllUserOrders(siteID: string) {
  const { pass, result } = await UserModel.updateMany(
    {},
    {
      $pull: {
        order: {
          siteID: {
            $in: [new mongoose.Types.ObjectId(siteID)],
          },
        },
      },
    }
  )
    .then((result) => {
      return { result: result, pass: true }; //returns the result of the update
    })
    .catch((err) => {

      customPageLogger.error(`deleteAllUserOrders: ${err}`, {
        stack: err
      })

      return { result: err, pass: false }; //returns the error
    });

  customPageLogger.info(
    `deleteAllUserOrders: ${result.modifiedCount} document(s) updated`
  )

  return pass;
}

/* ------------------ Editor Settings ------------------ */

/**
 * Creates new Site
 */
router.post('/sites', [AUTH, PERMS.EDITOR], async (req: Request, res: Response) => {
  const site = <ISiteSettingsSchema>(
    await SiteSettingsModel.findOne({ sitename: req.body.name })
  );

  if (site)
    return res.status(400).jsonp({
      access: true,
      error: `Site "${req.body.name}" already exists`,
      res: `Site "${req.body.name}" already exists`,
    });

  const newSite = new SiteSettingsModel({
    autoDelete: false,
    autoDeleteTime: '00:00',
    emails: [],
    usingEmails: req.body.usingEmails,
    visible: req.body.visible,
    isBreadSite: req.body.isBreadSite,
    sitename: req.body.name,
  });

  newSite
    .save()
    .then(() => res.jsonp({ access: true, res: `${req.body.name} registered` }))
    .catch((err: any) => {
      customPageLogger.error(`Error while creating new Site: ${err}`, {
        stack: err
      })

      res.status(500).jsonp({
        access: true,
        error: err,
        res: err,
      });
    });
});

router.post(
  '/settings',
  [
    AUTH, PERMS.EDITOR,
    check('setting.autoDelete').optional().notEmpty(),
    check('setting.emails').optional().custom((emails: string[]) => {
      const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

      console.log(emails);

      // If no emails are provided, return true
      if (!emails) return true;
      if (emails.length === 0) return true;
      if (emails[0] === '') return true;

      for (const email of emails) {
        if (!emailRegex.test(email)) {
          throw new Error("Email is not valid")
        }
      }

      return true;
    }),
    PERMS.VALIDATE
  ],
  (req: Request, res: Response) => {

    let { setting } = req.body;
    let siteID: any = req.headers.siteid;

    if (!siteID) return;

    siteID = new mongoose.Types.ObjectId(siteID);

    SiteSettingsModel.findOneAndUpdate(
      { _id: siteID },
      { $set: setting },
      { upsert: true, new: true }).then((result) => {
        if (setting.autoDelete) {
          //check if autoDeleteTime is set
          if (setting.autoDeleteTime) {
            Job.setNewHourAndMinute(setting.autoDeleteTime, siteID);
          }

          Job.startAutoDelete(siteID);
        } else {
          Job.cancelAutoDelete(siteID);
        }

        res.status(200).jsonp({
          access: true,
          res: `settings refreshed and autodelte is ${setting.autoDelete}`,
        });
      }).catch((err) => { });
  }
);

/**
 * Gets all sites and optional only the visible ones
 */
router.get('/sites', [AUTH, PERMS.USER], async (req: Request, res: Response) => {
  const grepvisible = req.headers.all ? {} : { visible: true };

  SiteSettingsModel.find(grepvisible).select(['sitename', 'menuAdditions', 'isBreadSite', 'usingEmails']).then((sites: ISiteSettingsSchema[]) => {
    res.jsonp({ access: true, res: sites });
  }).catch((err) => {
    return res.status(500).jsonp({ access: true, error: err, res: 'Fehler' });
  });
});

/**
 * Gets the settings of the requested Page or all Pages
 *
 * @route POST api/editor/editItem
 *
 */
router.get('/settings', [AUTH, PERMS.EDITOR], (req: Request, res: Response) => {
  SiteSettingsModel.find(req.headers.siteid ? { _id: req.headers.siteid } : {}).select(['-tokens']).then((result) => {
    res.status(200).jsonp({ access: true, res: result });
  }).catch((err) => {
    return res
      .status(400)
      .jsonp({ access: true, error: err, res: "Fehler!" });
  });
});

//Get all Menu-Additions
router.get('/menuAddions', [AUTH, PERMS.USER], (req: Request, res: Response) => {
  SiteSettingsModel.find({ visible: true }).select('menuAdditions').then((data: Array<{ _id: any; menuAdditions?: Array<MenuAdditions> }>) => {
    res.status(200).jsonp({ access: true, res: data });
  }).catch((err) => {
    res.status(400).jsonp({
      access: true,
      error: err,
      res: 'Error while finding menuAddions',
    });
  });
});

// deleteUserOrders Route
router.delete(
  '/userorders',
  [AUTH, PERMS.EDITOR, check('siteID').isMongoId(), PERMS.VALIDATE],
  async (req: Request, res: Response) => {
    if (await deleteAllUserOrders(req.headers.siteid as string)) {
      res.status(200).jsonp({ access: true, res: 'All User Orders deleted' });
    } else {
      res.status(500).jsonp({
        access: true,
        error: 'Error while deleting User Orders',
        res: 'Error while deleting User Orders',
      });
    }
  }
);

router.delete(
  '/runners',
  [AUTH, PERMS.EDITOR, check('siteID').isMongoId(), PERMS.VALIDATE],
  async (req: Request, res: Response) => {

    const updateQuery = [
      {
        $set: {
          runners: {
            $map: {
              input: '$runners',
              in: {
                $mergeObjects: [
                  '$$this',
                  {
                    $cond: [
                      {
                        $and: [
                          {
                            $eq: [
                              '$$this.siteID',
                              new ObjectId(req.headers.siteid as string), // some id
                            ],
                          },
                          {
                            $ne: ['$$this.runner', ''],
                          },
                        ],
                      },
                      {
                        lastrunner: '$$this.runner',
                        lastrunnerID: '$$this.runnerID',
                        runner: '',
                        runnerID: '',
                      },
                      {},
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    ]

    await UserSettingsModel.updateMany({}, updateQuery)
      .then((result) => {
        customPageLogger.info(
          `deleteRunners: ${result.modifiedCount} document(s) modified`
        );

        return res.status(200).jsonp({ access: true, res: 'Current Runners deleted' });
      })
      .catch((err) => {
        return res.status(400).jsonp({
          access: true,
          res: 'Error while deleting current runners',
          error: 'Error while deleting current runners',
        });
      });
  }
);

/* Deleting a site. */
router.delete(
  '/site',
  [AUTH, PERMS.EDITOR, check('siteID').isMongoId(), PERMS.VALIDATE],
  async (req: Request, res: Response) => {
    const { pass, result, error } = await siteSettingsModel
      .deleteOne({
        _id: req.headers.siteid,
      })
      .then(async (settingresult) => {
        customPageLogger.info(
          `deleteSite: ${settingresult.deletedCount} document(s) deleted`
        );

        const menuresult = await MenuModel.deleteMany({ siteID: req.headers.siteid })

        customPageLogger.info(
          `deleteMenuItems: ${menuresult.deletedCount} document(s) deleted`
        );
        return { result: settingresult, pass: true, error: undefined }; //returns the result of the update
      })
      .catch((err) => {

        customPageLogger.error(
          `Error while deleting site: ${err}`, { stack: err }
        );

        return { result: err, pass: false, error: err }; //returns the error
      });

    return res.jsonp({
      access: true,
      res: { pass },
      error: error,
    });
  }
);

export default router;
