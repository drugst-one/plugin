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
import {HttpClient} from '@angular/common/http';
import {algorithmNames, AnalysisService} from '../../services/analysis/analysis.service';
import {
  Drug,
  NodeAttributeMap,
  getProteinNodeId,
  getWrapperFromNode,
  LegendContext,
  Node,
  Task,
  Tissue,
  Wrapper,
  NodeInteraction,
} from '../../interfaces';
import {NetworkSettings} from '../../network-settings';
import {NetexControllerService} from 'src/app/services/netex-controller/netex-controller.service';
import {mapCustomEdge, mapNetexEdge, ProteinNetwork} from 'src/app/main-network';
import {DrugstoneConfigService} from 'src/app/services/drugstone-config/drugstone-config.service';
import {NetworkHandlerService} from 'src/app/services/network-handler/network-handler.service';
import {LegendService} from 'src/app/services/legend-service/legend-service.service';
import {LoadingScreenService} from 'src/app/services/loading-screen/loading-screen.service';
import {version} from '../../../version';
import {downloadCSV} from 'src/app/utils';

declare var vis: any;

interface Scored {
  score: number;  // Normalized or unnormalized (whichever user selects, will be displayed in the table)
  rawScore: number;  // Unnormalized (kept to restore unnormalized value)
  rank: number;
}

interface Seeded {
  isSeed: boolean;
}


@Component({
  selector: 'app-analysis-panel',
  templateUrl: './analysis-panel.component.html',
  styleUrls: ['./analysis-panel.component.scss'],
})
export class AnalysisPanelComponent implements OnInit, OnChanges, AfterViewInit {

  @ViewChild('networkWithLegend', {static: false}) networkWithLegendEl: ElementRef;
  @Input() token: string | null = null;
  @Input() tokenType: string | null = null;


  @Output() tokenChange = new EventEmitter<string | null>();
  @Output() showDetailsChange = new EventEmitter<Wrapper>();
  @Output() setInputNetwork = new EventEmitter<any>();
  @Output() visibleItems = new EventEmitter<[any[], [Node[], Tissue], NodeInteraction[]]>();
  public task: Task | null = null;
  public result: any = null;

  public fullscreen = false;

  public algorithmDefault = undefined;

  public network: any;
  public nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};
  // private drugNodes: any[] = [];
  // private drugEdges: any[] = [];
  public tab: 'meta' | 'network' | 'table' = 'network';

  private proteins: any;
  public effects: any;

  public tableDrugs: Array<Drug & Scored> = [];
  public tableProteins: Array<Node & Scored & Seeded> = [];
  public tableSelectedProteins: Array<Node & Scored & Seeded> = [];
  public tableNormalize = false;
  public tableHasScores = false;

  public LegendContext: LegendContext = 'drugTarget';

  public expressionExpanded = false;
  public selectedTissue: Tissue | null = null;

  public algorithmNames = algorithmNames;

  public tableDrugScoreTooltip = '';
  public tableProteinScoreTooltip = '';

  public versionString = undefined;

  public expressionMap: NodeAttributeMap;

  public loading = false;

  constructor(public legendService: LegendService, public networkHandler: NetworkHandlerService, public drugstoneConfig: DrugstoneConfigService, private http: HttpClient, public analysis: AnalysisService, public netex: NetexControllerService, public loadingScreen: LoadingScreenService) {
    try {
      this.versionString = version;
    } catch (e) {
    }
  }

  async ngOnInit() {
  }

  ngAfterViewInit() {
    this.networkHandler.setActiveNetwork('analysis');
  }

  async ngOnChanges(changes: SimpleChanges) {
    await this.refresh();
  }

  @Output() resetEmitter: EventEmitter<boolean> = new EventEmitter();

  public reset() {
    this.networkHandler.activeNetwork.selectedTissue = null;
    this.close();
    this.resetEmitter.emit(true);
  }

  private rankTable(table: Array<Drug & Scored> | Array<Node & Scored & Seeded>) {
    let lastRank = 1;
    for (let idx = 0; idx < table.length; idx++) {
      if (idx === 0) {
        table[idx].rank = lastRank;
        continue;
      }
      if (table[idx].score !== table[idx - 1].score) {
        lastRank += 1;
      }
      table[idx].rank = lastRank;
    }
  }

  private async refreshView() {
    this.loading = true;
    this.loadingScreen.stateUpdate(true);
    this.getView(this.token).then(async view => {
      this.task = view;
      this.result = view;
      this.drugstoneConfig.set_analysisConfig(view.config);
      this.analysis.switchSelection(this.token);
      this.loadingScreen.stateUpdate(false);


      // Reset
      this.nodeData = {nodes: null, edges: null};
      // this.networkHandler.activeNetwork.networkEl.nativeElement.innerHTML = '';
      // this.networkHandler.activeNetwork.networkInternal = null;
      // Create+
      return new Promise<any>(async (resolve, reject) => {
        const nodes = view.network.nodes;
        let edges = view.network.edges;

        if (this.drugstoneConfig.config.autofillEdges && nodes.length) {
          const node_map = {};
          nodes.filter(n => n.drugstoneType === 'protein').forEach(node => {
            if (typeof node.drugstoneId === 'string') {
              if (node_map[node.drugstoneId]) {
                node_map[node.drugstoneId].push(node.id);
              } else {
                node_map[node.drugstoneId] = [node.id];
              }
            } else {
              node.drugstoneId.forEach(n => {
                if (node_map[n]) {
                  node_map[n].push(node.id);
                } else {
                  node_map[n] = [node.id];
                }
              });
            }
          });
          const netexEdges = await this.netex.fetchEdges(nodes, this.drugstoneConfig.config.interactionProteinProtein, this.drugstoneConfig.config.licensedDatasets);
          edges.push(...netexEdges.map(netexEdge => mapNetexEdge(netexEdge, this.drugstoneConfig.currentConfig(), node_map)).flatMap(e => e));
        }

        const edge_map = {};

        edges = edges.filter(edge => {
          if (edge_map[edge.to] && edge_map[edge.to].indexOf(edge.from) !== -1) {
            return false;
          }
          if (edge_map[edge.from] && edge_map[edge.from].indexOf(edge.to) !== -1) {
            return false;
          }
          if (!edge_map[edge.from]) {
            edge_map[edge.from] = [edge.to];
          } else {
            edge_map[edge.from].push(edge.to);
          }
          return true;
        });

        // @ts-ignore
        if (!this.drugstoneConfig.selfReferences) {
          edges = edges.filter(el => el.from !== el.to);
        }

        this.networkHandler.activeNetwork.inputNetwork = {nodes: nodes, edges: edges};
        this.nodeData.nodes = new vis.DataSet(nodes);
        this.nodeData.edges = new vis.DataSet(edges);
        const container = this.networkHandler.activeNetwork.networkEl.nativeElement;
        const isBig = nodes.length > 100 || edges.length > 100;
        const options = NetworkSettings.getOptions(isBig ? 'analysis-big' : 'analysis', this.drugstoneConfig.currentConfig());
        // @ts-ignore
        options.groups = this.drugstoneConfig.currentConfig().nodeGroups;
        // @ts-ignore
        for (const g of Object.values(options.groups)) {
          // @ts-ignore
          delete g.renderer;
        }
        if (this.drugstoneConfig.config.physicsOn) {
          this.drugstoneConfig.config.physicsOn = !isBig;
        }
        this.networkHandler.activeNetwork.networkInternal = new vis.Network(container, this.nodeData, options);

        if (isBig) {
          resolve(nodes);
        }
        this.networkHandler.activeNetwork.networkInternal.once('stabilizationIterationsDone', async () => {
          if (!this.drugstoneConfig.config.physicsOn || this.networkHandler.activeNetwork.isBig()) {
            this.networkHandler.activeNetwork.updatePhysicsEnabled(false);
          }
          this.networkHandler.updateAdjacentNodes(this.networkHandler.activeNetwork.isBig()).then(() => {
            resolve(nodes);
          });
        });
      }).then(() => {
        this.networkHandler.activeNetwork.networkInternal.on('dragEnd', (properties) => {
          const node_ids = this.networkHandler.activeNetwork.networkInternal.getSelectedNodes();
          if (node_ids.length === 0|| !this.networkHandler.shiftDown) {
            return;
          }
          this.analysis.addNodesByIdsToSelection(node_ids);
          this.networkHandler.activeNetwork.networkInternal.unselectAll();
        });
        this.networkHandler.activeNetwork.networkInternal.on('deselectNode', (properties) => {
          this.showDetailsChange.emit(null);
        });
        this.networkHandler.activeNetwork.networkInternal.on('doubleClick', (properties) => {
          const nodeIds: Array<string> = properties.nodes;
          if (nodeIds.length > 0) {
            const nodeId = nodeIds[0];
            const node = this.nodeData.nodes.get(nodeId);
            if (node.drugstoneId === undefined || node.nodeType === 'drug' || node.drugstoneType !== 'protein') {
              this.analysis.unmappedNodeToast();
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
          if (properties.nodes.length === 0 && properties.edges.length === 1) {
            // clicked on one edge
            const edgeId = properties.edges[0];
            this.networkHandler.activeNetwork.openEdgeSummary(edgeId);
          } else {
            this.networkHandler.activeNetwork.activeEdge = null;
            const selectedNodes = this.nodeData.nodes.get(properties.nodes);
            if (selectedNodes.length > 0) {
              this.showDetailsChange.emit(getWrapperFromNode(selectedNodes[0]));
            } else {
              this.showDetailsChange.emit(null);
            }
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
                this.drugstoneConfig.currentConfig(),
                isSeed,
                selected,
                this.networkHandler.activeNetwork.getGradient(item.id),
                this.networkHandler.activeNetwork.nodeRenderer
              );
              updatedNodes.push(nodeStyled);
            }
            this.nodeData.nodes.update(updatedNodes);

            const proteinSelection = this.tableSelectedProteins;
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
          } else {
            // else: selected is null
            const updatedNodes = [];
            this.nodeData.nodes.forEach((node) => {
              const isSeed = this.networkHandler.activeNetwork.highlightSeeds ? this.networkHandler.activeNetwork.seedMap[node.id] : false;
              if (!isSeed) {
                return;
              }
              const nodeStyled = NetworkSettings.getNodeStyle(
                node,
                this.drugstoneConfig.currentConfig(),
                isSeed,
                selected,
                this.networkHandler.activeNetwork.getGradient(node.id),
                this.networkHandler.activeNetwork.nodeRenderer
              );
              updatedNodes.push(nodeStyled);
            });
            this.nodeData.nodes.update(updatedNodes);

            const proteinSelection = [];
            for (const item of items) {
              const tableItem = this.tableProteins.find((i) => getProteinNodeId(i) === item.id);
              if (tableItem) {
                proteinSelection.push(tableItem);
              }
            }
            this.tableSelectedProteins = [...proteinSelection];
          }
        });
        this.emitVisibleItems(true);
      });
    });
  }


  private async refreshTask() {
    this.loadingScreen.stateUpdate(true);
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

    if (this.task && this.task.info && this.task.info.done) {

      this.loading = true;
      this.netex.getTaskResult(this.token).then(async result => {
        if (this.networkHandler.activeNetwork.networkType !== 'analysis') {
          return;
        }
        this.drugstoneConfig.set_analysisConfig(result.parameters.config);
        this.result = result;
        if (this.result.parameters.target === 'drug') {
          this.legendService.add_to_context('drug');
        } else {
          this.legendService.add_to_context('drugTarget');
        }
        const nodeAttributes = this.result.nodeAttributes || {};
        const analysisNetwork = this.networkHandler.networks['analysis'];
        analysisNetwork.seedMap = nodeAttributes.isSeed || {};

        // Reset
        this.nodeData = {nodes: null, edges: null};
        analysisNetwork.networkEl.nativeElement.innerHTML = '';
        analysisNetwork.networkInternal = null;
        // Create
        await this.createNetwork(this.result).then(nw => {
          return new Promise<any>((resolve, reject) => {
            if (this.networkHandler.activeNetwork.networkType !== 'analysis') {
              return;
            }
            const nodes = nw.nodes;
            const edges = nw.edges;
            analysisNetwork.inputNetwork = {nodes: nodes, edges: edges};
            this.nodeData.nodes = new vis.DataSet(nodes);
            this.nodeData.edges = new vis.DataSet(edges);
            const container = analysisNetwork.networkEl.nativeElement;
            const isBig = nodes.length > 100 || edges.length > 100;
            const options = NetworkSettings.getOptions(isBig ? 'analysis-big' : 'analysis', this.drugstoneConfig.currentConfig());
            // @ts-ignore
            options.groups = this.drugstoneConfig.currentConfig().nodeGroups;
            // @ts-ignore
            for (const g of Object.values(options.groups)) {
              // @ts-ignore
              delete g.renderer;
            }
            if (this.drugstoneConfig.config.physicsOn) {
              this.drugstoneConfig.config.physicsOn = !isBig;
            }
            analysisNetwork.networkInternal = new vis.Network(container, this.nodeData, options);

            if (isBig) {
              resolve(nodes);
            }
            analysisNetwork.networkInternal.once('stabilizationIterationsDone', async () => {
              if (!this.drugstoneConfig.config.physicsOn || analysisNetwork.isBig()) {
                analysisNetwork.updatePhysicsEnabled(false);
              }
              this.networkHandler.updateAdjacentNodes(analysisNetwork.isBig()).then(() => {
                resolve(nodes);
              });
            });
          }).then(nodes => {

            this.tableDrugs = nodes.filter(e => e.drugstoneId && e.drugstoneType === 'drug');
            this.tableDrugs.forEach((r) => {
              r.rawScore = r.score;
            });
            // @ts-ignore
            this.tableDrugs.sort((a, b) => b.score - a.score);
            this.rankTable(this.tableDrugs);
            this.tableProteins = nodes.filter(e => e.drugstoneId && e.drugstoneType === 'protein');
            this.tableSelectedProteins = [];
            this.tableProteins.forEach((r) => {
              r.rawScore = r.score;
              r.isSeed = analysisNetwork.seedMap[r.id];
              const wrapper = getWrapperFromNode(r);
              if (this.analysis.inSelection(wrapper)) {
                this.tableSelectedProteins.push(r);
              }
            });
            this.tableProteins.sort((a, b) => b.score - a.score);
            this.rankTable(this.tableProteins);

            this.tableHasScores = ['trustrank', 'closeness', 'degree', 'betweenness', 'quick', 'super']
              .indexOf(this.task.info.algorithm) !== -1;
            if (this.tableHasScores) {
              this.toggleNormalization(true);
            }
            analysisNetwork.networkInternal.setData({nodes: undefined, edge: undefined});
            setTimeout(() => {
              analysisNetwork.networkInternal.setData(this.nodeData);
            }, 1000);
            analysisNetwork.networkInternal.on('dragEnd', (properties) => {
              const node_ids = analysisNetwork.networkInternal.getSelectedNodes();
              if (node_ids.length === 0|| !this.networkHandler.shiftDown) {
                return;
              }
              this.analysis.addNodesByIdsToSelection(node_ids);
              analysisNetwork.networkInternal.unselectAll();
            });
            analysisNetwork.networkInternal.on('deselectNode', (properties) => {
              this.showDetailsChange.emit(null);
            });

            analysisNetwork.networkInternal.on('doubleClick', (properties) => {
              const nodeIds: Array<string> = properties.nodes;
              if (nodeIds.length > 0) {
                const nodeId = nodeIds[0];
                const node = this.nodeData.nodes.get(nodeId);
                if (node.drugstoneId === undefined || node.nodeType === 'drug' || node.drugstoneType !== 'protein') {
                  this.analysis.unmappedNodeToast();
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

            analysisNetwork.networkInternal.on('click', (properties) => {
              if (properties.nodes.length === 0 && properties.edges.length === 1) {
                // clicked on one edge
                const edgeId = properties.edges[0];
                analysisNetwork.openEdgeSummary(edgeId);
              } else {
                analysisNetwork.activeEdge = null;
                const selectedNodes = this.nodeData.nodes.get(properties.nodes);
                if (selectedNodes.length > 0) {
                  this.showDetailsChange.emit(getWrapperFromNode(selectedNodes[0]));
                } else {
                  this.showDetailsChange.emit(null);
                }
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
                  const pos = analysisNetwork.networkInternal.getPositions([item.id]);
                  node.x = pos[item.id].x;
                  node.y = pos[item.id].y;
                  const isSeed = analysisNetwork.highlightSeeds ? analysisNetwork.seedMap[node.id] : false;
                  const nodeStyled = NetworkSettings.getNodeStyle(
                    node,
                    this.drugstoneConfig.currentConfig(),
                    isSeed,
                    selected,
                    analysisNetwork.getGradient(item.id),
                    analysisNetwork.nodeRenderer
                  );
                  updatedNodes.push(nodeStyled);
                }
                this.nodeData.nodes.update(updatedNodes);

                const proteinSelection = this.tableSelectedProteins;
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
              } else {
                // else: selected is null
                const updatedNodes = [];
                this.nodeData.nodes.forEach((node) => {
                  const isSeed = analysisNetwork.highlightSeeds ? analysisNetwork.seedMap[node.id] : false;
                  if (!isSeed) {
                    return;
                  }
                  const nodeStyled = NetworkSettings.getNodeStyle(
                    node,
                    this.drugstoneConfig.currentConfig(),
                    isSeed,
                    selected,
                    analysisNetwork.getGradient(node.id),
                    analysisNetwork.nodeRenderer
                  );
                  updatedNodes.push(nodeStyled);
                });
                this.nodeData.nodes.update(updatedNodes);

                const proteinSelection = [];
                for (const item of items) {
                  const tableItem = this.tableProteins.find((i) => getProteinNodeId(i) === item.id);
                  if (tableItem) {
                    proteinSelection.push(tableItem);
                  }
                }
                this.tableSelectedProteins = [...proteinSelection];
              }
            });
            this.emitVisibleItems(true);
          }).then(() => {
            if (!['quick', 'super', 'connect', 'connectSelected'].includes(this.task.info.algorithm)) {
              return;
            }
            this.netex.getAlgorithmDefaults(this.task.info.algorithm).then(response => {
              this.algorithmDefault = response;
            });
          }).catch(console.error);
        });
        this.loadingScreen.stateUpdate(false);
      });
    }
  }

  private async refresh() {
    if (this.token) {
      if (this.tokenType === 'view') {
        this.networkHandler.showSeedsButton = false;
        await this.refreshView();
      } else {
        this.networkHandler.showSeedsButton = true;
        await this.refreshTask();
      }
    }

  }

  public emitVisibleItems(on: boolean) {
    if (on) {
      this.visibleItems.emit([this.nodeData.nodes, [this.proteins, this.selectedTissue], this.nodeData.edges]);
    } else {
      this.visibleItems.emit(null);
    }
  }

  private async getView(token: string): Promise<any> {
    return await this.http.get(`${this.netex.getBackend()}view/?token=${token}`).toPromise();
  }

  private async getTask(token: string): Promise<any> {
    return await this.http.get(`${this.netex.getBackend()}task/?token=${token}`).toPromise();
  }

  close() {
    const analysisNetwork = this.networkHandler.networks['analysis'];
    analysisNetwork.gradientMap = {};
    this.drugstoneConfig.remove_analysisConfig();
    this.expressionExpanded = false;
    this.expressionMap = undefined;
    analysisNetwork.seedMap = {};
    analysisNetwork.highlightSeeds = false;
    this.analysis.switchSelection('main');
    this.token = null;
    this.tokenChange.emit(this.token);
    this.legendService.remove_from_context('drug');
    this.legendService.remove_from_context('drugTarget');
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
      normalizeFn(this.tableProteins);
      if (this.task.info.target === 'drug') {
        normalizeFn(this.tableDrugs);
      }
    } else {
      unnormalizeFn(this.tableProteins);
      if (this.task.info.target === 'drug') {
        unnormalizeFn(this.tableDrugs);
      }
    }
  }

  public downloadNodesAsCSV(view: string) {
    let data = [];
    const nodes = this.nodeData.nodes.get();
    nodes.forEach((node) => {
      if (node.drugstoneType === view) {
        data.push(node);
      }
    });

    if ('score' in data[0]) {
      data = data.sort((a, b) => b['score'] - a['score']);
    }

    const columns = ['label', 'symbol', 'uniprot', 'ensg', 'entrez', 'proteinName', 'isSeed', 'score', 'rank', 'status'];
    downloadCSV(data, columns, `drugstone_${view}`);
  }

  /**
   * Maps analysis result returned from database to valid Vis.js network input
   *
   * @param result
   * @returns
   */
  public async createNetwork(result: any): Promise<{ edges: any[]; nodes: any[]; }> {
    const identifier = this.drugstoneConfig.currentConfig().identifier;

    // add drugGroup and foundNodesGroup for added nodes
    // these groups can be overwritten by the user
    const nodes = [];
    let edges = [];

    const attributes = result.nodeAttributes || {};

    this.proteins = [];
    this.effects = [];
    const network = result.network;
    network.nodes = [...new Set<string>(network.nodes)];
    const details = attributes.details || {};
    const nodeIdMap = {};
    // @ts-ignore
    Object.entries(details).filter(e => e[1].drugstoneType === 'protein').forEach(e => {
      // @ts-ignore
      e[1].drugstoneId.forEach(id => {
        nodeIdMap[id] = e[1][identifier][0];
      });
    });
    for (const nodeId of network.nodes) {
      if (details[nodeId]) {
        const nodeDetails = details[nodeId];
        nodeDetails.id = nodeDetails.id ? nodeDetails.id : (typeof nodeDetails.drugstoneId === 'string' ? nodeDetails.drugstoneId : nodeDetails.drugstoneId[0]);
        if (nodeDetails.drugstoneId && nodeDetails.drugstoneType === 'protein') {
          // node is protein from database, has been mapped on init to backend protein from backend
          // or was found during analysis
          // FIXME connectorNodes are not visualized correctly
          nodeDetails.group = result.targetNodes && result.targetNodes.indexOf(nodeId) !== -1 ? 'foundNode' : (nodeDetails.group ? nodeDetails.group : 'connectorNode');
          nodeDetails.label = nodeDetails.label ? nodeDetails.label : nodeDetails[identifier];
          nodeDetails.id = nodeDetails[identifier][0] ? nodeDetails[identifier][0] : nodeDetails.id;
          this.proteins.push(nodeDetails);
        } else if (nodeDetails.drugstoneId && nodeDetails.drugstoneType === 'drug') {
          // node is drug, was found during analysis
          nodeDetails.type = 'Drug';
          nodeDetails.group = 'foundDrug';
        } else {
          // node is custom input from user, could not be mapped to backend protein
          nodeDetails.group = nodeDetails.group ? nodeDetails.group : 'default';
          nodeDetails.label = nodeDetails.label ? nodeDetails.label : nodeDetails[identifier];
        }
        // further analysis and the button function can be used to highlight seeds
        // option to use scores[node] as gradient, but sccores are very small
        nodes.push(NetworkSettings.getNodeStyle(nodeDetails as Node, this.drugstoneConfig.currentConfig(), false, false, 1, this.networkHandler.activeNetwork.nodeRenderer));
      } else {
        console.log('Missing details for ' + nodeId);
      }
    }
    const uniqEdges = [];
    for (const edge of network.edges) {
      const e = mapCustomEdge(edge, this.drugstoneConfig.currentConfig(), this.drugstoneConfig);
      e.from = e.from[0] === 'p' && nodeIdMap[e.from] ? nodeIdMap[e.from] : e.from;
      e.to = e.to[0] === 'p' && nodeIdMap[e.to] ? nodeIdMap[e.to] : e.to;
      const hash = e.from + '_' + e.to;
      if (uniqEdges.indexOf(hash) === -1) {
        uniqEdges.push(hash);
        edges.push(e);
      }
    }
    // remove self-edges/loops
    if (!this.drugstoneConfig.currentConfig().selfReferences) {
      edges = edges.filter(el => el.from !== el.to);
    }
    return {
      nodes,
      edges,
    };
  }

  getResultNodes() {
    if (this.nodeData && this.nodeData['nodes']) {
      return this.nodeData['nodes'].get();
    }
    return [];
  }

  getResultEdges() {
    if (this.nodeData && this.nodeData['edges']) {
      return this.nodeData['edges'].get().filter(e => !e.id || !e.groupName || (typeof e.from === 'string' && typeof e.to === 'string'));
    }
    return [];
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
  };

  public toggleFullscreen() {
    this.fullscreen = !this.fullscreen;
    this.loadingScreen.fullscreenUpdate(this.fullscreen);
  }

  public showEULA() {
    this.drugstoneConfig.showLicense = true;
  }

  public openBugreport() {
    this.drugstoneConfig.showBugreport = true;
  }

}
