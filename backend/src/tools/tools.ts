import { randomBytes } from "crypto";

export function generateNewEditorKey(): any {
	return randomBytes(128).toString("hex");
}

export function permissionIDTranslator(ID: string, config: any) {
	switch (ID) {
		case config().PERMISSON_ADMIN:
			return "Admin";
		case config().PERMISSON_USER:
			return "User";
		case config().PERMISSON_EDITOR:
			return "Editor";
		default:
			return "";
	}
}
