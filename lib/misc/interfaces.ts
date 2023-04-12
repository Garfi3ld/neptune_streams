export interface NeptuneStreamResponse {
  lastEventId: EventId;
  lastTrxTimestamp: number;
  format: string;
  records: Array<NeptuneStreamRecord>;
  totalRecords: number;
}

export interface NeptuneStreamRecord {
  commitTimestamp: number;
  eventId: EventId;
  data: {
    id: number;
    type: string;
    key: string;
    value: {
      value: string;
      dataType: string;
    };
    from?: string;
    to?: string;
  };
  op: string;
  isLastOp?: boolean;
}

export interface EventId {
  commitNum: number;
  opNum: number;
}

export interface StatusResponse {
  status: string;
  startTime: string;
  dbEngineVersion: string;
  role: string;
  dfeQueryEngine: string;
  gremlin: {
    version: string;
  };
  sparql: {
    version: string;
  };
  opencypher: {
    version: string;
  };
  labMode: {
    ObjectIndex: string;
    ReadWriteConflictDetection: string;
  };
  features: {
    ResultCache: {
      status: string;
    };
    IAMAuthentication: string;
    Streams: string;
    AuditLog: string;
  };
  settings: {
    clusterQueryTimeoutInMs: number;
  };
}

export interface LastUpdatedRecordItem {
  id: string;
  lastTrxTimestamp: number;
  commitNum: number;
  opNum: number;
}

export interface UpdateSummaryItem {
  lastTrxTimestamp: number;
  commitNum: number;
  opNum: number;
}

export interface StreamItemToSave {
  timestamp: number;
  operationSequence: number;
  commitNum: number;
  operation: string;
  data: string;
}
