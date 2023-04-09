import mongoose from "mongoose";

export interface ITokenSchema {
	[x: string]: any;
      refreshToken: string
}

const TokenSchema = new mongoose.Schema({
      refreshToken: {
            type: String,
            required: true
      },
      activeSince: {
            type: Date,
            required: true
      },
})

export default mongoose.model("activetoken", TokenSchema)