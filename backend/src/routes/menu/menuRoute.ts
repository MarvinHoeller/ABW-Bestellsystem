import { Request, Response, Router } from 'express';
import { UploadedFile } from 'express-fileupload';
import { body } from 'express-validator';
import mongoose, { CallbackError } from 'mongoose';
import { menuRouteLogger } from '../../../logger-init';
import MenuModel, { ImenuSchema } from '../../models/menuModel';
import SiteSettingsModel from '../../models/siteSettingsModel';
import { AUTH } from '../auth/authToken';
import PERMS from '../auth/checkPerms';

const router = Router();

//Getting items from the menu with siteID or all items
router.get('/', AUTH, PERMS.USER, async (req: Request, res: Response) => {
  const siteID = req.headers.siteid ?? '';

  MenuModel.find(siteID.length > 0 ? { siteID: siteID } : {}).sort({index: 1}).then((data: ImenuSchema | ImenuSchema[]) => {
    menuRouteLogger.debug('Sending Menu with status 200');
    return res.status(200).jsonp({ access: true, res: data });
  }).catch((err: Error) => {
    menuRouteLogger.error('Error while finding Menu', { stack: err });
    return res.status(404).jsonp({
      access: true,
      error: 'Error while finding Menu',
      res: 'Error while finding Menu',
    });
  });
});

//Add new Item to menu
router.put(
  '/item',
  [
    AUTH, PERMS.EDITOR,
    body('name').exists(),
    body('price').exists(),
    PERMS.VALIDATE,
  ],
  async (req: Request, res: Response) => {
    if (!(await SiteSettingsModel.findById(req.headers.siteid))?._id) {
      menuRouteLogger.error(
        `requested Site ${req.headers.siteid} was deleted`
      );
      return res.status(404).jsonp({
        access: true,
        error: `requested Site ${req.headers.siteid} was deleted`,
        res: `requested Site ${req.headers.siteid} was deleted`,
      });
    }

    const { data } = req.files
      ? (req.files.image as UploadedFile)
      : { data: '' };

    const newitem = {
      name: req.body.name,
      siteID: new mongoose.Types.ObjectId(req.headers.siteid as string),
      price: Number(req.body.price),
      infotext: req.body.infotext,
      image: data,
    }

    MenuModel.updateOne({ _id: req.body.menuID, siteID: req.headers.siteid }, { $set: newitem }, { upsert: true }).then(() => {
      menuRouteLogger.info(`Menuitem ${req.body.name} upserted`);
      return res.jsonp({
        access: true,
        res: `Menuitem ${req.body.name} upserted`,
      });
    })
      .catch((err: Error) => {
        menuRouteLogger.error(`Could not save Menuitem ${req.body.name}`);
        res.status(500).jsonp({
          access: true,
          error: `Could not save Menuitem ${req.body.name}`,
          res: 'Error while saving',
        });
      });
  }
);

//Add new menuAddition
router.post(
  '/ingredient',
  [
    AUTH, PERMS.EDITOR,
    body('name').exists(),
    body('price').exists(),
    PERMS.VALIDATE,
  ],
  (req: Request, res: Response) => {
    SiteSettingsModel.findById(req.headers.siteid).catch(
      async (err: Error) => {
        menuRouteLogger.error('Error while finding SiteSettings', {
          stack: err,
        });
        return res.status(404).jsonp({
          access: true,
          error: 'Error while finding SiteSettings',
          res: 'Error while finding SiteSettings',
        });
      }).then((mongodata) => {

        SiteSettingsModel.findByIdAndUpdate(req.headers.siteid, {
          $addToSet: {
            menuAdditions: {
              name: req.body.name,
              price: req.body.price,
            },
          },
        })
          .then(() => {
            menuRouteLogger.info(`Menuitem ${req.body.name} added`);
            return res.status(200).jsonp({
              access: true,
              res: `Ingredient ${req.body.name} added`,
            });
          })
          .catch((SiteSettingError: Error) => {
            menuRouteLogger.error(`Could not update SiteSettings`, {
              stack: SiteSettingError,
            });
            res.status(500).jsonp({
              access: true,
              error: `Could not update SiteSettings`,
              res: 'Error while saving',
            });
          });
      }
      );
  }
);

router.delete(
  '/item',
  [AUTH, PERMS.EDITOR, body('menuID').isLength({ min: 5 }), PERMS.VALIDATE],
  (req: Request, res: Response) => {
    MenuModel.deleteOne(
      { _id: req.body.menuID, siteID: req.headers.siteid }).catch(
        (err: CallbackError) => {
          menuRouteLogger.error('Error while deleting MenuItem', {
            stack: err,
          });
          return res.status(500).jsonp({
            access: true,
            error: 'Error while deleting MenuItem',
            res: 'Error while deleting MenuItem',
          });
        }
      ).then((mongores) => {
        menuRouteLogger.info(`deleted MenuItem ${req.body.menuID}`);
        res.status(200).jsonp({
          access: true,
          res: `deleted MenuItem ${req.body.menuID}`,
        });
      });
  }
);

//Remove menuAddition
router.delete(
  '/ingredient',
  [AUTH, PERMS.EDITOR, body('ingredientID').isLength({ min: 5 }), PERMS.VALIDATE],
  (req: Request, res: Response) => {
    SiteSettingsModel.updateOne(
      { _id: req.headers.siteid },
      {
        $pull: { menuAdditions: { _id: req.body.ingredientID } },
      }).catch(
        (err: CallbackError) => {

          menuRouteLogger.error('Error while deleting MenuAddition', {
            stack: err,
          });
          return res.status(500).jsonp({
            access: true,
            error: 'Error while deleting MenuAddition',
            res: 'Error while deleting MenuAddition',
          });

        }
      ).then((mongores) => {
        menuRouteLogger.info(
          `deleted MenuAddition ${req.body.ingredientID}`
        );
        res
          .status(200)
          .jsonp({
            access: true,
            res: `deleted MenuAddition ${req.body.ingredientID}`,
          });

      });
  }
);

export default router;
