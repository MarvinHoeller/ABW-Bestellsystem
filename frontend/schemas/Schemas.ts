export interface Site {
  _id: string;
  sitename: string;
  menuAdditions: [];
  usingEmails: boolean;
  isBreadSite: boolean;
}

export interface INotifySchema {
  _id: string;
  start: string;
  end: string;
  title: string;
  text: string;
  rank?: string;
}

export interface ResponseData {
  data: ResponseAxiosSchema;
}

export interface MenuAdditions {
  name: string;
  price: number;
  _id: string;
}

export interface NestedMenuAdditions {
  _id: string;
  menuAdditions: [
    | MenuAdditions
    | undefined
  ];
}

export interface ResponseAxiosSchema {
  access: boolean;
  error?: any;
  res: any;
}

export interface IpdfSchema {
  rank: '1. IT' | '2. IT' | '3. IT' | '1. EGS' | '2. EGS' | '3. EGS' | '4. EGS';
  phone: string;
  pickUp: string;
  email: string;
  password: string;
}

interface ImageBuffer {
  data: Buffer | string;
}

export interface IMenuSchema {
  _id: string;
  index: number;
  name: string;
  infotext: string;
  image: ImageBuffer;
  price: number;
  siteID: string;
  length: number;
}
export interface IMenuItem {
  _id?: string,
  name: string,
  price: number,
  infotext: string,
  image: Blob,
}

export interface ItokenSchema {
  [x: string]: any;
  refreshToken: string;
}

export interface IsauceSchema {
  ketchup: number;
  mustard: number;
  sweetMustard: number;
}

export interface IorderSchema {
  _id: string;
  name: string;
  sauce: IsauceSchema;
  bread: 'normal' | 'multigrain';
  quantity: number;
  comment: [string];
  siteID?: string;
}

export interface IuserSchema {
  _id: string;
  new: boolean;
  forename: string;
  surname: string;
  username: string;
  password: string;
  permissionID: string;
  rank: string;
  order: Array<IorderSchema>;
}

export interface Runners {
	siteID: string;
	runner: string;
	runnerID: string;
	lastrunner: string;
	lastrunnerID: string;
}

export interface loggedInUserSchema {
  _id: string;
  new: boolean;
  forename: string;
  surname: string;
  username: string;
  permissionID: string;
  rank: string;
  runnercount: number;
  order: Array<IorderSchema>;
}

export interface IPopup {
  show: boolean;
  onHide: any;
  onChange?: any;
  onSubmit: any;
}

export interface IOrderPopupData {
  _id?: string;
  name: string;
  infotext?: string;
  image?: ImageBuffer;
  price: number;
  quantity: number;
  sauce?: IsauceSchema;
  comment: string[];
}

export interface ISiteSettingsSchema {
	_id: string;
	length?: number;
	autoDeleteTime: string;
	autoDelete: boolean;
	emails: Array<string>;
	menuAdditions?: Array<MenuAdditions>;
	usingEmails: boolean;
	emailhost: string;
	emailport: number;
	sitename: string;
	visible: boolean;
	isBreadSite: boolean;
}