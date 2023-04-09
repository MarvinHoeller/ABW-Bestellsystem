import mongoose from "mongoose";

export interface MenuAdditions {
	name: string;
	price: number;
}
export interface ISiteSettingsSchema {
	_id: mongoose.Types.ObjectId;
	length?: number;
	autoDeleteTime: string;
	autoDelete: boolean;
	emails: Array<string>;
	menuAdditions?: Array<{
		name: string;
		price: number;
	}>;
	usingEmails: boolean;
	emailhost: string;
	emailport: number;
	sitename: string;
	visible: boolean;
	isBreadSite: boolean;
}

const SiteSettingsSchema = new mongoose.Schema<ISiteSettingsSchema>({
	autoDeleteTime: {
		type: String,
	},
	sitename: {
		type: String,
	},
	visible: {
		type: Boolean,
		default: true,
	},
	isBreadSite: {
		type: Boolean,
	},
	usingEmails: {
		type: Boolean,
	},
	autoDelete: {
		type: Boolean,
	},
	emails: [
		{
			type: String,
		},
	],
	menuAdditions: [
		{
			name: { type: String },
			price: { type: Number },
		},
	],
	emailhost: {
		type: String,
	},
	emailport: {
		type: Number,
	}
});

export default mongoose.model<ISiteSettingsSchema>("sitesetting", SiteSettingsSchema);
