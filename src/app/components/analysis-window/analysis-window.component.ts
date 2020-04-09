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
  Protein, Task, ViralProtein, Drug, Wrapper, WrapperType,
  getWrapperFromProtein, getWrapperFromDrug, getWrapperFromViralProtein, getNodeIdsFromPPI, getNodeIdsFromPDI
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
  public indexscreenshot = 1;

  private network: any;
  private nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};
  private drugNodes: any[] = [];
  private drugEdges: any[] = [];
  public showDrugs = false;
  public tab = 'network';
  public physicsEnabled = true;
  public drugstatus = true;

  private proteins: any;
  public effects: any;

  public tableDrugs: Array<Drug & Scored> = [];
  public tableProteins: Array<Protein & Scored> = [];
  public tableViralProteins: Array<ViralProtein & Scored> = [];
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
            this.tableProteins.forEach((r) => r.rawScore = r.score);
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

        this.tableHasScores = ['trustrank', 'closeness', 'degree', 'quick'].indexOf(this.task.info.algorithm) !== -1;
        if (this.tableHasScores) {
          this.toggleNormalization(true);
        }

        this.network.on('deselectNode', (properties) => {
          this.showDetailsChange.emit(null);
        });

        this.network.on('click', (properties) => {
          const selectedNodes = this.nodeData.nodes.get(properties.nodes);
          if (selectedNodes.length > 0) {
            const selectedNode = selectedNodes[0];
            const wrapper = selectedNode.wrapper;

            if (properties.event.srcEvent.ctrlKey) {
              if (this.analysis.inSelection(wrapper)) {
                this.analysis.removeItem(wrapper);
              } else {
                this.analysis.addItem(wrapper);
                this.analysis.getCount();
              }
            }
            this.showDetailsChange.emit(wrapper);
          } else {
            this.showDetailsChange.emit(null);
          }
        });

        this.analysis.subscribe((item, selected) => {
          const node = this.nodeData.nodes.get(item.nodeId);
          if (!node) {
            return;
          }
          const pos = this.network.getPositions([item.nodeId]);
          node.x = pos[item.nodeId].x;
          node.y = pos[item.nodeId].y;
          Object.assign(node, NetworkSettings.getNodeStyle(node.wrapper.type, node.isSeed, selected));
          this.nodeData.nodes.update(node);
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

  export() {

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
    for (const node of network.nodes) {
      if (nodeTypes[node] === 'host') {
        this.proteins.push(details[node]);
      } else if (nodeTypes[node] === 'virus') {
        this.effects.push(details[node]);
      }
      nodes.push(this.mapNode(this.inferNodeType(node), details[node], isSeed[node], scores[node]));
    }

    for (const edge of network.edges) {
      edges.push(this.mapEdge(edge, 'protein-protein'));
    }


    return {
      nodes,
      edges,
    };
  }

  private mapNode(nodeType: WrapperType, details: Protein | ViralProtein | Drug, isSeed?: boolean, score?: number): any {
    let nodeLabel;
    let wrapper: Wrapper;
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
      nodeLabel = drug.name;
    } else if (nodeType === 'virus') {
      const viralProtein = details as ViralProtein;
      wrapper = getWrapperFromViralProtein(viralProtein);
      nodeLabel = viralProtein.effectName;
    }

    const node = NetworkSettings.getNodeStyle(nodeType, isSeed, this.analysis.inSelection(wrapper));

    node.id = wrapper.nodeId;
    node.label = nodeLabel;
    node.nodeType = nodeType;
    node.isSeed = isSeed;
    node.wrapper = wrapper;
    return node;
  }

  private mapEdge(edge: any, type: 'protein-protein' | 'to-drug'): any {
    let edgeColor;
    if (type === 'protein-protein') {
      edgeColor = {
        color: NetworkSettings.getColor('edgeHostVirus'),
        highlight: NetworkSettings.getColor('edgeHostVirusHighlight')
      };
      const from = edge.from.startsWith('DB') ? `d_${edge.from}` : `p_${edge.from}`;
      const to = edge.to.startsWith('DB') ? `d_${edge.to}` : `p_${edge.to}`;
      return {
        from, to,
        color: edgeColor,
      };
    } else if (type === 'to-drug') {
      edgeColor = {
        color: NetworkSettings.getColor('edgeHostDrug'),
        highlight: NetworkSettings.getColor('edgeHostDrugHighlight')
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
      const proteinAcs = this.proteins.map((protein) => protein.proteinAc);
      // tslint:disable-next-line:max-line-length
      const result = await this.http.get<any>(`${environment.backend}drug_interactions/?proteins=${JSON.stringify(proteinAcs)}`).toPromise().catch((err: HttpErrorResponse) => {
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

  public screenshot() {
    const elem = document.getElementById(this.indexscreenshot.toString());
    html2canvas(elem).then((canvas) => {
      const generatedImage1 = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const a = document.createElement('a');
      a.href = generatedImage1;
      a.download = `Resulting_Network.png`;
      a.click();

    });
  }

  public updateshowdrugs(bool) {
    this.drugstatus = bool;

  }

}
