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
import {AnalysisService, algorithmNames} from '../../analysis.service';
import {
  Protein,
  Task,
  ViralProtein,
  Drug,
  Wrapper,
  WrapperType,
  getWrapperFromProtein,
  getWrapperFromDrug,
  getWrapperFromViralProtein,
  getNodeIdsFromPDI,
  getNodeIdsFromPPI,
  getViralProteinNodeId,
  getProteinNodeId
} from '../../interfaces';
import html2canvas from 'html2canvas';
import {toast} from 'bulma-toast';
import {NetworkSettings} from '../../network-settings';

declare var vis: any;

interface Scored {
  score: number;  // Normalized or unnormalized (whichever user selects, will be displayed in the table)
  rawScore: number;  // Unnormalized (kept to restore unnormalized value)
}

@Component({
  selector: 'app-analysis-window',
  templateUrl: './analysis-window.component.html',
  styleUrls: ['./analysis-window.component.scss'],
})
export class AnalysisWindowComponent implements OnInit, OnChanges {

  @ViewChild('network', {static: false}) networkEl: ElementRef;

  @Input() token: string | null = null;

  @Output() tokenChange = new EventEmitter<string | null>();
  @Output() showDetailsChange = new EventEmitter<Wrapper>();
  @Output() visibleItems = new EventEmitter<any>();

  public task: Task | null = null;

  private network: any;
  private nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};
  private drugNodes: any[] = [];
  private drugEdges: any[] = [];
  public showDrugs = false;
  public tab: 'meta' | 'network' | 'table' = 'table';
  public physicsEnabled = true;

  private proteins: any;
  public effects: any;

  public tableDrugs: Array<Drug & Scored> = [];
  public tableProteins: Array<Protein & Scored> = [];
  public tableSelectedProteins: Array<Protein & Scored> = [];
  public tableViralProteins: Array<ViralProtein & Scored> = [];
  public tableSelectedViralProteins: Array<ViralProtein & Scored> = [];
  public tableNormalize = false;
  public tableHasScores = false;

  public algorithmNames = algorithmNames;

  constructor(private http: HttpClient, public analysis: AnalysisService) {
  }

  async ngOnInit() {
  }

  async ngOnChanges(changes: SimpleChanges) {
    await this.refresh();
  }

  private async refresh() {
    if (this.token) {
      this.task = await this.getTask(this.token);

      if (this.task && this.task.info.done) {
        const result = await this.http.get<any>(`${environment.backend}task_result/?token=${this.token}`).toPromise();

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
        const options = NetworkSettings.getOptions('analysis');

        this.network = new vis.Network(container, this.nodeData, options);

        const promises: Promise<any>[] = [];
        promises.push(this.http.get<any>(`${environment.backend}task_result/?token=${this.token}&view=proteins`).toPromise()
          .then((table) => {
            this.tableProteins = table;
            this.tableSelectedProteins = [];
            this.tableProteins.forEach((r) => {
              r.rawScore = r.score;
              if (this.analysis.proteinInSelection(r)) {
                this.tableSelectedProteins.push(r);
              }
            });
          }));
        promises.push(this.http.get<any>(`${environment.backend}task_result/?token=${this.token}&view=viral_proteins`).toPromise()
          .then((table) => {
            this.tableViralProteins = table;
            this.tableViralProteins.forEach((r) => r.rawScore = r.score);
          }));
        promises.push(this.http.get<any>(`${environment.backend}task_result/?token=${this.token}&view=drugs`).toPromise()
          .then((table) => {
            this.tableDrugs = table;
            this.tableDrugs.forEach((r) => r.rawScore = r.score);
          }));
        await Promise.all(promises);

        this.tableHasScores = ['trustrank', 'closeness', 'degree', 'quick', 'super'].indexOf(this.task.info.algorithm) !== -1;
        if (this.tableHasScores) {
          this.toggleNormalization(true);
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
              const node = this.nodeData.nodes.get(item.nodeId);
              if (!node) {
                continue;
              }
              const pos = this.network.getPositions([item.nodeId]);
              node.x = pos[item.nodeId].x;
              node.y = pos[item.nodeId].y;
              Object.assign(node, NetworkSettings.getNodeStyle(node.wrapper.type, node.isSeed, selected));
              updatedNodes.push(node);
            }
            this.nodeData.nodes.update(updatedNodes);

            const proteinSelection = this.tableSelectedProteins;
            const viralProteinSelection = this.tableSelectedViralProteins;
            for (const item of items) {
              if (item.type === 'host') {
                // TODO: Refactor!
                const found = proteinSelection.findIndex((i) => getProteinNodeId(i) === item.nodeId);
                const tableItem = this.tableProteins.find((i) => getProteinNodeId(i) === item.nodeId);
                if (selected && found === -1 && tableItem) {
                  proteinSelection.push(tableItem);
                }
                if (!selected && found !== -1 && tableItem) {
                  proteinSelection.splice(found, 1);
                }
              } else if (item.type === 'virus') {
                // TODO: Refactor!
                const found = viralProteinSelection.findIndex((i) => getViralProteinNodeId(i) === item.nodeId);
                const tableItem = this.tableViralProteins.find((i) => getViralProteinNodeId(i) === item.nodeId);
                if (selected && found === -1 && tableItem) {
                  viralProteinSelection.push(tableItem);
                }
                if (!selected && found !== -1 && tableItem) {
                  viralProteinSelection.splice(found, 1);
                }
              }
            }
            this.tableSelectedProteins = [...proteinSelection];
            this.tableSelectedViralProteins = [...viralProteinSelection];
          } else {
            const updatedNodes = [];
            this.nodeData.nodes.forEach((node) => {
              const nodeSelected = this.analysis.idInSelection(node.id);
              if (selected !== nodeSelected) {
                Object.assign(node, NetworkSettings.getNodeStyle(node.wrapper.type, node.isSeed, selected));
                updatedNodes.push(node);
              }
            });
            this.nodeData.nodes.update(updatedNodes);

            const proteinSelection = [];
            const viralProteinSelection = [];
            for (const item of items) {
              if (item.type === 'host') {
                const tableItem = this.tableProteins.find((i) => getProteinNodeId(i) === item.nodeId);
                if (tableItem) {
                  proteinSelection.push(tableItem);
                }
              } else if (item.type === 'virus') {
                const tableItem = this.tableViralProteins.find((i) => getViralProteinNodeId(i) === item.nodeId);
                if (tableItem) {
                  viralProteinSelection.push(tableItem);
                }
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
      this.visibleItems.emit([this.nodeData.nodes, [this.proteins, this.effects]]);
    } else {
      this.visibleItems.emit(null);
    }
  }

  private async getTask(token: string): Promise<any> {
    return await this.http.get(`${environment.backend}task/?token=${token}`).toPromise();
  }

  close() {
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

  public inferNodeType(nodeId: string): WrapperType {
    if (nodeId.indexOf('-') !== -1 || nodeId.indexOf('_') !== -1) {
      return 'virus';
    } else if (nodeId.startsWith('DB')) {
      return 'drug';
    }
    return 'host';
  }

  public createNetwork(result: any): { edges: any[], nodes: any[] } {
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
      if (nodeTypes[node] === 'host') {
        this.proteins.push(details[node]);
        wrappers[node] = getWrapperFromProtein(details[node]);
      } else if (nodeTypes[node] === 'virus') {
        this.effects.push(details[node]);
        wrappers[node] = getWrapperFromViralProtein(details[node]);
      } else if (nodeTypes[node] === 'drug') {
        wrappers[node] = getWrapperFromDrug(details[node]);
      }
      nodes.push(this.mapNode(this.inferNodeType(node), details[node], isSeed[node], scores[node]));
    }

    for (const edge of network.edges) {
      edges.push(this.mapEdge(edge, 'protein-protein', wrappers));
    }

    for (const edge of network.edges) {
      edges.push(this.mapEdge(edge, 'protein-protein', wrappers));
    }

    return {
      nodes,
      edges,
    };
  }

  private mapNode(nodeType: WrapperType, details: Protein | ViralProtein | Drug, isSeed?: boolean, score?: number): any {
    let nodeLabel;
    let wrapper: Wrapper;
    let drugType;
    if (nodeType === 'host') {
      const protein = details as Protein;
      wrapper = getWrapperFromProtein(protein);
      nodeLabel = protein.name;
      if (!protein.name) {
        nodeLabel = protein.proteinAc;
      }
    } else if (nodeType === 'drug') {
      const drug = details as Drug;
      wrapper = getWrapperFromDrug(drug);
      drugType = drug.status;
      if (drugType === 'approved') {
        nodeLabel = drug.name;
      } else {
        nodeLabel = drug.drugId;
      }
    } else if (nodeType === 'virus') {
      const viralProtein = details as ViralProtein;
      wrapper = getWrapperFromViralProtein(viralProtein);
      nodeLabel = viralProtein.effectName;
    }

    const node = NetworkSettings.getNodeStyle(nodeType, isSeed, this.analysis.inSelection(wrapper), drugType);
    node.id = wrapper.nodeId;
    node.label = nodeLabel;
    node.nodeType = nodeType;
    node.isSeed = isSeed;
    node.wrapper = wrapper;

    return node;
  }

  private mapEdge(edge: any, type: 'protein-protein' | 'to-drug', wrappers?: { [key: string]: Wrapper }): any {
    let edgeColor;
    if (type === 'protein-protein') {
      edgeColor = {
        color: NetworkSettings.getColor('edgeHostVirus'),
        highlight: NetworkSettings.getColor('edgeHostVirusHighlight'),
      };
      const {from, to} = getNodeIdsFromPPI(edge, wrappers);
      return {
        from, to,
        color: edgeColor,
      };
    } else if (type === 'to-drug') {
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
        for (const drug of drugs) {
          this.drugNodes.push(this.mapNode('drug', drug, false, null));
        }

        for (const interaction of edges) {
          const edge = {from: interaction.proteinAc, to: interaction.drugId};
          this.drugEdges.push(this.mapEdge(edge, 'to-drug'));
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

  public toCanvas() {
    html2canvas(this.networkEl.nativeElement).then((canvas) => {
      const generatedImage = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
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
      const wrapper = getWrapperFromProtein(i);
      if (oldSelection.indexOf(i) === -1) {
        addItems.push(wrapper);
      }
    }
    for (const i of oldSelection) {
      const wrapper = getWrapperFromProtein(i);
      if (this.tableSelectedProteins.indexOf(i) === -1) {
        removeItems.push(wrapper);
      }
    }
    this.analysis.addItems(addItems);
    this.analysis.removeItems(removeItems);
  }

  public tableViralProteinSelection(e) {
    const oldSelection = [...this.tableSelectedViralProteins];
    this.tableSelectedViralProteins = e;
    const addItems = [];
    const removeItems = [];
    for (const i of this.tableSelectedViralProteins) {
      const wrapper = getWrapperFromViralProtein(i);
      if (oldSelection.indexOf(i) === -1) {
        addItems.push(wrapper);
      }
    }
    for (const i of oldSelection) {
      const wrapper = getWrapperFromViralProtein(i);
      if (this.tableSelectedViralProteins.indexOf(i) === -1) {
        removeItems.push(wrapper);
      }
    }
    this.analysis.addItems(addItems);
    this.analysis.removeItems(removeItems);
  }

}
