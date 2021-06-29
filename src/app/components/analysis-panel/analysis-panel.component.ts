import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {AnalysisService, algorithmNames} from '../../services/analysis/analysis.service';
import {
  Node,
  Task,
  Drug,
  Wrapper,
  getWrapperFromNode,
  getWrapperFromDrug,
  getWrapperFromCustom,
  getNodeIdsFromPDI,
  getNodeIdsFromPPI,
  getProteinNodeId,
  Tissue,
  EdgeType,
} from '../../interfaces';
import domtoimage from 'dom-to-image';
import {toast} from 'bulma-toast';
import {NetworkSettings} from '../../network-settings';
import {NetexControllerService} from 'src/app/services/netex-controller/netex-controller.service';
import {defaultConfig, IConfig} from 'src/app/config';

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
  @Output() visibleItems = new EventEmitter<[any[], [Node[], Tissue]]>();

  public task: Task | null = null;
  public myConfig: IConfig = JSON.parse(JSON.stringify(defaultConfig));


  private network: any;
  private nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};
  private drugNodes: any[] = [];
  private drugEdges: any[] = [];
  public showDrugs = false;
  public tab: 'meta' | 'network' | 'table' = 'table';
  public physicsEnabled = true;

  private proteins: any;
  public effects: any;

  public tableDrugs: Array<Drug & Scored & Baited> = [];
  public tableProteins: Array<Node & Scored & Seeded & Baited> = [];
  public tableSelectedProteins: Array<Node & Scored & Seeded & Baited> = [];
  public tableViralProteins: Array<Scored & Seeded> = [];
  public tableSelectedViralProteins: Array<Scored & Seeded> = [];
  public tableNormalize = false;
  public tableHasScores = false;

  public expressionExpanded = false;
  public selectedTissue: Tissue | null = null;

  public algorithmNames = algorithmNames;

  public tableDrugScoreTooltip = '';
  public tableProteinScoreTooltip = '';

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
        const isSeed: { [key: string]: boolean } = nodeAttributes.isSeed || {};

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
              r.isSeed = isSeed[r.id];
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
            if (node.nodeType === 'drug') {
              return;
            }
            const wrapper = node.wrapper;
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
            const selectedNode = selectedNodes[0];
            const wrapper = selectedNode.wrapper;
            this.showDetailsChange.emit(wrapper);
          } else {
            this.showDetailsChange.emit(null);
          }
        });

        this.analysis.subscribeList((items, selected) => {
          if (selected !== null) {
            const updatedNodes = [];
            for (const item of items) {
              const node = this.nodeData.nodes.get(item.id);
              if (!node) {
                continue;
              }
              const pos = this.network.getPositions([item.id]);
              node.x = pos[item.id].x;
              node.y = pos[item.id].y;
              // Object.assign(node, NetworkSettings.getNodeStyle(
              //   node.wrapper.type,
              //   node.isSeed,
              //   selected));
              updatedNodes.push(node);
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
            const updatedNodes = [];
            this.nodeData.nodes.forEach((node) => {
              const nodeSelected = this.analysis.idInSelection(node.id);
              let drugType;
              let drugInTrial;
              if (node.wrapper.data.netexId && node.wrapper.data.netexId.startswith('d')) {
                drugType = node.wrapper.data.status;
                drugInTrial = node.wrapper.data.inTrial;
              }
              // Object.assign(node, NetworkSettings.getNodeStyle(
              //   node.wrapper.type,
              //   node.isSeed,
              //   nodeSelected,
              //   drugType,
              //   drugInTrial,
              //   node.gradient));
              updatedNodes.push(node);
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
  }

  public emitVisibleItems(on: boolean) {
    if (on) {
      this.visibleItems.emit([this.nodeData.nodes, [this.proteins, this.selectedTissue]]);
    } else {
      this.visibleItems.emit(null);
    }
  }

  private async getTask(token: string): Promise<any> {
    return await this.http.get(`${environment.backend}task/?token=${token}`).toPromise();
  }

  close() {
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
    console.log(wrapper);
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
    const wrappers: { [key: string]: Wrapper } = {};

    for (const node of network.nodes) {
      // backend converts object keys to PascalCase: p_123 --> p123
      const nodeObjectKey = node.split('_').join('');
      if (nodeTypes[nodeObjectKey] === 'protein') {
        // node is protein from database, has been mapped on init to backend protein from backend
        // or was found during analysis
        this.proteins.push(details[nodeObjectKey]);
        wrappers[node] = getWrapperFromNode(details[nodeObjectKey]);
      } else if (nodeTypes[nodeObjectKey] === 'drug') {
        // node is drug, was found during analysis
        wrappers[node] = getWrapperFromDrug(details[nodeObjectKey]);
      } else {
        // node is custom input from user, could not be mapped to backend protein
        wrappers[node] = getWrapperFromCustom(details[nodeObjectKey]);
      }
      nodes.push(this.mapNode(config, wrappers[node], isSeed[nodeObjectKey], scores[nodeObjectKey]));
    }
    for (const edge of network.edges) {
      edges.push(this.mapEdge(edge, this.inferEdgeGroup(edge), wrappers));
    }
    return {
      nodes,
      edges,
    };
  }

  /**
   * maps node object returned from backend to frontend node, i.e. input to vis.js
   * @param config
   * @param wrapper
   * @param isSeed
   * @param score
   * @returns
   */
  private mapNode(config: IConfig, wrapper: Wrapper, isSeed?: boolean, score?: number): any {

    console.log('node group');
    console.log(config.nodeGroups);
    console.log('node');

    console.log(wrapper.data);

    // override group is node is seed
    wrapper.data.group = isSeed ? 'seedNode' : wrapper.data.group;
    const node = JSON.parse(JSON.stringify(config.nodeGroups[wrapper.data.group]));
    node.id = wrapper.id;
    node.label = this.inferNodeLabel(config, wrapper);
    node.isSeed = isSeed;
    node.wrapper = wrapper;
    return node;
  }

  private mapEdge(edge: any, type: 'protein-protein' | 'protein-drug', wrappers?: { [key: string]: Wrapper }): any {
    let edgeColor;
    if (type === 'protein-protein') {
      edgeColor = {
        color: NetworkSettings.getColor('edgeGeneGene'),
        highlight: NetworkSettings.getColor('edgeGeneGeneHighlight'),
      };
      const {from, to} = getNodeIdsFromPPI(edge, wrappers);
      return {
        from, to,
        color: edgeColor,
      };
    } else if (type === 'protein-drug') {
      edgeColor = {
        color: NetworkSettings.getColor('edgeHostDrug'),
        highlight: NetworkSettings.getColor('edgeHostDrugHighlight'),
      };
      const {from, to} = getNodeIdsFromPDI(edge);
      return {
        from, to,
        color: edgeColor,
      };
    }
  }

  public async toggleDrugs(bool: boolean) {
    this.showDrugs = bool;
    this.nodeData.nodes.remove(this.drugNodes);
    this.nodeData.edges.remove(this.drugEdges);
    this.drugNodes = [];
    this.drugEdges = [];
    if (this.showDrugs) {
      const result = await this.http.get<any>(
        `${environment.backend}drug_interactions/?token=${this.token}`).toPromise().catch(
        (err: HttpErrorResponse) => {
          // simple logging, but you can do a lot more, see below
          toast({
            message: 'An error occured while fetching the drugs.',
            duration: 5000,
            dismissible: true,
            pauseOnHover: true,
            type: 'is-danger',
            position: 'top-center',
            animate: {in: 'fadeIn', out: 'fadeOut'}
          });
          this.showDrugs = false;
          return;
        });

      const drugs = result.drugs;
      const edges = result.edges;

      if (drugs.length === 0) {
        toast({
          message: 'No drugs found.',
          duration: 5000,
          dismissible: true,
          pauseOnHover: true,
          type: 'is-warning',
          position: 'top-center',
          animate: {in: 'fadeIn', out: 'fadeOut'}
        });
      } else {
        // for (const drug of drugs) {
        //   this.drugNodes.push(this.mapNode(config, 'drug', drug, false, null));
        // }

        for (const interaction of edges) {
          const edge = {from: interaction.uniprotAc, to: interaction.drugId};
          this.drugEdges.push(this.mapEdge(edge, 'protein-drug'));
        }
        this.nodeData.nodes.add(Array.from(this.drugNodes.values()));
        this.nodeData.edges.add(Array.from(this.drugEdges.values()));
      }
    }
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

  public tableProteinSelection(e) {
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
    /*if (!tissue) {
      this.selectedTissue = null;
      const updatedNodes = [];
      for (const protein of this.proteins) {
        const item = getWrapperFromNode(protein);
        const node = this.nodeData.nodes.get(item.nodeId);
        if (!node) {
          continue;
        }
        const pos = this.network.getPositions([item.nodeId]);
        node.x = pos[item.nodeId].x;
        node.y = pos[item.nodeId].y;
        Object.assign(node,
          NetworkSettings.getNodeStyle(
            node.wrapper.type,
            node.isSeed,
            this.analysis.inSelection(item),
            undefined,
            undefined,
            1.0));
        node.wrapper = item;
        node.gradient = 1.0;
        protein.expressionLevel = undefined;
        (node.wrapper.data as Node).expressionLevel = undefined;
        updatedNodes.push(node);
      }
      this.nodeData.nodes.update(updatedNodes);
    } else {
      this.selectedTissue = tissue;
      const minExp = 0.3;
      this.http.get<Array<{ protein: Node, level: number }>>(
        `${environment.backend}tissue_expression/?tissue=${tissue.id}&token=${this.token}`)
        .subscribe((levels) => {
          const updatedNodes = [];
          const maxExpr = Math.max(...levels.map(lvl => lvl.level));
          for (const lvl of levels) {
            const item = getWrapperFromNode(lvl.protein);
            const node = this.nodeData.nodes.get(item.nodeId);
            if (!node) {
              continue;
            }
            const gradient = lvl.level !== null ? (Math.pow(lvl.level / maxExpr, 1 / 3) * (1 - minExp) + minExp) : -1;
            const pos = this.network.getPositions([item.nodeId]);
            node.x = pos[item.nodeId].x;
            node.y = pos[item.nodeId].y;
            Object.assign(node,
              NetworkSettings.getNodeStyle(
                node.wrapper.type,
                node.isSeed,
                this.analysis.inSelection(item),
                undefined,
                undefined,
                gradient));
            node.wrapper = item;
            node.gradient = gradient;
            this.proteins.find(prot => getProteinNodeId(prot) === item.nodeId).expressionLevel = lvl.level;
            (node.wrapper.data as Node).expressionLevel = lvl.level;
            updatedNodes.push(node);
          }
          this.nodeData.nodes.update(updatedNodes);
        });
    }
    this.emitVisibleItems(true);*/
  }

}


