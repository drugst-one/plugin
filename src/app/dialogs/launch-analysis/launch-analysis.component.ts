import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {
  AnalysisService, BETWEENNESS_CENTRALITY, CLOSENESS_CENTRALITY,
  DEGREE_CENTRALITY,
  FIRSTNEIGHBOR,
  KEYPATHWAYMINER, LEIDENCLUSTERING, LOUVAINCLUSTERING, MAX_TASKS,
  MULTISTEINER, NETWORK_PROXIMITY,
  PATHWAYENRICHMENT,
  TRUSTRANK, algorithmNames
} from '../../services/analysis/analysis.service';
import {Algorithm, AlgorithmType, QuickAlgorithmType, Wrapper} from 'src/app/interfaces';
import {DrugstoneConfigService} from 'src/app/services/drugstone-config/drugstone-config.service';
import {NetworkHandlerService} from '../../services/network-handler/network-handler.service';
import { LoggerService } from 'src/app/services/logger/logger.service';

@Component({
  selector: 'app-launch-analysis',
  templateUrl: './launch-analysis.component.html',
  styleUrls: ['./launch-analysis.component.scss']
})
export class LaunchAnalysisComponent implements OnInit, OnChanges {

  constructor(public analysis: AnalysisService, public drugstoneConfig: DrugstoneConfigService, public networkHandler: NetworkHandlerService, public logger: LoggerService) {
  }

  @Input()
  public show = false;
  @Input()
  public target: 'drug' | 'drug-target' | 'gene' | 'clustering';
  @Output()
  public showChange = new EventEmitter<boolean>();
  @Output()
  public taskEvent = new EventEmitter<object>();

  public algorithm: AlgorithmType | QuickAlgorithmType;

  public algorithms: Array<Algorithm> = [];

  // Pathway enrichment parameters
  public alpha = 0.05;
  pathways = [
    { label: 'Reactome', selected: true },
    { label: 'KEGG', selected: true },
    { label: 'Wiki Pathways', selected: true }
  ];

  // Louvain/Leiden Clustering parameters
  public ignore_isolated: boolean = true;
  public seed: number | null = null;
  public max_nodes: number | null = null;
  public resolution_louvain: number = 1.0;


  // Trustrank Parameters
  public trustrankIncludeIndirectDrugs = false;
  public trustrankIncludeNonApprovedDrugs = false;
  public trustrankDampingFactor = 0.85;
  public trustrankMaxDeg = 0;
  public trustrankHubPenalty = 0.0;
  public trustrankResultSize = 20;
  public trustrankCustomEdges = this.drugstoneConfig.config.customEdges.default;

  // Closeness Parameters
  public closenessIncludeIndirectDrugs = false;
  public closenessIncludeNonApprovedDrugs = false;
  public closenessMaxDeg = 0;
  public closenessHubPenalty = 0.0;
  public closenessResultSize = 20;
  public closenessCustomEdges = this.drugstoneConfig.config.customEdges.default;

  // Degree Parameters
  public degreeIncludeNonApprovedDrugs = false;
  public degreeMaxDeg = 0;
  public degreeResultSize = 20;
  public degreeCustomEdges = this.drugstoneConfig.config.customEdges.default;

  // Network proximity
  public proximityIncludeNonApprovedDrugs = false;
  public proximityMaxDeg = 0;
  public proximityHubPenalty = 0.0;
  public proximityResultSize = 20;
  public proximityNumRandomSeedSets = 32;
  public proximityNumDrugTargetSets = 32;
  public proximityCustomEdges = this.drugstoneConfig.config.customEdges.default;

  // Betweenness Parameters
  public betweennessMaxDeg = 0;
  public betweennessHubPenalty = 0.0;
  public betweennessResultSize = 20;
  public betweennessCustomEdges = this.drugstoneConfig.config.customEdges.default;

  // Keypathwayminer Parameters
  public keypathwayminerK = 5;

  // Multisteiner Parameters
  public multisteinerNumTrees = 5;
  public multisteinerTolerance = 10;
  public multisteinerMaxDeg = 0;
  public multisteinerHubPenalty = 0.0;
  public multisteinerCustomEdges = this.drugstoneConfig.config.customEdges.default;

  public maxTasks = MAX_TASKS;

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.target === 'drug-target') {
      this.algorithms = [MULTISTEINER, KEYPATHWAYMINER, TRUSTRANK, CLOSENESS_CENTRALITY, DEGREE_CENTRALITY, BETWEENNESS_CENTRALITY, FIRSTNEIGHBOR];
    } else if (this.target === 'drug') {
      this.algorithms = [TRUSTRANK, CLOSENESS_CENTRALITY, DEGREE_CENTRALITY, NETWORK_PROXIMITY];
    } else if (this.target === 'gene') {
      this.algorithms = [PATHWAYENRICHMENT];
    }  else if (this.target === 'clustering') {
      this.algorithms = [LOUVAINCLUSTERING, LEIDENCLUSTERING];
    }
    else {
      // return because this.target === undefined
      return;
    }
    this.algorithms = this.algorithms.filter(algorithm => this.drugstoneConfig.config.algorithms[this.target].includes(algorithm.slug));
    // sanity check to fallback algorithm, trustrank works on all targets
    if (!this.algorithms.length) {
      this.algorithms = [TRUSTRANK];
    } else {
      this.algorithm = this.algorithms[0].slug;
    }
  }

  public close() {
    this.show = false;
    this.showChange.emit(this.show);
  }

  public isAnySelected(): boolean {
    return this.pathways.some(option => option.selected);
  }


  public async startTask() {
    const selection = this.analysis.getSelection();
    const groupCounts = selection.reduce((acc: Record<string, number>, node: Wrapper) => {
      const group = node.data._group;
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});
    const groupLog = Object.entries(groupCounts)
      .map(([group, count]) => `${count} in ${this.drugstoneConfig.currentConfig().nodeGroups[group].groupName}`)
      .join(', ');
    this.logger.logMessage(`Starting analysis with ${this.analysis.getSelection().length} seeds and algorithm ${algorithmNames[this.algorithm]} (${this.target}). Groups of Selection: ${groupLog}.`);
    // all nodes in selection have drugstoneId, hence exist in the backend
    const seeds = selection.map((item) => item.id);
    const seedsFiltered = seeds.filter(el => el != null);
        this.analysis.resetSelection();
    const parameters: any = {
      seeds: seedsFiltered,
      config: this.drugstoneConfig.currentConfig(),
      input_network: this.networkHandler.activeNetwork.getResetInputNetwork()
    };
    parameters.input_network.nodes.forEach(node => {
      if (node._group) {
        // @ts-ignore
        node.group = node._group;
      }
    });
    parameters.ppi_dataset = this.drugstoneConfig.config.interactionProteinProtein;
    parameters.pdi_dataset = this.drugstoneConfig.config.interactionDrugProtein;
    parameters.licenced = this.drugstoneConfig.config.licensedDatasets;
    switch (this.target) {
      case 'drug':
        parameters.target = 'drug';
        break;
      case 'gene':
        parameters.target = 'gene';
        break;
      case 'clustering':
        parameters.target = 'clustering';
        break;
      case 'drug-target':
        parameters.target = 'drug-target';
        break;
      default:
        parameters.target = 'drug-target';
        break;
    }
    // pass network data to reconstruct network in analysis result to connect non-proteins to results
    // drop interactions in nodes beforehand to no cause cyclic error, information is contained in edges
    // @ts-ignore
    this.networkHandler.activeNetwork.inputNetwork.nodes.forEach(node => {
      delete node.interactions;
    });

    if (this.algorithm === 'trustrank') {
      parameters.damping_factor = this.trustrankDampingFactor;
      parameters.include_indirect_drugs = this.trustrankIncludeIndirectDrugs;
      parameters.include_non_approved_drugs = this.trustrankIncludeNonApprovedDrugs;
      if (this.trustrankMaxDeg && this.trustrankMaxDeg > 0) {
        parameters.max_deg = this.trustrankMaxDeg;
      }
      parameters.hub_penalty = this.trustrankHubPenalty;
      parameters.result_size = this.trustrankResultSize;
      parameters.custom_edges = this.trustrankCustomEdges;
    } else if (this.algorithm === 'closeness') {
      parameters.include_indirect_drugs = this.closenessIncludeIndirectDrugs;
      parameters.include_non_approved_drugs = this.closenessIncludeNonApprovedDrugs;
      if (this.closenessMaxDeg && this.closenessMaxDeg > 0) {
        parameters.max_deg = this.closenessMaxDeg;
      }
      parameters.hub_penalty = this.closenessHubPenalty;
      parameters.result_size = this.closenessResultSize;
      parameters.custom_edges = this.closenessCustomEdges;
    } else if (this.algorithm === 'degree') {
      parameters.include_non_approved_drugs = this.degreeIncludeNonApprovedDrugs;
      if (this.degreeMaxDeg && this.degreeMaxDeg > 0) {
        parameters.max_deg = this.degreeMaxDeg;
      }
      parameters.result_size = this.degreeResultSize;
      parameters.custom_edges = this.degreeCustomEdges;
    } else if (this.algorithm === 'proximity') {
      parameters.include_non_approved_drugs = this.proximityIncludeNonApprovedDrugs;
      if (this.proximityMaxDeg && this.proximityMaxDeg > 0) {
        parameters.max_deg = this.proximityMaxDeg;
      }
      parameters.hub_penalty = this.proximityHubPenalty;
      parameters.result_size = this.proximityResultSize;
      parameters.custom_edges = this.proximityCustomEdges;
      parameters.num_random_seed_sets = this.proximityNumRandomSeedSets;
      parameters.num_random_drug_target_sets = this.proximityNumDrugTargetSets;
    } else if (this.algorithm === 'betweenness') {
      if (this.betweennessMaxDeg && this.betweennessMaxDeg > 0) {
        parameters.max_deg = this.betweennessMaxDeg;
      }
      parameters.hub_penalty = this.betweennessHubPenalty;
      parameters.result_size = this.betweennessResultSize;
      parameters.custom_edges = this.betweennessCustomEdges;
    } else if (this.algorithm === 'keypathwayminer') {
      parameters.k = this.keypathwayminerK;
    } else if (this.algorithm === 'multisteiner') {
      parameters.num_trees = this.multisteinerNumTrees;
      parameters.tolerance = this.multisteinerTolerance;
      if (this.multisteinerMaxDeg && this.multisteinerMaxDeg > 0) {
        parameters.max_deg = this.multisteinerMaxDeg;
      }
      parameters.hub_penalty = this.multisteinerHubPenalty;
      parameters.custom_edges = this.multisteinerCustomEdges;
    } else if (this.algorithm === 'pathway-enrichment') {
      parameters.alpha = this.alpha;
      parameters.kegg = this.pathways.find(pathway => pathway.label === 'KEGG').selected;
      parameters.reactome = this.pathways.find(pathway => pathway.label === 'Reactome').selected;
      parameters.wiki = this.pathways.find(pathway => pathway.label === 'Wiki Pathways').selected;
    } else if (this.algorithm === 'louvain-clustering'){
      parameters.ignore_isolated = this.ignore_isolated
      parameters.seed = this.seed
      parameters.resolution = this.resolution_louvain
    } else if (this.algorithm === 'leiden-clustering') {
      parameters.ignore_isolated = this.ignore_isolated
      parameters.seed = this.seed
      parameters.max_nodes = this.max_nodes !== null ? this.max_nodes : 0
    } else if (this.algorithm === 'first-neighbor'){
      // no parameters so far
    }
    const token = await this.analysis.startAnalysis(this.algorithm, this.target, parameters);
    const object = {taskId: token, algorithm: this.algorithm, target: this.target, params: parameters};
    this.taskEvent.emit(object);
  }

  onSeedChange(value: string): void {
    this.seed = value === '' ? null : parseInt(value, 10);
  }

  onMaxNodesChange(value: number): void {
    this.max_nodes = Number.isNaN(value) ? null : value;
  }

}
