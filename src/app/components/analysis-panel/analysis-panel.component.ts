import {
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
import {environment} from '../../../environments/environment';
import {algorithmNames, AnalysisService} from '../../services/analysis/analysis.service';
import {
  Drug,
  EdgeType,
  NodeAttributeMap,
  getDrugNodeId,
  getProteinNodeId,
  getWrapperFromNode,
  legendContext,
  Node,
  Task,
  Tissue,
  Wrapper,
  NodeInteraction,
} from '../../interfaces';
import domtoimage from 'dom-to-image';
import {toast} from 'bulma-toast';
import {NetworkSettings} from '../../network-settings';
import {NetexControllerService} from 'src/app/services/netex-controller/netex-controller.service';
import {defaultConfig, IConfig} from 'src/app/config';
import { mapCustomEdge, mapCustomNode } from 'src/app/main-network';
import { removeDuplicateObjectsFromList } from 'src/app/utils';


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
export class AnalysisPanelComponent implements OnInit, OnChanges {

  @ViewChild('network', {static: false}) networkEl: ElementRef;
  @ViewChild('networkWithLegend', {static: false}) networkWithLegendEl: ElementRef;
  @Input() token: string | null = null;
  @Input() public smallStyle = false;
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
  public myConfig: IConfig = JSON.parse(JSON.stringify(defaultConfig));


  public network: any;
  private nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};
  private drugNodes: any[] = [];
  private drugEdges: any[] = [];
  public showDrugs = false;
  public tab: 'meta' | 'network' | 'table' = 'table';
  public physicsEnabled = true;

  public adjacentDrugs = false;
  public adjacentDrugList: Node[] = [];
  public adjacentDrugEdgesList: Node[] = [];

  public highlightSeeds = false;
  public seedMap: NodeAttributeMap;

  private proteins: any;
  public effects: any;

  public tableDrugs: Array<Drug & Scored & Baited> = [];
  public tableProteins: Array<Node & Scored & Seeded & Baited> = [];
  public tableSelectedProteins: Array<Node & Scored & Seeded & Baited> = [];
  public tableViralProteins: Array<Scored & Seeded> = [];
  public tableSelectedViralProteins: Array<Scored & Seeded> = [];
  public tableNormalize = false;
  public tableHasScores = false;

  public legendContext: legendContext = 'drugTarget';

  public expressionExpanded = false;
  public selectedTissue: Tissue | null = null;

  public algorithmNames = algorithmNames;

  public tableDrugScoreTooltip = '';
  public tableProteinScoreTooltip = '';

  public expressionMap: NodeAttributeMap;
  public gradientMap: NodeAttributeMap = {};

  constructor(private http: HttpClient, public analysis: AnalysisService, public netex: NetexControllerService) {
  }

  async ngOnInit() {
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
        const result = await this.netex.getTaskResult(this.token);
        const nodeAttributes = result.nodeAttributes || {};

        this.seedMap = nodeAttributes.isSeed || {};

        // Reset
        this.nodeData = {nodes: null, edges: null};
        this.networkEl.nativeElement.innerHTML = '';
        this.network = null;
        this.showDrugs = false;

        // Create
        const {nodes, edges} = this.createNetwork(result);
        this.nodeData.nodes = new vis.DataSet(nodes);
        this.nodeData.edges = new vis.DataSet(edges);

        const container = this.networkEl.nativeElement;
        const isBig = nodes.length > 100 || edges.length > 100;
        const options = NetworkSettings.getOptions(isBig ? 'analysis-big' : 'analysis');
        this.physicsEnabled = !isBig;

        this.network = new vis.Network(container, this.nodeData, options);

        const promises: Promise<any>[] = [];
        promises.push(this.http.get<any>(`${environment.backend}task_result/?token=${this.token}&view=drugs`).toPromise()
          .then((table) => {
            this.tableDrugs = table;
            this.tableDrugs.forEach((r) => {
              r.rawScore = r.score;
            });
          }));
        promises.push(this.http.get<any>(`${environment.backend}task_result/?token=${this.token}&view=proteins`).toPromise()
          .then((table) => {
            this.tableProteins = table;
            this.tableSelectedProteins = [];
            this.tableProteins.forEach((r) => {
              r.rawScore = r.score;
              r.isSeed = this.seedMap[r.id];
              const wrapper = getWrapperFromNode(r);
              if (this.analysis.inSelection(wrapper)) {
                this.tableSelectedProteins.push(r);
              }
            });
          }));
        await Promise.all(promises);

        this.tableHasScores = ['trustrank', 'closeness', 'degree', 'proximity', 'betweenness', 'quick', 'super']
          .indexOf(this.task.info.algorithm) !== -1;
        if (this.tableHasScores) {
          if (this.task.info.algorithm !== 'proximity') {
            this.toggleNormalization(true);
          } else {
            this.toggleNormalization(false);
          }
        }

        this.network.on('deselectNode', (properties) => {
          this.showDetailsChange.emit(null);
        });

        this.network.on('doubleClick', (properties) => {
          const nodeIds: Array<string> = properties.nodes;
          if (nodeIds.length > 0) {
            const nodeId = nodeIds[0];
            const node = this.nodeData.nodes.get(nodeId);
            if (node.nodeType === 'drug' || node.netexId === undefined || !node.netexId.startsWith('p')) {
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

        this.network.on('click', (properties) => {
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
              const pos = this.network.getPositions([item.id]);
              node.x = pos[item.id].x;
              node.y = pos[item.id].y;
              const isSeed = this.highlightSeeds ? this.seedMap[node.id] : false;
              const gradient = (this.gradientMap !== {}) && (this.gradientMap[item.id]) ? this.gradientMap[item.id] : 1.0;
              const nodeStyled = NetworkSettings.getNodeStyle(
                node,
                this.myConfig,
                isSeed,
                selected,
                gradient
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
              // if (node.netexId && node.netexId.startsWith('d')) {
              //   drugType = node.status;
              //   drugInTrial = node.inTrial;
              // }
              const isSeed = this.highlightSeeds ? this.seedMap[node.id] : false;
              const gradient = (this.gradientMap !== {}) && (this.gradientMap[node.id]) ? this.gradientMap[node.id] : 1.0;
              const nodeStyled = NetworkSettings.getNodeStyle(
                node,
                this.myConfig,
                isSeed,
                selected,
                gradient
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

    this.setLegendContext();

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
    this.gradientMap = {};
    this.expressionExpanded = false;
    this.expressionMap = undefined;
    this.seedMap = {};
    this.highlightSeeds = false;
    this.showDrugs = false;
    this.analysis.switchSelection('main');
    this.token = null;
    this.tokenChange.emit(this.token);
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

  public graphmlLink(): string {
    return `${environment.backend}graph_export/?token=${this.token}`;
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
    } else if (wrapper.data.netexId !== undefined && wrapper.data.netexId.startsWith('d')) {
      return 'drug';
    } else if (wrapper.data.netexId !== undefined && wrapper.data.netexId.startsWith('p')) {
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

      nodeDetails.id = nodeDetails.id ? nodeDetails.id : nodeDetails.netexId;
      if (nodeDetails.netexId && nodeDetails.netexId.startsWith('p')) {
        // node is protein from database, has been mapped on init to backend protein from backend
        // or was found during analysis
        nodeDetails.group = nodeDetails.group ? nodeDetails.group : 'foundNode';
        nodeDetails.label = nodeDetails.label ? nodeDetails.label : nodeDetails[identifier];
        this.proteins.push(nodeDetails);
      } else if (nodeDetails.netexId && nodeDetails.netexId.startsWith('d')) {
        // node is drug, was found during analysis
        nodeDetails.type = 'Drug';
        nodeDetails.group = 'foundDrug';
      } else {
        // node is custom input from user, could not be mapped to backend protein
        nodeDetails.group = nodeDetails.group ? nodeDetails.group : 'default';
        nodeDetails.label = nodeDetails.label ? nodeDetails.label : nodeDetails[identifier]
      }
      // IMPORTANT we set seeds to "selected" and not to seeds. The user should be inspired to run 
      // further analysis and the button function can be used to highlight seeds
      // option to use scores[node] as gradient, but sccores are very small
      nodes.push(NetworkSettings.getNodeStyle(nodeDetails as Node, config, false, false, 1))
    }
    for (const edge of network.edges) {
      edges.push(mapCustomEdge(edge, this.myConfig));
    }
    return {
      nodes,
      edges,
    };
  }

  public setLegendContext() {
    const target = this.task.info.target;
    if (target === 'drug' || this.adjacentDrugs) {
      if (this.highlightSeeds) {
        this.legendContext = "drugAndSeeds";
      } else {
        this.legendContext = "drug";
      }
      
    } else if (target === 'drug-target') {
      if (this.highlightSeeds) {
        this.legendContext = "drugTargetAndSeeds";
      } else {
        this.legendContext = 'drugTarget'
      }
    } else {
      throw `Could not set legend context based on ${target}.` 
    }
  }

  public updateHighlightSeeds(bool: boolean) {
    this.highlightSeeds = bool;
    const updatedNodes = [];
    for (const item of this.proteins) {
      if (item.netexId === undefined) {
        // nodes that are not mapped to backend remain untouched
        continue;
      }
      const node: Node = this.nodeData.nodes.get(item.id);
      if (!node) {
        continue;
      }
      const pos = this.network.getPositions([item.id]);
      node.x = pos[item.id].x;
      node.y = pos[item.id].y;
      const isSeed = this.highlightSeeds ? this.seedMap[node.id] : false;
      const gradient = (this.gradientMap !== {}) && (this.gradientMap[item.id]) ? this.gradientMap[item.id] : 1.0;
      Object.assign(
        node,
        NetworkSettings.getNodeStyle(
          node,
          this.myConfig,
          isSeed,
          this.analysis.inSelection(getWrapperFromNode(item)),
          gradient
          )
      )
      updatedNodes.push(node);
    }
    this.nodeData.nodes.update(updatedNodes);
    this.setLegendContext();
  }

  public updateAdjacentDrugs(bool: boolean) {
    this.adjacentDrugs = bool;
    if (this.adjacentDrugs) {
        this.netex.adjacentDrugs(this.myConfig.interactionDrugProtein, this.nodeData.nodes).subscribe(response => {
          for (const interaction of response.pdis) {
            const edge = {from: interaction.protein, to: interaction.drug};
            this.adjacentDrugEdgesList.push(mapCustomEdge(edge, this.myConfig));
          }
          for (const drug of response.drugs) {
            drug.group = 'foundDrug';
            drug.id = getDrugNodeId(drug)
            this.adjacentDrugList.push(mapCustomNode(drug, this.myConfig))
          }
          this.nodeData.nodes.add(this.adjacentDrugList);
          this.nodeData.edges.add(this.adjacentDrugEdgesList);
      })
    } else {
      this.nodeData.nodes.remove(this.adjacentDrugList);
      this.nodeData.edges.remove(this.adjacentDrugEdgesList);
      this.adjacentDrugList = [];
      this.adjacentDrugEdgesList = [];
    }
    this.setLegendContext()
    // emit data to update sidebar information
    this.emitVisibleItems(true);
  }

  public updatePhysicsEnabled(bool: boolean) {
    this.physicsEnabled = bool;
    this.network.setOptions({
      physics: {
        enabled: this.physicsEnabled,
        stabilization: {
          enabled: false,
        },
      }
    });
  }

  public toImage() {
    this.downloadDom(this.networkWithLegendEl.nativeElement).catch(error => {
      console.error("Falling back to network only screenshot. Some components seem to be inaccessable, most likely the legend is a custom image with CORS access problems on the host server side.")
      this.downloadDom(this.networkEl.nativeElement).catch(e => {
        console.error("Some network content seems to be inaccessable for saving as a screenshot. This can happen due to custom images used as nodes. Please ensure correct CORS accessability on the images host server.")
        console.error(e)
      });
    });
  }

  public downloadDom(dom: object) {
    return domtoimage.toPng(dom, {bgcolor: '#ffffff'}).then((generatedImage) => {
      const a = document.createElement('a');
      a.href = generatedImage;
      a.download = `Network.png`;
      a.click();
    });
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

  public selectTissue(tissue: Tissue | null) {
    this.expressionExpanded = false;
    if (!tissue) {
      this.selectedTissue = null;
      const updatedNodes = [];
      for (const item of this.proteins) {
        if (item.netexId === undefined) {
          // nodes that are not mapped to backend remain untouched
          continue;
        }
        const node: Node = this.nodeData.nodes.get(item.id);
        if (!node) {
          continue;
        }
        const pos = this.network.getPositions([item.id]);
        node.x = pos[item.id].x;
        node.y = pos[item.id].y;
        const isSeed = this.highlightSeeds ? this.seedMap[node.id] : false;
        Object.assign(
          node,
          NetworkSettings.getNodeStyle(
            node,
            this.myConfig,
            isSeed,
            this.analysis.inSelection(getWrapperFromNode(item)),
            1.0
            )
        )
        updatedNodes.push(node);
      }
      this.nodeData.nodes.update(updatedNodes);
      // delete expression values
      this.expressionMap = undefined;
      this.gradientMap = {};
    } else {
      this.selectedTissue = tissue
      const minExp = 0.3;
      // filter out non-proteins, e.g. drugs
      const proteinNodes = [];
      this.nodeData.nodes.forEach(element => {
        if (element.id.startsWith('p') && element.netexId !== undefined) {
          proteinNodes.push(element);
        }
      });
      this.netex.tissueExpressionGenes(this.selectedTissue, proteinNodes).subscribe((response) => {
        this.expressionMap = response;
        const updatedNodes = [];
        // mapping from netex IDs to network IDs, TODO check if this step is necessary
        const networkIdMappping = {}
        this.nodeData.nodes.forEach(element => {
          networkIdMappping[element.netexId] = element.id
        });
        const maxExpr = Math.max(...Object.values(this.expressionMap));
        for (const [netexId, expressionlvl] of Object.entries(this.expressionMap)) {
          const networkId = networkIdMappping[netexId]
          const node = this.nodeData.nodes.get(networkId);
          if (node === null) {
            continue;
          }
          const wrapper = getWrapperFromNode(node)
          this.gradientMap[netexId] = expressionlvl !== null ? (Math.pow(expressionlvl / maxExpr, 1 / 3) * (1 - minExp) + minExp) : -1;
          const pos = this.network.getPositions([networkId]);
          node.x = pos[networkId].x;
          node.y = pos[networkId].y;
          const isSeed = this.highlightSeeds ? this.seedMap[node.id] : false;
          Object.assign(node,
            NetworkSettings.getNodeStyle(
              node,
              this.myConfig,
              isSeed,
              this.analysis.inSelection(wrapper),
              this.gradientMap[netexId]));
          node.gradient = this.gradientMap[netexId];
          updatedNodes.push(node);
        }
        this.nodeData.nodes.update(updatedNodes);
      })
    }
  }
}
