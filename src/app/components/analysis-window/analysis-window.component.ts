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

declare var vis: any;

@Component({
  selector: 'app-analysis-window',
  templateUrl: './analysis-window.component.html',
  styleUrls: ['./analysis-window.component.scss']
})
export class AnalysisWindowComponent implements OnInit, OnChanges {

  @Input() token: string | null = null;

  @Output() tokenChange = new EventEmitter<string | null>();
  @Output() showDetailsChange: EventEmitter<any> = new EventEmitter();


  public task: Task | null = null;
  public indexscreenshot = 1;


  @ViewChild('network', {static: false}) networkEl: ElementRef;

  private network: any;
  private nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};
  private drugNodes = [];
  public showDrugs = false;
  public tab = 'network';


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
        const options = {};

        this.network = new vis.Network(container, this.nodeData, options);
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
              const protein: Protein = {name: '', proteinAc: selectedNodes[0].id};
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
              const virus: ViralProtein = {
                viralProteinId: null,
                effectName: selectedNodes[0].id,
                virusName: null,
                datasetName: null
              };
              selectedId = null;
              selectedStatus = null;
              selectedItem = {name: virus.effectName, type: 'Viral Protein', data: virus};
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
              const drug: Drug = {
                drugId: selectedNodes[0].details.drugId,
                name: selectedNodes[0].details.name,
                status: selectedNodes[0].details.status,
              };
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

    for (let i = 0; i < result.networks.length; i++) {
      const network = result.networks[i];

      const attributes = nodeAttributes[i] || {};
      const nodeTypes = attributes.nodeTypes || {};
      const isSeed = attributes.isSeed || {};
      const scores = attributes.scores || {};
      const details = attributes.details || {};



      for (const node of network.nodes) {
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

  public toggleDrugs(bool) {
    this.showDrugs = bool;

    if (!this.showDrugs) {
      this.nodeData.nodes.remove(this.drugNodes);
    } else {
      this.nodeData.nodes.add(this.drugNodes);
    }
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
