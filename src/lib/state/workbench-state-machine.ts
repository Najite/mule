/**
 * FININT Forensic Workbench State Machine
 *
 * Implements deterministic finite-state transitions adhering to the `state-machine` agent skill.
 * Prevents illegal concurrent modal displays, desynchronized loading flags, and boolean explosion.
 */

export type ModalState =
  | { type: 'NONE' }
  | { type: 'FINACLE'; payload: Record<string, unknown>; tab: 'envelope' | 'response' | 'json' }
  | { type: 'GOAML'; currentXml: string }
  | { type: 'GROQ_DOSSIER' }
  | { type: 'VERIFICATION'; tab: 'banking' | 'telemetry' }
  | { type: 'AUDIT_LEDGER' }
  | { type: 'INGEST'; tab: 'iso20022' | 'csv' };

export type IngestionStatus =
  | { status: 'idle' }
  | { status: 'parsing' }
  | { status: 'error'; message: string; actionableRecovery: string };

export type SynthesisStatus =
  | { status: 'idle' }
  | { status: 'synthesizing' }
  | { status: 'error'; message: string };

export type NfiuTransmissionStatus =
  | { status: 'idle' }
  | { status: 'transmitting' }
  | { status: 'submitted'; receiptId: string }
  | { status: 'error'; message: string };

export interface WorkbenchMachineState {
  modal: ModalState;
  isStreaming: boolean;
  ingestion: IngestionStatus;
  synthesis: SynthesisStatus;
  nfiu: NfiuTransmissionStatus;
  inspectorTab: 'ai' | 'metrics' | 'risk';
}

export type WorkbenchMachineAction =
  | { type: 'OPEN_MODAL_FINACLE'; payload: Record<string, unknown>; tab?: 'envelope' | 'response' | 'json' }
  | { type: 'SET_FINACLE_TAB'; tab: 'envelope' | 'response' | 'json' }
  | { type: 'OPEN_MODAL_GOAML'; xml: string }
  | { type: 'OPEN_MODAL_GROQ' }
  | { type: 'OPEN_MODAL_VERIFICATION'; tab?: 'banking' | 'telemetry' }
  | { type: 'OPEN_MODAL_AUDIT' }
  | { type: 'OPEN_MODAL_INGEST'; tab?: 'iso20022' | 'csv' }
  | { type: 'SET_INGEST_TAB'; tab: 'iso20022' | 'csv' }
  | { type: 'CLOSE_MODAL' }
  | { type: 'TOGGLE_STREAMING' }
  | { type: 'SET_STREAMING'; enabled: boolean }
  | { type: 'START_INGESTION' }
  | { type: 'INGESTION_SUCCESS' }
  | { type: 'INGESTION_ERROR'; message: string; actionableRecovery: string }
  | { type: 'CLEAR_INGESTION_ERROR' }
  | { type: 'START_SYNTHESIS' }
  | { type: 'SYNTHESIS_SUCCESS' }
  | { type: 'SYNTHESIS_ERROR'; message: string }
  | { type: 'START_NFIU_TRANSMISSION' }
  | { type: 'NFIU_TRANSMISSION_SUCCESS'; receiptId: string }
  | { type: 'NFIU_TRANSMISSION_ERROR'; message: string }
  | { type: 'SET_INSPECTOR_TAB'; tab: 'ai' | 'metrics' | 'risk' };

export const initialWorkbenchState: WorkbenchMachineState = {
  modal: { type: 'NONE' },
  isStreaming: false,
  ingestion: { status: 'idle' },
  synthesis: { status: 'idle' },
  nfiu: { status: 'idle' },
  inspectorTab: 'ai',
};

export function workbenchMachineReducer(
  state: WorkbenchMachineState,
  action: WorkbenchMachineAction
): WorkbenchMachineState {
  switch (action.type) {
    case 'OPEN_MODAL_FINACLE':
      return {
        ...state,
        modal: {
          type: 'FINACLE',
          payload: action.payload,
          tab: action.tab || 'envelope',
        },
      };

    case 'SET_FINACLE_TAB':
      if (state.modal.type !== 'FINACLE') return state;
      return {
        ...state,
        modal: { ...state.modal, tab: action.tab },
      };

    case 'OPEN_MODAL_GOAML':
      return {
        ...state,
        modal: { type: 'GOAML', currentXml: action.xml },
      };

    case 'OPEN_MODAL_GROQ':
      return {
        ...state,
        modal: { type: 'GROQ_DOSSIER' },
      };

    case 'OPEN_MODAL_VERIFICATION':
      return {
        ...state,
        modal: {
          type: 'VERIFICATION',
          tab: action.tab || 'banking',
        },
      };

    case 'OPEN_MODAL_AUDIT':
      return {
        ...state,
        modal: { type: 'AUDIT_LEDGER' },
      };

    case 'OPEN_MODAL_INGEST':
      return {
        ...state,
        modal: {
          type: 'INGEST',
          tab: action.tab || 'iso20022',
        },
        ingestion: { status: 'idle' },
      };

    case 'SET_INGEST_TAB':
      if (state.modal.type !== 'INGEST') return state;
      return {
        ...state,
        modal: { ...state.modal, tab: action.tab },
        ingestion: { status: 'idle' },
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        modal: { type: 'NONE' },
      };

    case 'TOGGLE_STREAMING':
      return {
        ...state,
        isStreaming: !state.isStreaming,
      };

    case 'SET_STREAMING':
      return {
        ...state,
        isStreaming: action.enabled,
      };

    case 'START_INGESTION':
      return {
        ...state,
        ingestion: { status: 'parsing' },
      };

    case 'INGESTION_SUCCESS':
      return {
        ...state,
        modal: { type: 'NONE' },
        ingestion: { status: 'idle' },
      };

    case 'INGESTION_ERROR':
      return {
        ...state,
        ingestion: {
          status: 'error',
          message: action.message,
          actionableRecovery: action.actionableRecovery,
        },
      };

    case 'CLEAR_INGESTION_ERROR':
      return {
        ...state,
        ingestion: { status: 'idle' },
      };

    case 'START_SYNTHESIS':
      return {
        ...state,
        synthesis: { status: 'synthesizing' },
      };

    case 'SYNTHESIS_SUCCESS':
      return {
        ...state,
        synthesis: { status: 'idle' },
        inspectorTab: 'ai',
      };

    case 'SYNTHESIS_ERROR':
      return {
        ...state,
        synthesis: { status: 'error', message: action.message },
      };

    case 'START_NFIU_TRANSMISSION':
      return {
        ...state,
        nfiu: { status: 'transmitting' },
      };

    case 'NFIU_TRANSMISSION_SUCCESS':
      return {
        ...state,
        nfiu: { status: 'submitted', receiptId: action.receiptId },
      };

    case 'NFIU_TRANSMISSION_ERROR':
      return {
        ...state,
        nfiu: { status: 'error', message: action.message },
      };

    case 'SET_INSPECTOR_TAB':
      return {
        ...state,
        inspectorTab: action.tab,
      };

    default:
      return state;
  }
}
