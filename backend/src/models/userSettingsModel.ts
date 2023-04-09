import mongoose from "mongoose";

export interface Runners {
	siteID: mongoose.Types.ObjectId;
	runner: string;
	runnerID: string;
	lastrunner: string;
	lastrunnerID: string;
}

export interface IUserSettings {
	_id?: mongoose.Types.ObjectId;
	rank: string;
	ordered: Array<mongoose.Types.ObjectId>;
	runners: Array<Runners>;
}

const UserSettingsSchema = new mongoose.Schema<IUserSettings>({
	rank: {
		type: String,
	},
	ordered: [
		{
			//SiteID
			type: mongoose.Types.ObjectId,
		},
	],
	runners: [
		{
			siteID: {
				type: mongoose.Types.ObjectId,
			},
			runner: {
				type: String,
			},
			runnerID: {
				type: String,
			},
			lastrunner: {
				type: String,
			},
			lastrunnerID: {
				type: String,
			},
		},
	],
});

export default mongoose.model("userSetting", UserSettingsSchema);
