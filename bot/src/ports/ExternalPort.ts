export interface ExternalAuthenticatedAPIPort {
  authenticate: () => Promise<void>;
}


export type ExternalAPIMethods = 'get' | 'post' | 'put' | 'patch' | 'delete';
export interface ExternalRestAPIClientPort<DataType, ResultType, FileType> {
  sendRequest: (method: ExternalAPIMethods, endpoint: string, data: DataType, files?: FileType[], authToken?: string) => Promise<ResultType>;
}

export interface ExternalResourcePort<T, ParamType = string> {
  getValue?(resource: ParamType): Promise<T | undefined>;
  getAllValues?(): Promise<T[]  | undefined>;
  putValue?(resource: ParamType): Promise<T  | undefined>
  deleteValue?(resource: ParamType): Promise<T  | undefined>
}

export interface ExternalRandomResourcePort<T> {
  getRandomValue(): Promise<T>;
}
