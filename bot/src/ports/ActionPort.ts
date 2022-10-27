export interface ActionPort<Actions> {
  performAction: (action: Actions, data: unknown) => Promise<void>
}

export interface ActionEvent {
  action: string;
  data: unknown;
}
