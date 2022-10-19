export interface ExternalAuthenticatedAPIPort {
  authenticate: () => Promise<void>;
}
