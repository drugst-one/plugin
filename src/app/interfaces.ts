export type NodeType = 'host' | 'virus' | 'drug';

export interface Protein {
  name: string;
  proteinAc: string;
  effects?: ViralProtein[];
  x?: number;
  y?: number;
}

export interface ViralProtein {
  effectId: string;
  effectName: string;
  virusName: string;
  datasetName: string;
  proteins?: Protein[];
  x?: number;
  y?: number;
}

export interface ProteinViralInteraction {
  effectName: string;
  virusName: string;
  datasetName: string;
  proteinAc: string;
}

export interface Task {
  token: string;
  info: {
    target: 'drug' | 'drug-target',
    algorithm: 'trustrank' | 'multisteiner' | 'keypathwayminer';
    parameters?: { [key: string]: any };

    workerId?: string;
    jobId?: string;

    progress: number;
    status: string;

    createdAt: string;
    startedAt: string;
    finishedAt: string;

    done: boolean;
    failed: boolean;
  };
  stats: {
    queuePosition: number;
    queueLength: number;
  };
}

export interface QueryItem {
  name: string;
  type: 'Host Protein' | 'Viral Protein' | 'Drug';
  data: Protein | ViralProtein | Drug;
}

export interface Drug {
  drugId: string;
  name: string;
  status: 'approved' | 'investigational';
}
