import mongoose from "mongoose";

export interface IpdfSchema {
   rank: '1. IT' | '2. IT' | '3. IT' | '1. EGS' | '2. EGS' | '3. EGS' | '4. EGS'
	phone: string;
	pickUp: string;
	email: string;
	password: string;
}

const pdfSchema = new mongoose.Schema<IpdfSchema>({
   rank: {
		type: String
   },
	phone: {
		type: String
	},
	pickUp: {
		type: String
	},
	email: {
		type: String
	},
	password: {
		type: String
	},
});

export default mongoose.model<IpdfSchema>("pdfdata", pdfSchema);
