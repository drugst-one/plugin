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
import { algorithmNames, AnalysisService } from '../../services/analysis/analysis.service';
import {
  Drug,
  getProteinNodeId,
  getWrapperFromNode,
  LegendContext,
  Node,
  Task,
  Tissue,
  Wrapper,
  NodeInteraction,
} from '../../interfaces';
import { NetworkSettings } from '../../network-settings';
import { NetexControllerService } from 'src/app/services/netex-controller/netex-controller.service';
import { mapCustomEdge, mapNetexEdge, ProteinNetwork } from 'src/app/main-network';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';
import { NetworkHandlerService } from 'src/app/services/network-handler/network-handler.service';
import { LegendService } from 'src/app/services/legend-service/legend-service.service';
import { LoadingScreenService } from 'src/app/services/loading-screen/loading-screen.service';
import { version } from '../../../version';
import { downloadResultCSV, downloadNodeAttributes } from 'src/app/utils';
import { Sort } from '@angular/material/sort';

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

  @ViewChild('networkWithLegend', { static: false }) networkWithLegendEl: ElementRef;
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
  public nodeData: { nodes: any, edges: any } = { nodes: null, edges: null };
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
  public partition = false;

  public LegendContext: LegendContext = 'drugTarget';

  public expressionExpanded = false;
  public selectedTissue: Tissue | null = null;

  public algorithmNames = algorithmNames;

  public tableDrugScoreTooltip = '';
  public tableProteinScoreTooltip = '';

  public versionString = undefined;
  public latestVersionString = undefined

  public loading = false;

  public geneSet = null;
  public pathway = null;
  public sortedData = [];
  public maxSliderValue: number;
  public sliderValue: number;


  constructor(public legendService: LegendService, public networkHandler: NetworkHandlerService, public drugstoneConfig: DrugstoneConfigService, private http: HttpClient, public analysis: AnalysisService, public netex: NetexControllerService, public loadingScreen: LoadingScreenService) {
    try {
      this.versionString = version;
    } catch (e) {
    }
    if (this.versionString)
      this.readLatestVersion();
  }

  async ngOnInit() {
    this.analysis.getVariableObservable().subscribe((value) => {
      this.refreshTask();
    });
  }

  sortData(sort: Sort) {
    const data = this.sortedData.slice();

    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      const activeColumn = sort.active;
      if (activeColumn === 'geneset' || activeColumn === 'pathway' || activeColumn == 'odds_ratio' || activeColumn == 'p_value') {
        return this.compare_string_number(a[activeColumn], b[activeColumn], isAsc);
      } else if (activeColumn === "overlap") {
        return this.compare_overlap(a[activeColumn], b[activeColumn], isAsc);
      }
    });
  }

  public resetNetwork() {
    if(this.tokenType === 'view'){
      this.refreshView();
    } else if (this.tokenType === 'task'){
      this.refreshTask();
    }
  }

  private compare_string_number(a: number | string, b: number | string, isAsc: boolean){
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  private compare_overlap(a: string, b: string, isAsc: boolean) {
    const a1 = Number(a.split("/")[0])
    const b1 = Number(b.split("/")[0])
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  async readLatestVersion() {
    this.latestVersionString = await this.netex.getLatestVersion(this.versionString)
  }

  ngAfterViewInit() {
    this.networkHandler.setActiveNetwork('analysis');
    this.networkHandler.activeNetwork.subscribeSelection(() => {
      this.refresh();
    }
    );
  }

  async ngOnChanges(changes: SimpleChanges) {
    await this.refresh();
  }

  public onSliderValueChanged(event: any) {
    if (this.result) {
      this.sliderValue = event
      this.sortedData = this.result["tableView"].filter(entry => {
        const parts = entry.overlap.split('/');
        const rightValue = parseInt(parts[1], 10);

        return !isNaN(rightValue) && rightValue <= this.sliderValue;
      });
    }
  }

  @Output() resetEmitter: EventEmitter<boolean> = new EventEmitter();

  public reset() {
    this.networkHandler.activeNetwork.selectedTissue = null;
    this.close();
    this.resetEmitter.emit(true);
    this.loadingScreen.stateUpdate(false)
  }

  private setNetworkListeners() {
    this.networkHandler.activeNetwork.networkInternal.on('dragEnd', (properties) => {
      const node_ids = this.networkHandler.activeNetwork.networkInternal.getSelectedNodes();
      if (node_ids.length === 0 || !this.networkHandler.shiftDown) {
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

  private findMaxOverlap(entries: any[]): number {
    let maxOverlap = 0;

    for (const entry of entries) {
      const overlapValue = entry.overlap.split('/')[1];
      const rightValue = parseInt(overlapValue, 10);

      if (!isNaN(rightValue) && rightValue > maxOverlap) {
        maxOverlap = rightValue;
      }
    }
    return maxOverlap;
  }


  public choose_pathway_in_table(geneset: string, pathway: string) {
    this.geneSet = geneset;
    this.pathway = pathway;
    this.tab = "network";
    this.loading = true;
    this.loadingScreen.stateUpdate(true);
    this.parse_pathway(this.token, this.geneSet, this.pathway).then(result => {
      this.refreshTask();
    });
  }

  private async refreshView() {
    this.loading = true;
    this.loadingScreen.stateUpdate(true);
    this.getView(this.token).then(async view => {
      this.task = view;
      this.result = view;
      this.drugstoneConfig.set_analysisConfig(view.config);
      this.analysis.switchSelection(this.token);
      // this.loadingScreen.stateUpdate(false);
      // Reset
      this.nodeData = { nodes: null, edges: null };
      // Create
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
        this.networkHandler.activeNetwork.inputNetwork = { nodes: nodes, edges: edges };
        this.nodeData.nodes = new vis.DataSet(nodes);
        this.nodeData.edges = new vis.DataSet(edges);
        const container = this.networkHandler.activeNetwork.networkEl.nativeElement;
        const isBig = nodes.length > 100 || edges.length > 100;
        const options = NetworkSettings.getOptions(isBig ? 'analysis-big' : 'analysis', this.drugstoneConfig.currentConfig());
        // @ts-ignore
        for (const g of Object.values(options.groups)) {
          // @ts-ignore
          delete g.renderer;
        }
        if (this.drugstoneConfig.config.physicsOn) {
          this.drugstoneConfig.config.physicsOn = !isBig;
        }
        let edgeGroupConfig = this.drugstoneConfig.currentConfig().edgeGroups
        this.nodeData.edges.forEach((edge) => {
          if (!edge.group)
            edge.group = 'default';
          let cfg = edgeGroupConfig[edge.group]
          if (cfg)
            Object.entries(cfg).forEach(([key, value]) => {
              edge[key] = value
            })
        });
        this.networkHandler.activeNetwork.networkInternal = new vis.Network(container, this.nodeData, options);

        if (isBig) {
          resolve(nodes);
        }
        this.networkHandler.activeNetwork.networkInternal.stabilize();
        this.networkHandler.activeNetwork.networkInternal.once('stabilizationIterationsDone', async () => {
          if (!this.drugstoneConfig.config.physicsOn || this.networkHandler.activeNetwork.isBig()) {
            this.networkHandler.activeNetwork.updatePhysicsEnabled(false);
          }
          this.networkHandler.updateAdjacentNodes(this.networkHandler.activeNetwork.isBig()).then(() => {
            resolve(nodes);
          });
        });
      }).then((_) => {
        this.setNetworkListeners();
        this.emitVisibleItems(true);
      }).then(_ => {
        this.loadingScreen.stateUpdate(false);
      });
    });
  }

  public async chooseNetwork() {
    this.tab = 'network'
    this.refreshTask();
  }

  private async refreshTask() {
    this.loadingScreen.stateUpdate(true);
    this.analysis.analysisActive = true;
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
    } else if (this.task.info.algorithm === 'pathway-enrichment') {
      this.analysis.inPathwayAnalysis = true;
    }

    if (this.task && this.task.info && this.task.info.done) {

      this.loading = true;
      this.netex.getTaskResult(this.token).then(async result => {
        console.log(result)
        if (!("network" in result)) {
          this.tab = 'table';
        }

        if (this.networkHandler.activeNetwork.networkType !== 'analysis') {
          return;
        }
        this.drugstoneConfig.set_analysisConfig(result.parameters.config);
        if (result["algorithm"] === "pathway_enrichment") {
          if("geneset" in result){
            this.geneSet = result["geneset"];
            this.pathway = result["pathway"];
          }
          if (!this.maxSliderValue){
            this.maxSliderValue = this.findMaxOverlap(result["tableView"]);
            this.sliderValue = this.maxSliderValue;
          }
          if (!this.drugstoneConfig.config["nodeGroups"]["overlap"] || !this.drugstoneConfig.config["nodeGroups"]["onlyNetwork"] || !this.drugstoneConfig.config["nodeGroups"]["onlyPathway"] || !this.drugstoneConfig.config["nodeGroups"]["addedNode"]) {
            this.drugstoneConfig.config["nodeGroups"]["overlap"] = this.drugstoneConfig.currentConfig().nodeGroups["overlap"];
            this.drugstoneConfig.config["nodeGroups"]["onlyNetwork"] = this.drugstoneConfig.currentConfig().nodeGroups["onlyNetwork"];
            this.drugstoneConfig.config["nodeGroups"]["onlyPathway"] = this.drugstoneConfig.currentConfig().nodeGroups["onlyPathway"];
            this.drugstoneConfig.config["nodeGroups"]["addedNode"] = this.drugstoneConfig.currentConfig().nodeGroups["addedNode"];
          }
        }
        this.analysis.switchSelection(this.token);
        this.legendService.reset();
        this.result = result;
        if (this.task.info.algorithm === 'pathway-enrichment') {
          this.sortedData = result.tableView.slice();
          this.onSliderValueChanged(this.sliderValue);
        }
        if (this.result.parameters.target === 'drug') {
          this.legendService.add_to_context('drug');
        } else if (this.result.parameters.target === 'gene') {
          if (this.result.algorithm === 'pathway_enrichment') {
            this.legendService.add_to_context('pathway');
          }
        }
        else {
          this.legendService.add_to_context('drugTarget');
          if (this.result.parameters.algorithm === 'louvain-clustering' || this.result.parameters.algorithm === 'leiden-clustering') {
            this.legendService.add_to_context('louvain');
            this.partition = true;
          }
        }
        const nodeAttributes = this.result.nodeAttributes || {};
        const analysisNetwork = this.networkHandler.networks['analysis'];
        analysisNetwork.seedMap = nodeAttributes.isSeed || {};

        // Reset
        this.nodeData = { nodes: null, edges: null };
        analysisNetwork.networkEl.nativeElement.innerHTML = '';
        analysisNetwork.networkInternal = null;
        // Create
        await this.createNetwork(this.result, this.analysis.nodesToAdd).then(nw => {
          return new Promise<any>((resolve, reject) => {
            if (this.networkHandler.activeNetwork.networkType !== 'analysis') {
              return;
            }
            const nodes = nw.nodes;
            const edges = nw.edges;
            analysisNetwork.inputNetwork = { nodes: nodes, edges: edges };
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
            analysisNetwork.networkInternal.stabilize();
            this.networkHandler.activeNetwork.updateLayoutEnabled(false);
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
            // TODO: is this necessary?
            // analysisNetwork.networkInternal.setData({nodes: undefined, edge: undefined});
            // setTimeout(() => {
            //   analysisNetwork.networkInternal.setData(this.nodeData);
            // }, 1000);
            this.setNetworkListeners();
            this.emitVisibleItems(true);
          }).then(() => {

            this.loadingScreen.stateUpdate(false);
            if (!['quick', 'super', 'connect', 'connectSelected'].includes(this.task.info.algorithm)) {
              return;
            }
            this.netex.getAlgorithmDefaults(this.task.info.algorithm).then(response => {
              this.algorithmDefault = response;
            });
          }).catch(console.error);
        });
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

  private async parse_pathway(token: string, geneset: string, pathway: string): Promise<any> {
    return await this.http.put(`${this.netex.getBackend()}calculate_result_for_pathway/?token=${encodeURIComponent(token)}&geneset=${encodeURIComponent(geneset)}&pathway=${encodeURIComponent(pathway)}`, {}).toPromise();
  }

  private async getTask(token: string): Promise<any> {
    return await this.http.get(`${this.netex.getBackend()}task/?token=${token}`).toPromise();
  }

  close() {
    this.analysis.analysisActive = false;
    const analysisNetwork = this.networkHandler.networks['analysis'];
    analysisNetwork.gradientMap = {};
    this.drugstoneConfig.remove_analysisConfig();
    this.expressionExpanded = false;
    analysisNetwork.seedMap = {};
    analysisNetwork.highlightSeeds = false;
    this.analysis.switchSelection('main');
    this.analysis.clearSelectionsExcept('main')
    this.analysis.inPathwayAnalysis = false;
    this.analysis.nodesToAdd = [];
    this.token = null;
    this.networkHandler.activeNetwork.updateLayoutEnabled(false);
    this.tokenChange.emit(this.token);
    this.legendService.remove_from_context('drug');
    this.legendService.remove_from_context('drugTarget');
    this.legendService.remove_from_context('pathway');
    this.legendService.remove_from_context('louvain');
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

    downloadResultCSV(data, downloadNodeAttributes, `drugstone_${view}`);
  }

  public downloadPathwayEnrichmentAsCSV(){
    if (this.result["tableView"].length > 0){
      const tableView = this.result["tableView"];
      const columns = Object.keys(this.result["tableView"][0])
      console.log(tableView, columns)
      downloadResultCSV(tableView, columns, `drugstone_pathwayEnrichment`);
    }
  }

  /**
   * Maps analysis result returned from database to valid Vis.js network input
   *
   * @param result
   * @returns
   */
  public async createNetwork(result: any, nodesToAdd: Node[] = []): Promise<{ edges: any[]; nodes: any[]; }> {
    if (result.algorithm === "pathway_enrichment") {
      if (!("network" in result)) {
        return { edges: [], nodes: [] };
      }
      let edges_mapped = result.network.edges.map(edge => mapCustomEdge(edge, this.drugstoneConfig.currentConfig(), this.drugstoneConfig));
      let nodes_list: any[] = result.network.nodes;
      if (nodesToAdd.length > 0) {
        nodesToAdd.forEach(node => {
          if (!nodes_list.find(n => n.id === node.id)){
            if (!node.groupName) {
              node.group = "addedNode"
              node.groupName = this.drugstoneConfig.currentConfig().nodeGroups[node.group]["groupName"]
              node.type = "protein"
            }
            nodes_list.push(node);
          }
        })
        const edges = await this.netex.addEdges({ nodes: nodes_list, edges: edges_mapped }, result);
        edges_mapped = edges.map(edge => mapCustomEdge(edge, this.drugstoneConfig.currentConfig(), this.drugstoneConfig));
      }
      const nodes: any = nodes_list;
      const network = {
        nodes: nodes,
        edges: edges_mapped
      }
      this.analysis.currentNetwork = network;
      return network

    } else if (result.algorithm === "louvain_clustering" || result.algorithm === "leiden_clustering" || result.algorithm === "first_neighbor") {
      result.network["edges"] = result.network["edges"].map(edge => mapCustomEdge(edge, this.drugstoneConfig.currentConfig(), this.drugstoneConfig));
      this.analysis.currentNetwork = result.network;
      return result.network;
    }
     else {
      const identifier = this.drugstoneConfig.currentConfig().identifier;

      // add drugGroup and foundNodesGroup for added nodes
      // these groups can be overwritten by the user
      let nodes = [];
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
      const skippedDrugIds = new Set<string>();
      const drugEdgeTypes = new Set<string>();
      for (const edge of network.edges) {
        const e = mapCustomEdge(edge, this.drugstoneConfig.currentConfig(), this.drugstoneConfig);
        const isDrugEdge = e.to[0] === 'd' && e.to[1] === 'r';
        e.from = e.from[0] === 'p' && nodeIdMap[e.from] ? nodeIdMap[e.from] : e.from;
        e.to = e.to[0] === 'p' && nodeIdMap[e.to] ? nodeIdMap[e.to] : e.to;
        if (isDrugEdge) {
          skippedDrugIds.add(e.to);
          if (edge.actions) {
            edge.actions.forEach(a => drugEdgeTypes.add(a));
          }
          if (edge.actions && this.networkHandler.activeNetwork.getSelectedDrugTargetType() && !edge.actions.includes(this.networkHandler.activeNetwork.getSelectedDrugTargetType())) {
            continue;
          }
          const label = edge.actions && edge.actions.length > 0 ? edge.actions.join(',') : undefined;
          skippedDrugIds.delete(e.to);
          if (label) {
            e.label = label;
          }
        }

        this.networkHandler.activeNetwork.setDrugTargetTypes(Array.from(drugEdgeTypes));

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
      nodes = nodes.filter(n => !(n.drugstoneId && skippedDrugIds.has(n.drugstoneId)));
      // if (this.networkHandler.activeNetwork.selectedDrugTargetType) {
      // }

      this.legendService.networkHasConnector = nodes.filter(node => node.group === 'connectorNode').length > 0;

      const network_result = {
        nodes,
        edges,
      };
      this.analysis.currentNetwork = network_result;
      return network_result
    }

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
