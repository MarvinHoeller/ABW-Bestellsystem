import UserModel from '../../models/userModel';
import schedule from 'node-schedule';
import SiteSettingsModel, {
  ISiteSettingsSchema,
} from '../../models/siteSettingsModel';
import TokenModel from '../../models/tokenModel';
import UserSettingsModel from '../../models/userSettingsModel';
import mongoose, { Types } from 'mongoose';
import { ObjectId } from 'mongodb';
import { editorRouteLogger } from '../../../logger-init';
interface IJob {
  _id: mongoose.Types.ObjectId;
  task?: schedule.Job;
  isRunning: boolean;
  hour: number;
  minute: number;
}

class Job {
  job: IJob[] | undefined;

  constructor() {
    //Get Settings from DB
    this.job = [];
    this.getSettingsFromDB();
  }

  private async getSettingsFromDB() {
    const settings: ISiteSettingsSchema[] = await SiteSettingsModel.find({});

    if (!Array.isArray(settings)) return;

    settings.forEach((setting) => {
      const runtime = setting.autoDeleteTime.split(':');

      this.job?.push({
        _id: setting._id,
        isRunning: setting.autoDelete,
        hour: Number(runtime[0]),
        minute: Number(runtime[1]),
      });

      if (!setting._id) return;

      if (setting.autoDeleteTime) {
        this.setNewHourAndMinute(setting.autoDeleteTime, setting._id);
      }
      if (setting.autoDelete) {
        this.startAutoDelete(setting._id);
      }
    });
  }

  private getJob(siteID: Types.ObjectId) {
    if (this.job) return this.job.find((job) => siteID.equals(job._id));
  }

  //cancel Job
  cancelAutoDelete(siteID: Types.ObjectId) {
    const curr_job = this.getJob(siteID);

    if (!curr_job) return;

    schedule.cancelJob(curr_job.task ?? '');
    curr_job.isRunning = false;
    editorRouteLogger.debug(`Job ${siteID.toString()} canceled`);
  }

  //set new hour and minute
  setNewHourAndMinute(time: string, siteID: Types.ObjectId) {
    const timeArray = time.split(':');
    const curr_job = this.getJob(siteID);

    if (!curr_job) return;

    curr_job.hour = parseInt(timeArray[0]);
    curr_job.minute = parseInt(timeArray[1]);
  }

  startAutoDelete(siteID: Types.ObjectId) {
    const curr_job = this.getJob(siteID);

    if (!curr_job) return;

    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [0, new schedule.Range(0, 7)];
    rule.hour = curr_job.hour;
    rule.minute = curr_job.minute;

    if (curr_job.isRunning) {
      this.cancelAutoDelete(siteID);
    }

    const time =
      `${rule.hour}`.padStart(2, '0') + ':' + `${rule.minute}`.padStart(2, '0');

    editorRouteLogger.info(
      `Delete-Job for ${curr_job._id} will run at ${time}`
    );

    curr_job.task = schedule.scheduleJob(
      rule,
      async function (currentTask: IJob) {
        editorRouteLogger.info(
          '------------------------------- Delete-Job started -------------------------------'
        );

        editorRouteLogger.info(
          `Autodelete all userOrders of siteID ${currentTask._id}`
        );
        await UserModel.updateMany(
          {},
          {
            $pull: {
              order: {
                siteID: {
                  $in: [currentTask._id],
                },
              },
            },
          }
        )
          .then((result) => {
            editorRouteLogger.info(`${result.modifiedCount} user(s) updated`);
          })
          .catch((err) => {
            editorRouteLogger.error('Failed to delete userOrders!', {
              stack: err,
            });
          });

        editorRouteLogger.info('Autodelete all new user that are 3 days old');

        const threeDays = new Date().getTime() - 3 * 24 * 60 * 60 * 1000;

        await UserModel.deleteMany({
          accountAdded: {
            $lt: threeDays,
          },
          new: true,
        })
          .then((result) => {
            editorRouteLogger.info(`${result.deletedCount} user(s) deleted`);
          })
          .catch((err) => {
            editorRouteLogger.error(`Failed to delete 'new' users!`, {
              stack: err,
            });
          });

        editorRouteLogger.info('Autodelete all Tokens that are 1 day old');

        // Delete all tokens that are older than 1 day
        const oneDay = new Date().getTime() - 24 * 60 * 60 * 1000;

        await TokenModel.deleteMany({
          activeSince: {
            $lt: oneDay,
          },
        })
          .then((result) => {
            editorRouteLogger.info(`${result.deletedCount} token(s) deleted`);
          })
          .catch((err) => {
            editorRouteLogger.error(`Failed to delete Tokens!`, { stack: err });
          });

        editorRouteLogger.info('Resetting orderstatus');

        await UserSettingsModel.updateMany(
          {
            ordered: { $ne: [] },
          },
          { $pull: { 'ordered': curr_job._id } }
        ).then((result) => {
          editorRouteLogger.info(
            `${result.modifiedCount} UserSetting(s) updated`
          );
        });

        editorRouteLogger.info(
          'Adding + 1 to all current runners runnercount!'
        );

        await UserSettingsModel.find({})
          .select('runners')
          .then(async (result) => {
            const runners = result
              .flatMap((user) =>
                user.runners.flatMap((runner) => runner.runnerID)
              )
              // remove empty strings
              .filter((n) => n != '');

            await UserModel.updateMany(
              {
                _id: { $in: runners },
              },
              { $inc: { runnercount: 1 } }
            ).then((result) => {
              editorRouteLogger.info(
                `${result.modifiedCount} UserSetting(s) updated`
              );
            });
          })
          .catch((err) => {
            editorRouteLogger.error(`Failed to update runnercount!`, {
              stack: err,
            });
          });

        editorRouteLogger.info(
          'Autodelete all current runners & resetting orderstatus'
        );

        await UserSettingsModel.updateMany({}, [
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
                                  currentTask._id, // some id
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
        ])
          .then((result) => {
            editorRouteLogger.info(`${result.modifiedCount} runner(s) updated`);
          })
          .catch((err) => {
            editorRouteLogger.error(`Failed to reset runners & orderstatus`, {
              stack: err,
            });
          });

        editorRouteLogger.info(
          '------------------------------- Delete-Job ended -------------------------------'
        );
      }.bind(null, curr_job)
    );
    curr_job.isRunning = true;
  }
}

export default new Job();
