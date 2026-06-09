import { IConfig } from 'src/app/config';

type NetworkSummary = {
  nodeCount: number;
  edgeCount: number;
};

function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function summarizeConfig(config?: Partial<IConfig>): Record<string, any> | undefined {
  if (!config) {
    return undefined;
  }

  return {
    identifier: config.identifier,
    label: config.label,
    reviewed: config.reviewed,
    calculateProperties: config.calculateProperties,
    licensedDatasets: config.licensedDatasets,
    interactionProteinProtein: config.interactionProteinProtein,
    interactionDrugProtein: config.interactionDrugProtein,
    indicationDrugDisorder: config.indicationDrugDisorder,
    associatedProteinDisorder: config.associatedProteinDisorder,
    autofillEdges: config.autofillEdges,
    overlayDirectedEdges: config.overlayDirectedEdges,
    physicsOn: config.physicsOn,
    layoutOn: config.layoutOn,
  };
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
