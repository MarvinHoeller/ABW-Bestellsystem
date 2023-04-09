import mongoose from "mongoose";

export interface ImenuSchema {
	_id: string;
	index: number;
	siteID: mongoose.Types.ObjectId;
	name: string;
	image: Buffer;
	infotext: string;
	price: number;
	length: number;
}

const menuSchema = new mongoose.Schema<ImenuSchema>({
	siteID: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
	},
	index: {
		type: Number,
	},
	name: {
		type: String,
		required: true,
	},
	image: {
		type: Buffer,
	},
	infotext: {
		type: String,
		default: "Keine Beschreibung vorhanden",
	},
	price: {
		type: Number,
		required: true,
	},
});

export default mongoose.model("menuitem", menuSchema);
