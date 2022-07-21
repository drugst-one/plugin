import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { algorithmNames, AnalysisService } from '../../services/analysis/analysis.service';
import {
  Drug,
  EdgeType,
  NodeAttributeMap,
  getDrugNodeId,
  getProteinNodeId,
  getWrapperFromNode,
  LegendContext,
  Node,
  Task,
  Tissue,
  Wrapper,
  NodeInteraction,
} from '../../interfaces';
import domtoimage from 'dom-to-image';
import { NetworkSettings } from '../../network-settings';
import { NetexControllerService } from 'src/app/services/netex-controller/netex-controller.service';
import { defaultConfig, IConfig } from 'src/app/config';
import { mapCustomEdge, mapCustomNode } from 'src/app/main-network';
import { downLoadFile, pieChartContextRenderer, removeDuplicateObjectsFromList } from 'src/app/utils';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';
import { NetworkHandlerService } from 'src/app/services/network-handler/network-handler.service';


declare var vis: any;

interface Scored {
  score: number;  // Normalized or unnormalized (whichever user selects, will be displayed in the table)
  rawScore: number;  // Unnormalized (kept to restore unnormalized value)
}

interface Seeded {
  isSeed: boolean;
}

interface Baited {
  closestViralProteins: string[];
  closestDistance: number;
}

@Component({
  selector: 'app-analysis-panel',
  templateUrl: './analysis-panel.component.html',
  styleUrls: ['./analysis-panel.component.scss'],
})
export class AnalysisPanelComponent implements OnInit, OnChanges, AfterViewInit {

  @ViewChild('networkWithLegend', { static: false }) networkWithLegendEl: ElementRef;
  @Input() token: string | null = null;
  @Input()
  public set config(config: IConfig | undefined) {
    if (typeof config === 'undefined') {
      return;
    }
    for (const key of Object.keys(config)) {
      this.myConfig[key] = config[key];
    }
  }
  @Output() tokenChange = new EventEmitter<string | null>();
  @Output() showDetailsChange = new EventEmitter<Wrapper>();
  @Output() visibleItems = new EventEmitter<[any[], [Node[], Tissue], NodeInteraction[]]>();
  public task: Task | null = null;
  public result: any = null;
  public myConfig: IConfig = JSON.parse(JSON.stringify(defaultConfig));

  public network: any;
  public nodeData: { nodes: any, edges: any } = { nodes: null, edges: null };
  private drugNodes: any[] = [];
  private drugEdges: any[] = [];
  public showDrugs = false;
  public tab: 'meta' | 'network' | 'table' = 'table';

  public adjacentDrugs = false;
  public adjacentDrugList: Node[] = [];
  public adjacentDrugEdgesList: Node[] = [];

  public adjacentDisordersProtein = false;
  public adjacentDisordersDrug = false;

  public adjacentProteinDisorderList: Node[] = [];
  public adjacentProteinDisorderEdgesList: Node[] = [];

  public adjacentDrugDisorderList: Node[] = [];
  public adjacentDrugDisorderEdgesList: Node[] = [];

  private proteins: any;
  public effects: any;

  public tableDrugs: Array<Drug & Scored & Baited> = [];
  public tableProteins: Array<Node & Scored & Seeded & Baited> = [];
  public tableSelectedProteins: Array<Node & Scored & Seeded & Baited> = [];
  public tableViralProteins: Array<Scored & Seeded> = [];
  public tableSelectedViralProteins: Array<Scored & Seeded> = [];
  public tableNormalize = false;
  public tableHasScores = false;

  public LegendContext: LegendContext = 'drugTarget';

  public expressionExpanded = false;
  public selectedTissue: Tissue | null = null;

  public algorithmNames = algorithmNames;

  public tableDrugScoreTooltip = '';
  public tableProteinScoreTooltip = '';

  public expressionMap: NodeAttributeMap;

  public legendContext: LegendContext = 'drug';

  constructor(public networkHandler: NetworkHandlerService, public drugstoneConfig: DrugstoneConfigService, private http: HttpClient, public analysis: AnalysisService, public netex: NetexControllerService) {
  }

  async ngOnInit() {
  }

  ngAfterViewInit() {
    this.networkHandler.setActiveNetwork('analysis');
  }

  async ngOnChanges(changes: SimpleChanges) {
    await this.refresh();
  }

  private async refresh() {
    if (this.token) {
      this.task = await this.getTask(this.token);
      this.analysis.switchSelection(this.token);

      if (this.task.info.algorithm === 'degree') {
        this.tableDrugScoreTooltip =
          'Normalized number of direct interactions of the drug with the seeds. ' +
          'The higher the score, the more relevant the drug.';
        this.tableProteinScoreTooltip =
          'Normalized number of direct interactions of the protein with the seeds. ' +
          'The higher the score, the more relevant the protein.';
      } else if (this.task.info.algorithm === 'closeness' || this.task.info.algorithm === 'quick' || this.task.info.algorithm === 'super') {
        this.tableDrugScoreTooltip =
          'Normalized inverse mean distance of the drug to the seeds. ' +
          'The higher the score, the more relevant the drug.';
        this.tableProteinScoreTooltip =
          'Normalized inverse mean distance of the protein to the seeds. ' +
          'The higher the score, the more relevant the protein.';
      } else if (this.task.info.algorithm === 'trustrank') {
        this.tableDrugScoreTooltip =
          'Amount of ‘trust’ on the drug at termination of the algorithm. ' +
          'The higher the score, the more relevant the drug.';
        this.tableProteinScoreTooltip =
          'Amount of ‘trust’ on the protein at termination of the algorithm. ' +
          'The higher the score, the more relevant the protein.';
      } else if (this.task.info.algorithm === 'proximity') {
        this.tableDrugScoreTooltip =
          'Empirical z-score of mean minimum distance between the drug’s targets and the seeds. ' +
          'The lower the score, the more relevant the drug.';
        this.tableProteinScoreTooltip =
          'Empirical z-score of mean minimum distance between the drug’s targets and the seeds. ' +
          'The lower the score, the more relevant the drug.';
      }

      if (this.task && this.task.info.done) {
        this.result = await this.netex.getTaskResult(this.token);
        console.log(this.result)
        const nodeAttributes = this.result.nodeAttributes || {};

        this.networkHandler.activeNetwork.seedMap = nodeAttributes.isSeed || {};

        // Reset
        this.nodeData = { nodes: null, edges: null };
        this.networkHandler.activeNetwork.networkEl.nativeElement.innerHTML = '';
        this.networkHandler.activeNetwork.networkInternal = null;
        this.showDrugs = false;

        // Create
        const { nodes, edges } = this.createNetwork(this.result);
        this.analysis.inputNetwork = { nodes: nodes, edges: edges };
        this.nodeData.nodes = new vis.DataSet(nodes);
        this.nodeData.edges = new vis.DataSet(edges);
        const container = this.networkHandler.activeNetwork.networkEl.nativeElement;
        const isBig = nodes.length > 100 || edges.length > 100;
        const options = NetworkSettings.getOptions(isBig ? 'analysis-big' : 'analysis', this.myConfig.physicsOn);
        this.drugstoneConfig.config.physicsOn = !isBig;

        this.networkHandler.activeNetwork.networkInternal = new vis.Network(container, this.nodeData, options);

        this.networkHandler.activeNetwork.networkInternal.on('stabilizationIterationsDone', () => {
          if (!this.drugstoneConfig.config.physicsOn) {
            this.networkHandler.activeNetwork.updatePhysicsEnabled(false);
          }
        });
        
        this.tableDrugs = nodes.filter(e => e.drugstoneId && e.drugstoneId.startsWith('d'));
        this.tableDrugs.forEach((r) => {
          r.rawScore = r.score;
        });

        this.tableProteins = nodes.filter(e => e.drugstoneId && e.drugstoneId.startsWith('p'));
        this.tableSelectedProteins = [];
        this.tableProteins.forEach((r) => {
          r.rawScore = r.score;
          r.isSeed = this.networkHandler.activeNetwork.seedMap[r.id];
          const wrapper = getWrapperFromNode(r);
          if (this.analysis.inSelection(wrapper)) {
            this.tableSelectedProteins.push(r);
          }
        });


        this.tableHasScores = ['trustrank', 'closeness', 'degree', 'proximity', 'betweenness', 'quick', 'super']
          .indexOf(this.task.info.algorithm) !== -1;
        if (this.tableHasScores) {
          if (this.task.info.algorithm !== 'proximity') {
            this.toggleNormalization(true);
          } else {
            this.toggleNormalization(false);
          }
        }

        this.networkHandler.activeNetwork.networkInternal.on('deselectNode', (properties) => {
          this.showDetailsChange.emit(null);
        });

        this.networkHandler.activeNetwork.networkInternal.on('doubleClick', (properties) => {
          const nodeIds: Array<string> = properties.nodes;
          if (nodeIds.length > 0) {
            const nodeId = nodeIds[0];
            const node = this.nodeData.nodes.get(nodeId);
            if (node.nodeType === 'drug' || node.drugstoneId === undefined || !node.drugstoneId.startsWith('p')) {
              return;
            }
            const wrapper = getWrapperFromNode(node);
            if (this.analysis.inSelection(wrapper)) {
              this.analysis.removeItems([wrapper]);
              this.analysis.getCount();
            } else {
              this.analysis.addItems([wrapper]);
              this.analysis.getCount();
            }
          }
        });

        this.networkHandler.activeNetwork.networkInternal.on('click', (properties) => {
          const selectedNodes = this.nodeData.nodes.get(properties.nodes);
          if (selectedNodes.length > 0) {
            this.showDetailsChange.emit(getWrapperFromNode(selectedNodes[0]));
          } else {
            this.showDetailsChange.emit(null);
          }
        });

        this.analysis.subscribeList((items, selected) => {
          // return if analysis panel is closed or no nodes are loaded
          if (!this.token) {
            return;
          }

          if (selected !== null) {
            const updatedNodes: Node[] = [];
            for (const item of items) {
              const node = this.nodeData.nodes.get(item.id);
              if (!node) {
                continue;
              }
              const pos = this.networkHandler.activeNetwork.networkInternal.getPositions([item.id]);
              node.x = pos[item.id].x;
              node.y = pos[item.id].y;
              const isSeed = this.networkHandler.activeNetwork.highlightSeeds ? this.networkHandler.activeNetwork.seedMap[node.id] : false;
              const nodeStyled = NetworkSettings.getNodeStyle(
                node,
                this.myConfig,
                isSeed,
                selected,
                this.networkHandler.activeNetwork.getGradient(item.id),
                this.networkHandler.activeNetwork.nodeRenderer
              )
              updatedNodes.push(nodeStyled);
            }
            this.nodeData.nodes.update(updatedNodes);

            const proteinSelection = this.tableSelectedProteins;
            const viralProteinSelection = this.tableSelectedViralProteins;
            for (const item of items) {
              // TODO: Refactor!
              const found = proteinSelection.findIndex((i) => getProteinNodeId(i) === item.id);
              const tableItem = this.tableProteins.find((i) => getProteinNodeId(i) === item.id);
              if (selected && found === -1 && tableItem) {
                proteinSelection.push(tableItem);
              }
              if (!selected && found !== -1 && tableItem) {
                proteinSelection.splice(found, 1);
              }
            }
            this.tableSelectedProteins = [...proteinSelection];
            this.tableSelectedViralProteins = [...viralProteinSelection];
          } else {
            // else: selected is null
            const updatedNodes = [];
            this.nodeData.nodes.forEach((node) => {
              // let drugType;
              // let drugInTrial;
              // if (node.drugstoneId && node.drugstoneId.startsWith('d')) {
              //   drugType = node.status;
              //   drugInTrial = node.inTrial;
              // }
              const isSeed = this.networkHandler.activeNetwork.highlightSeeds ? this.networkHandler.activeNetwork.seedMap[node.id] : false;
              const nodeStyled = NetworkSettings.getNodeStyle(
                node,
                this.myConfig,
                isSeed,
                selected,
                this.networkHandler.activeNetwork.getGradient(node.id),
                this.networkHandler.activeNetwork.nodeRenderer
              )
              updatedNodes.push(nodeStyled);
            });
            this.nodeData.nodes.update(updatedNodes);

            const proteinSelection = [];
            const viralProteinSelection = [];
            for (const item of items) {
              const tableItem = this.tableProteins.find((i) => getProteinNodeId(i) === item.id);
              if (tableItem) {
                proteinSelection.push(tableItem);
              }
            }
            this.tableSelectedProteins = [...proteinSelection];
            this.tableSelectedViralProteins = [...viralProteinSelection];
          }
        });
      }
    }
    this.emitVisibleItems(true);

    this.networkHandler.activeNetwork.setLegendContext();
  }

  public emitVisibleItems(on: boolean) {
    if (on) {
      this.visibleItems.emit([this.nodeData.nodes, [this.proteins, this.selectedTissue], this.nodeData.edges]);
    } else {
      this.visibleItems.emit(null);
    }
  }

  private async getTask(token: string): Promise<any> {
    return await this.http.get(`${environment.backend}task/?token=${token}`).toPromise();
  }

  close() {
    this.networkHandler.activeNetwork.gradientMap = {};
    this.expressionExpanded = false;
    this.expressionMap = undefined;
    this.networkHandler.activeNetwork.seedMap = {};
    this.networkHandler.activeNetwork.highlightSeeds = false;
    this.showDrugs = false;
    this.analysis.switchSelection('main');
    this.token = null;
    this.tokenChange.emit(this.token);
    this.analysis.inputNetwork = {};
    this.emitVisibleItems(false);
  }

  public toggleNormalization(normalize: boolean) {
    this.tableNormalize = normalize;

    const normalizeFn = (table) => {
      let max = 0;
      table.forEach(i => {
        if (i.rawScore > max) {
          max = i.rawScore;
        }
      });
      table.forEach(i => {
        i.score = i.rawScore / max;
      });
    };

    const unnormalizeFn = (table) => {
      table.forEach(i => {
        i.score = i.rawScore;
      });
    };

    if (normalize) {
      normalizeFn(this.tableDrugs);
      normalizeFn(this.tableProteins);
      normalizeFn(this.tableViralProteins);
    } else {
      unnormalizeFn(this.tableDrugs);
      unnormalizeFn(this.tableProteins);
      unnormalizeFn(this.tableViralProteins);
    }
  }

  public downloadLink(view: string): string {
    return `${environment.backend}task_result/?token=${this.token}&view=${view}&fmt=csv`;
  }

  public inferEdgeGroup(edge: object): EdgeType {
    if (edge['to'].startsWith('d')) {
      return 'protein-drug';
    }
    return 'protein-protein';
  }

  /**
   * Infers wrapper type of node returned from backend.
   * Node can only be either an input node from the user with a defined group,
   * a drug found in the backend with either user defined type or default drug group,
   * or an intermediate protein added by the shortest path to the found drug.
   * For the third case, fall back to a default case which can also be set by user.
   */
  public inferNodeGroup(wrapper: Wrapper): string {
    if (wrapper.data.group !== undefined) {
      return wrapper.data.group;
    } else if (wrapper.data.drugstoneId !== undefined && wrapper.data.drugstoneId.startsWith('d')) {
      return 'drug';
    } else if (wrapper.data.drugstoneId !== undefined && wrapper.data.drugstoneId.startsWith('p')) {
      return 'protein';
    }
  }

  public inferNodeLabel(config: IConfig, wrapper: Wrapper): string {
    if (wrapper.data.label) {
      return wrapper.data.label;
    }
    const identifier = config.identifier;
    if (identifier === 'uniprot') {
      return wrapper.data.uniprotAc;
    } else if (identifier === 'symbol') {
      return wrapper.data.symbol;
    } else if (identifier === 'ensg') {
      // heuristc to find most important ensg is to look for smallest id
      // parse ensg numbers to integers
      const ensg_numbers = wrapper.data.ensg.map(x => parseInt(x));
      // get index of smalles number
      const i = ensg_numbers.reduce((iMin, x, i, arr) => x < arr[iMin] ? i : iMin, 0);
      // return ensg-ID
      return wrapper.data.ensg[i];
    }
  }

  /**
   * Maps analysis result returned from database to valid Vis.js network input
   *
   * @param result
   * @returns
   */
  public createNetwork(result: any): { edges: any[], nodes: any[] } {
    const config = result.parameters.config;
    this.myConfig = config;

    const identifier = this.myConfig.identifier;

    // add drugGroup and foundNodesGroup for added nodes
    // these groups can be overwritten by the user
    const nodes = [];
    const edges = [];

    const attributes = result.nodeAttributes || {};

    this.proteins = [];
    this.effects = [];
    const network = result.network;

    const nodeTypes = attributes.nodeTypes || {};
    const isSeed = attributes.isSeed || {};
    const scores = attributes.scores || {};
    const details = attributes.details || {};

    for (const node of network.nodes) {
      // convert id to netex Id if exists
      const nodeDetails = details[node];

      nodeDetails.id = nodeDetails.id ? nodeDetails.id : nodeDetails.drugstoneId;
      if (nodeDetails.drugstoneId && nodeDetails.drugstoneId.startsWith('p')) {
        // node is protein from database, has been mapped on init to backend protein from backend
        // or was found during analysis
        nodeDetails.group = nodeDetails.group ? nodeDetails.group : 'foundNode';
        nodeDetails.label = nodeDetails.label ? nodeDetails.label : nodeDetails[identifier];
        this.proteins.push(nodeDetails);
      } else if (nodeDetails.drugstoneId && nodeDetails.drugstoneId.startsWith('d')) {
        // node is drug, was found during analysis
        nodeDetails.type = 'Drug';
        nodeDetails.group = 'foundDrug';
      } else {
        // node is custom input from user, could not be mapped to backend protein
        nodeDetails.group = nodeDetails.group ? nodeDetails.group : 'default';
        nodeDetails.label = nodeDetails.label ? nodeDetails.label : nodeDetails[identifier]
      }
      // further analysis and the button function can be used to highlight seeds
      // option to use scores[node] as gradient, but sccores are very small
      nodes.push(NetworkSettings.getNodeStyle(nodeDetails as Node, config, false, false, 1, this.networkHandler.activeNetwork.nodeRenderer))
    }

    // remove self-edges/loops
    if (!config.selfReferences) {
      network.edges = network.edges.filter(el => el.from !== el.to)
    }

    for (const edge of network.edges) {
      edges.push(mapCustomEdge(edge, this.myConfig));
    }
    return {
      nodes,
      edges,
    };
  }

  public tableProteinSelection = (e): void => {
    const oldSelection = [...this.tableSelectedProteins];
    this.tableSelectedProteins = e;
    const addItems = [];
    const removeItems = [];
    for (const i of this.tableSelectedProteins) {
      const wrapper = getWrapperFromNode(i);
      if (oldSelection.indexOf(i) === -1) {
        addItems.push(wrapper);
      }
    }
    for (const i of oldSelection) {
      const wrapper = getWrapperFromNode(i);
      if (this.tableSelectedProteins.indexOf(i) === -1) {
        removeItems.push(wrapper);
      }
    }
    this.analysis.addItems(addItems);
    this.analysis.removeItems(removeItems);
  }

  public previewStringArray(arr: string[], count: number): string {
    if (arr.length < count) {
      return arr.join(', ');
    } else {
      return arr.slice(0, count).join(', ') + `, ... (${arr.length})`;
    }
  }

  // public selectTissue(tissue: Tissue | null) {
  //   this.expressionExpanded = false;
  //   if (!tissue) {
  //     this.selectedTissue = null;
  //     const updatedNodes = [];
  //     for (const item of this.proteins) {
  //       if (item.drugstoneId === undefined) {
  //         // nodes that are not mapped to backend remain untouched
  //         continue;
  //       }
  //       const node: Node = this.nodeData.nodes.get(item.id);
  //       if (!node) {
  //         continue;
  //       }
  //       const pos = this.networkHandler.activeNetwork.networkInternal.getPositions([item.id]);
  //       node.x = pos[item.id].x;
  //       node.y = pos[item.id].y;
  //       const isSeed = this.highlightSeeds ? this.seedMap[node.id] : false;
  //       Object.assign(
  //         node,
  //         NetworkSettings.getNodeStyle(
  //           node,
  //           this.myConfig,
  //           isSeed,
  //           this.analysis.inSelection(getWrapperFromNode(item)),
  //           1.0
  //           )
  //       )
  //       updatedNodes.push(node);
  //     }
  //     this.nodeData.nodes.update(updatedNodes);
  //     // delete expression values
  //     this.expressionMap = undefined;
  //     this.gradientMap = {};
  //   } else {
  //     this.selectedTissue = tissue
  //     const minExp = 0.3;
  //     // filter out non-proteins, e.g. drugs
  //     const proteinNodes = [];
  //     this.nodeData.nodes.forEach(element => {
  //       if (element.id.startsWith('p') && element.drugstoneId !== undefined) {
  //         proteinNodes.push(element);
  //       }
  //     });
  //     this.netex.tissueExpressionGenes(this.selectedTissue, proteinNodes).subscribe((response) => {
  //       this.expressionMap = response;
  //       const updatedNodes = [];
  //       // mapping from netex IDs to network IDs, TODO check if this step is necessary
  //       const networkIdMappping = {}
  //       this.nodeData.nodes.forEach(element => {
  //         networkIdMappping[element.drugstoneId] = element.id
  //       });
  //       const maxExpr = Math.max(...Object.values(this.expressionMap));
  //       for (const [drugstoneId, expressionlvl] of Object.entries(this.expressionMap)) {
  //         const networkId = networkIdMappping[drugstoneId]
  //         const node = this.nodeData.nodes.get(networkId);
  //         if (node === null) {
  //           continue;
  //         }
  //         const wrapper = getWrapperFromNode(node)
  //         this.gradientMap[drugstoneId] = expressionlvl !== null ? (Math.pow(expressionlvl / maxExpr, 1 / 3) * (1 - minExp) + minExp) : -1;
  //         const pos = this.networkHandler.activeNetwork.networkInternal.getPositions([networkId]);
  //         node.x = pos[networkId].x;
  //         node.y = pos[networkId].y;
  //         const isSeed = this.highlightSeeds ? this.seedMap[node.id] : false;
  //         Object.assign(node,
  //           NetworkSettings.getNodeStyle(
  //             node,
  //             this.myConfig,
  //             isSeed,
  //             this.analysis.inSelection(wrapper),
  //             this.gradientMap[drugstoneId]));
  //         node.shape = 'custom';
  //         node.ctxRenderer = pieChartContextRenderer;
  //         updatedNodes.push(node);
  //       }
  //       this.nodeData.nodes.update(updatedNodes);
  //     })
  //   }
  // }
}
