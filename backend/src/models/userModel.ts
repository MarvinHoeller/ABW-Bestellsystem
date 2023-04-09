import mongoose from "mongoose";

export interface IsauceSchema {
	ketchup: number,
	mustard: number,
	sweetMustard: number
}

export interface IorderSchema {
	_id?: string;
	siteID: mongoose.Types.ObjectId
	name: string,
	sauce: IsauceSchema,
	bread: "normal" | "multigrain",
	quantity: number,
	comment: string[]
}

export interface IUserSchema {
	_id: mongoose.Types.ObjectId;
	new: boolean;
	accountAdded: Date;
	forename: string;
	surname: string;
	username: string;
	password: string;
	curr_refreshToken: string;
	permissionID: string,
	rank: '1. IT' | '2. IT' | '3. IT' | '1. EGS' | '2. EGS' | '3. EGS' | '4. EGS'
	runnercount: number;
	order: Array<IorderSchema>;
}

const userSchema = new mongoose.Schema<IUserSchema>({
	new: {
		type: Boolean,
	},
	accountAdded: {
		type: Date,
	},
	forename: {
		type: String,
		required: true,
	},
	surname: {
		type: String,
		required: true,
	},
	username: {
		type: String,
		required: true,
	},
	rank: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	curr_refreshToken: {
		type: String,
	},
	permissionID: {
		type: String
	},
	runnercount: {
		type: Number
	},
	order: [{
		//type: Array,
		_id: String,
		siteID: mongoose.Types.ObjectId,
		name: String,
		sauce: Object,
		bread: String,
		quantity: Number,
		comment: [String]
	}],
});

export default mongoose.model("user", userSchema);
