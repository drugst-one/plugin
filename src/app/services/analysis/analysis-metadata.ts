import { IConfig } from 'src/app/config';

type NetworkSummary = {
  nodeCount: number;
  edgeCount: number;
};

function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

const ANALYSIS_CONFIG_KEYS: Array<keyof IConfig> = [
  'identifier',
  'label',
  'reviewed',
  'calculateProperties',
  'licensedDatasets',
  'interactionProteinProtein',
  'interactionDrugProtein',
  'indicationDrugDisorder',
  'associatedProteinDisorder',
  'autofillEdges',
  'overlayDirectedEdges',
  'physicsOn',
  'layoutOn',
];

const ADVANCED_SETTINGS_KEYS: Array<keyof IConfig> = [
  'identifier',
  'label',
  'reviewed',
  'approvedDrugs',
  'calculateProperties',
  'licensedDatasets',
  'interactionProteinProtein',
  'interactionDrugProtein',
  'indicationDrugDisorder',
  'associatedProteinDisorder',
  'customEdges',
  'autofillEdges',
  'selfReferences',
  'overlayDirectedEdges',
  'physicsOn',
  'layoutOn',
  'selectionMultiDrag',
  'nodeShadow',
  'edgeShadow',
];

function pickConfigFields(config: Partial<IConfig>, keys: Array<keyof IConfig>): Record<string, any> {
  return keys.reduce((result: Record<string, any>, key) => {
    const value = config[key];

    if (value === undefined) {
      return result;
    }

    result[key] = typeof value === 'object' && value !== null ? cloneDeep(value) : value;
    return result;
  }, {});
}

function summarizeConfig(config?: Partial<IConfig>): Record<string, any> | undefined {
  if (!config) {
    return undefined;
  }

  return pickConfigFields(config, ANALYSIS_CONFIG_KEYS);
}

export function summarizeAdvancedSettings(config?: Partial<IConfig>): Record<string, any> | undefined {
  if (!config) {
    return undefined;
  }

  return pickConfigFields(config, ADVANCED_SETTINGS_KEYS);
}

function summarizeInputNetwork(inputNetwork?: { nodes?: any[]; edges?: any[] }): NetworkSummary | undefined {
  if (!inputNetwork) {
    return undefined;
  }

  return {
    nodeCount: Array.isArray(inputNetwork.nodes) ? inputNetwork.nodes.length : 0,
    edgeCount: Array.isArray(inputNetwork.edges) ? inputNetwork.edges.length : 0,
  };
}

export function buildLoggableParameters(parameters?: Record<string, any>): Record<string, any> | undefined {
  if (!parameters) {
    return undefined;
  }

  const {
    config,
    input_network,
    inputNetwork,
    ...rest
  } = parameters;

  const loggableParameters: Record<string, any> = cloneDeep(rest);
  const summarizedNetwork = summarizeInputNetwork(input_network || inputNetwork);
  const summarizedConfig = summarizeConfig(config);

  if (summarizedNetwork) {
    loggableParameters.inputNetwork = summarizedNetwork;
  }

  if (summarizedConfig) {
    loggableParameters.config = summarizedConfig;
  }

  if (Array.isArray(loggableParameters.seeds)) {
    loggableParameters.seedCount = loggableParameters.seeds.length;
  }

  return loggableParameters;
}
