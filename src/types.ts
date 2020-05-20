export interface IUser {
  id: string;
  name: string;
  color?: string;
  ignore?: boolean;
}

export interface IHost {
  hostname: string;
  chatId: string;
}
