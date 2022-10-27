export interface ExternalAuthenticatedAPIPort {
  authenticate: () => Promise<void>;
}

export interface ExternalRestAPIClientPort<DataType, ResultType, FileType> {
  sendGet?: (endpoint?: string) => Promise<unknown>;
  sendPost?: (endpoint: string, data: DataType, files?: FileType[]) => Promise<ResultType>;
  sendPut?: (endpoint: string, data: DataType, files?: FileType[]) => Promise<ResultType>;
  sendPatch?: (endpoint: string, data: DataType, files?: FileType[]) => Promise<ResultType>;
  sendDelete?: (endpoint: string, data?: DataType) => Promise<ResultType>;
}

export interface ExternalResourcePort<T> {
  getValue(resourceName: string): Promise<T>;
}

export interface ExternalRandomResourcePort<T> {
  getRandomValue(): Promise<T>;
}
