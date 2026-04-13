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
  externalReference?: string;
  cnjNumber: string;
  publicationDate: string;
  availabilityDate?: string;
  actType?: string;
  source: string;
  court?: string;
  judgingBody?: string;
  title: string;
  excerpt?: string;
  content: string;
  hasDeadlineHint?: boolean;
  rawPayload?: unknown;
};

export type PublicationSearchFilters = {
  cnjNumber: string;
  court?: string | null;
  judgingBody?: string | null;
  lawyerName?: string | null;
  lawyerOab?: string | null;
  publicationDateFrom?: string;
  publicationDateTo?: string;
  availabilityDateFrom?: string;
  availabilityDateTo?: string;
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
  fetchPublications(filters: PublicationSearchFilters): Promise<ExternalPublication[]>;
}
