export type ExternalMovement = {
  externalId?: string;
  date: string;
  title: string;
  description: string;
  code?: string;
  rawPayload?: unknown;
};

export type ExternalPublication = {
  externalId?: string;
  date: string;
  source: string;
  title: string;
  content: string;
  hasDeadlineHint?: boolean;
  rawPayload?: unknown;
};

export type ExternalProcessSnapshot = {
  cnjNumber: string;
  court: string;
  className: string;
  subject: string;
  judgingBody: string;
  externalReference?: string;
  parties: Array<{
    name: string;
    role: string;
    document?: string;
  }>;
  movements: ExternalMovement[];
  publications: ExternalPublication[];
};

export interface ProcessDataConnector {
  key: string;
  supportsLiveData: boolean;
  fetchProcessByCNJ(cnjNumber: string): Promise<ExternalProcessSnapshot | null>;
}

export interface PublicationConnector {
  key: string;
  supportsLiveData: boolean;
  fetchPublicationsByCNJ(cnjNumber: string): Promise<ExternalPublication[]>;
}
