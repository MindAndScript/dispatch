export type OperationMode = 'demo' | 'live';
export type DispatchType = 'pickup' | 'drop';

export interface EndpointDefinition {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT';
  defaultPath: string;
  configuredPath: string;
  description: string;
  requestSchema?: Record<string, unknown>;
  responseSchema: Record<string, unknown>;
}

export interface AppConfig {
  mode: OperationMode;
  baseUrl: string;
  authToken: string;
  activeDispatchType: DispatchType;
  endpoints: EndpointDefinition[];
  lastSaved?: string;
}
