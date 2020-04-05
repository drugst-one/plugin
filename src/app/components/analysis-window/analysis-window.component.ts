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
import {Protein, Task} from '../../interfaces';

declare var vis: any;

@Component({
  selector: 'app-analysis-window',
  templateUrl: './analysis-window.component.html',
  styleUrls: ['./analysis-window.component.scss']
})
export class AnalysisWindowComponent implements OnInit, OnChanges {

  @Input() token: string | null = null;
  @Output() tokenChange = new EventEmitter<string | null>();

  public task: Task | null = null;

  @ViewChild('network', {static: false}) networkEl: ElementRef;

  private network: any;
  private nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};
  private drugNodes = [];
  public showDrugs = false;
  private result: any;

  constructor(private http: HttpClient, private analysis: AnalysisService) {
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
        const result = await this.http.get<any>(`${environment.backend}result/?token=${this.token}`).toPromise();
        this.result = result;
        this.networkEl.nativeElement.innerHTML = '';
        this.network = null;
        this.showDrugs = false;
        this.nodeData = {nodes: null, edges: null};
        this.createNetwork(result);
      }
    }
  }

  private async getTask(token: string): Promise<any> {
    return await this.http.get(`${environment.backend}task/?token=${token}`).toPromise();
  }

  close() {
    this.token = null;
    this.tokenChange.emit(this.token);
  }

  discard() {

  }

  export() {

  }

  public async createNetwork(result: any) {
    const {nodes, edges} = this.mapDataToNodes(result);
    this.nodeData.nodes = new vis.DataSet(nodes);
    this.nodeData.edges = new vis.DataSet(edges);

    const container = this.networkEl.nativeElement;
    const options = {
      layout: {
        improvedLayout: false,
      },
    };

    this.network = new vis.Network(container, this.nodeData, options);
    this.network.on('select', (properties) => {
      const id: Array<string> = properties.nodes;
      if (id.length > 0) {
        if (id[0].startsWith('p_')) {
          const protein = this.getProtein(id[0].substr(2));
          if (properties.event.srcEvent.ctrlKey) {
            if (this.inSelection(protein.proteinAc) === true) {
              this.removeFromSelection(protein.proteinAc);
            } else {
              this.addToSelection(protein.proteinAc);
              this.analysis.getCount();
            }
          }
        }
      }
    });

    this.analysis.subscribe((protein, selected) => {
      const nodeId = `p_${protein.proteinAc}`;
      const node = this.nodeData.nodes.get(nodeId);
      if (!node) {
        return;
      }
      const pos = this.network.getPositions([nodeId]);
      node.x = pos[nodeId].x;
      node.y = pos[nodeId].y;
      if (selected) {
        node.color = '#c42eff';
        this.nodeData.nodes.update(node);
      } else {
        node.color = '#e2b600';
        this.nodeData.nodes.update(node);
      }
    });
  }

  inSelection(proteinAc: string): boolean {
    if (!this.result.proteins || !proteinAc) {
      return false;
    }
    const protein = this.getProtein(proteinAc);
    if (!protein) {
      return false;
    }
    return this.analysis.inSelection(protein);
  }

  addToSelection(proteinAc: string) {
    if (!this.result.proteins || !proteinAc) {
      return false;
    }
    const protein = this.getProtein(proteinAc);
    if (!protein) {
      return false;
    }
    this.analysis.addProtein(protein);
  }

  removeFromSelection(proteinAc: string) {
    if (!this.result.proteins || !proteinAc) {
      return false;
    }
    const protein = this.getProtein(proteinAc);
    if (!protein) {
      return false;
    }
    this.analysis.removeProtein(protein);
  }

  public getProtein(ac: string): Protein | undefined {
    return this.result.proteins.find((p) => p.proteinAc === ac);
  }


  private mapProteinToNode(protein: any): any {
    let color = '#e2b600';
    if (this.analysis.inSelection(protein)) {
      color = '#c42eff';
    }
    return {
      id: `p_${protein.proteinAc}`,
      label: `${protein.proteinAc}`,
      size: 10, color, shape: 'ellipse', shadow: false,
    };
  }

  private mapDrugToNode(drug: any): any {
    let color = '#ffffff';
    if (drug.status === 'investigational') {
      color = '#ffa066';
    } else if (drug.status === 'approved') {
      color = '#a0ff66';
    }
    return {
      id: `d_${drug.drugId}`,
      label: `${drug.name}`,
      size: 10, color, shape: 'ellipse', shadow: true, font: {color: '#000000', size: 5},
    };
  }

  private mapProteinProteinInteractionToEdge(edge: any): any {
    return {
      from: `p_${edge.from}`,
      to: `p_${edge.to}`,
      color: {color: '#afafaf', highlight: '#854141'},
    };
  }

  private mapDrugProteinInteractionToEdge(edge: any): any {
    return {
      from: `p_${edge.proteinAc}`,
      to: `d_${edge.drugId}`,
      color: {color: '#afafaf', highlight: '#854141'},
    };
  }

  private mapDataToNodes(result: any): { nodes: any[], edges: any[] } {
    const nodes = [];
    const edges = [];

    for (const protein of result.proteins) {
      nodes.push(this.mapProteinToNode(protein));
    }

    this.drugNodes = [];
    for (const drug of result.drugs) {
      this.drugNodes.push(this.mapDrugToNode(drug));
    }

    for (const network of result.networks) {
      for (const edge of network.ppEdges) {
        edges.push(this.mapProteinProteinInteractionToEdge(edge));
      }
    }

    for (const edge of result.dpEdges) {
      edges.push(this.mapDrugProteinInteractionToEdge(edge));
    }

    return {
      nodes,
      edges,
    };
  }

  public toggleDrugs(bool) {
    this.showDrugs = bool;

    if (!this.showDrugs) {
      this.nodeData.nodes.remove(this.drugNodes);
    } else {
      this.nodeData.nodes.add(this.drugNodes);
    }
  }

}
