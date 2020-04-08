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
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {AnalysisService} from '../../analysis.service';
import {Protein, Task, NodeType, ViralProtein, Drug} from '../../interfaces';
import html2canvas from 'html2canvas';
import {toast} from 'bulma-toast';

declare var vis: any;

interface Scored {
  score: number;  // Normalized or unnormalized (whichever user selects, will be displayed in the table)
  rawScore: number;  // Unnormalized (kept to restore unnormalized value)
}

@Component({
  selector: 'app-analysis-window',
  templateUrl: './analysis-window.component.html',
  styleUrls: ['./analysis-window.component.scss']
})
export class AnalysisWindowComponent implements OnInit, OnChanges {

  constructor(private http: HttpClient, public analysis: AnalysisService) {
  }

  @Input() token: string | null = null;

  @Output() tokenChange = new EventEmitter<string | null>();
  @Output() showDetailsChange: EventEmitter<any> = new EventEmitter();


  public task: Task | null = null;
  public indexscreenshot = 1;


  @ViewChild('network', {static: false}) networkEl: ElementRef;

  private network: any;
  private nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};
  private drugNodes: any[] = [];
  private drugEdges: any[] = [];
  public showDrugs = false;
  public tab = 'network';
  public physicsEnabled = true;


  private proteins: any;
  public effects: any;

  public tableDrugs: Array<Drug & Scored> = [];
  public tableProteins: Array<Protein & Scored> = [];
  public tableViralProteins: Array<ViralProtein & Scored> = [];
  public tableNormalize = false;
  public tableHasScores = false;

  @Output() visibleItems: EventEmitter<any> = new EventEmitter();

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
        const options = {
          layout: {
            improvedLayout: false,
          },
          edges: {
            smooth: false,
          },
          physics: {
            enabled: this.physicsEnabled,
            stabilization: {
              enabled: false,
            },
          },
        };

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

        this.tableHasScores = this.task.info.algorithm === 'trustrank';
        if (this.tableHasScores) {
          this.toggleNormalization(true);
        }

        this.network.on('deselectNode', (properties) => {
          this.showDetailsChange.emit([false, [null, null, null, null, null, null]]);
        });

        this.network.on('selectNode', (properties) => {
          const selectedNodes = this.nodeData.nodes.get(properties.nodes);
          if (selectedNodes.length > 0) {
            let selectedItem;
            let selectedName;
            let selectedType;
            let selectedId;
            let selectedVirusName;
            let selectedStatus;
            if (selectedNodes[0].nodeType === 'host') {
              const protein: Protein = selectedNodes[0].details;
              selectedVirusName = null;
              selectedStatus = null;
              selectedItem = {name: selectedNodes[0].id, type: 'Host Protein', data: protein};
              // TODO use gene name here
              selectedName = protein.proteinAc;
              selectedId = protein.proteinAc;
              selectedType = 'Host Protein';
              if (properties.event.srcEvent.ctrlKey) {
                if (this.analysis.inSelection(protein.proteinAc)) {
                  this.analysis.removeItem(protein.proteinAc);
                } else {
                  this.analysis.addItem({name: protein.proteinAc, type: 'Host Protein', data: protein});
                  this.analysis.getCount();
                }
              }
            } else if (selectedNodes[0].nodeType === 'virus') {
              const virus: ViralProtein = selectedNodes[0].details;
              selectedId = null;
              selectedStatus = null;
              selectedItem = {name: virus.effectId, type: 'Viral Protein', data: virus};
              selectedVirusName = virus.virusName;
              selectedName = virus.effectName;
              selectedType = 'Viral Protein';
              if (properties.event.srcEvent.ctrlKey) {
                if (this.analysis.inSelection(virus.effectName)) {
                  this.analysis.removeItem(virus.effectName);
                } else {
                  this.analysis.addItem(selectedItem);
                  this.analysis.getCount();
                }
              }
            } else if (selectedNodes[0].nodeType === 'drug') {
              const drug: Drug = selectedNodes[0].details;
              selectedId = drug.drugId;
              selectedStatus = drug.status;
              selectedName = drug.name;
              selectedType = 'Drug';
              selectedItem = {name: drug.name, type: 'Drug', data: drug};
              selectedVirusName = null;
            }
            this.showDetailsChange.emit([true, [selectedItem, selectedName, selectedType,
              selectedId, selectedVirusName, selectedStatus]]);
          } else {
            this.showDetailsChange.emit([false, [null, null, null, null, null, null]]);
          }
        });

        this.analysis.subscribe((item, selected) => {
          const nodeId = item.name;
          const node = this.nodeData.nodes.get(nodeId);
          if (!node) {
            return;
          }
          const pos = this.network.getPositions([nodeId]);
          node.x = pos[nodeId].x;
          node.y = pos[nodeId].y;
          const {color} = this.getNodeLooks(nodeId, node.nodeType, node.isSeed);
          node.color = color;
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

  public inferNodeType(nodeId: string): 'host' | 'virus' | 'drug' {
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

    const nodeAttributes = result.nodeAttributes || [];

    this.proteins = [];
    this.effects = [];
    for (let i = 0; i < result.networks.length; i++) {
      const network = result.networks[i];

      const attributes = nodeAttributes[i] || {};
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
        nodes.push(this.mapNode(node, nodeTypes[node] || this.inferNodeType(node), isSeed[node], scores[node], details[node]));
      }

      for (const edge of network.edges) {
        edges.push(this.mapEdge(edge));
      }
    }

    return {
      nodes,
      edges,
    };
  }

  private getNodeLooks(nodeId: string, nodeType: NodeType, isSeed: boolean):
    { color: string, shape: string, size: number, font: any, shadow: boolean } {
    let color = '';
    let shape = '';
    let size = 10;
    let font = {};
    let shadow = false;

    if (nodeType === 'host') {
      shape = 'ellipse';
      if (this.analysis.inSelection(nodeId)) {
        color = '#c7661c';
      } else {
        color = '#e2b600';
      }
      size = 10;
    } else if (nodeType === 'virus') {
      shape = 'box';
      color = '#118AB2';
      size = 12;
      font = {color: 'white'};
      shadow = true;
    } else if (nodeType === 'drug') {
      shape = 'ellipse';
      color = '#26b28b';
      size = 6;
    }

    if (isSeed) {
      color = '#c064c7';
    }

    return {color, shape, size, font, shadow};
  }

  private mapNode(nodeId: any, nodeType?: NodeType, isSeed?: boolean, score?: number, details?): any {
    const {shape, color, size, font, shadow} = this.getNodeLooks(nodeId, nodeType, isSeed);
    return {
      id: nodeId,
      label: nodeId,
      size, color, shape, font, shadow,
      nodeType, isSeed, details
    };
  }

  private mapEdge(edge: any): any {
    return {
      from: `${edge.from}`,
      to: `${edge.to}`,
      color: {color: '#afafaf', highlight: '#854141'},
    };
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
      const result = await this.http.get<any>(`${environment.backend}drug_interactions/?proteins=${JSON.stringify(proteinAcs)}`).toPromise();
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
          this.drugNodes.push(this.mapNode(drug.drugId, 'drug', false, null, drug));
        }

        for (const interaction of edges) {
          const edge = {from: interaction.proteinAc, to: interaction.drugId};
          this.drugEdges.push(this.mapEdge(edge));
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

}
