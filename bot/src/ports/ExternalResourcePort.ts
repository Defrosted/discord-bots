export interface ExternalResourcePort<T> {
  getValue(resourceName: string): Promise<T>;
}

export interface ExternalRandomResourcePort<T> {
  getRandomValue(): Promise<T>;
}
