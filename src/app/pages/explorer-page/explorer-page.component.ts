import {
  AfterViewInit,
  Component,
  ElementRef, Input,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  NodeInteraction,
  Node,
  Wrapper,
  getWrapperFromProtein,
  Tissue
} from '../../interfaces';
import {ProteinNetwork} from '../../main-network';
import {HttpClient} from '@angular/common/http';
import {AnalysisService} from '../../analysis.service';
import html2canvas from 'html2canvas';
import {NetworkSettings} from '../../network-settings';
import {defaultConfig, IConfig} from '../../config';


declare var vis: any;

@Component({
  selector: 'app-explorer-page',
  templateUrl: './explorer-page.component.html',
  styleUrls: ['./explorer-page.component.scss'],
})
export class ExplorerPageComponent implements OnInit, AfterViewInit {

  private networkJSON = '{"nodes": [], "edges": []}';

  public myConfig: IConfig = JSON.parse(JSON.stringify(defaultConfig));

  @Input()
  public onload: undefined | string;

  @Input()
  public set config(config: string | undefined) {
    if (typeof config === 'undefined') {
      return;
    }

    const configObj = JSON.parse(config);
    for (const key of Object.keys(configObj)) {
      if (key === 'nodeGroups' || key === 'edgeGroups') {
        this.myConfig[key] = {...this.myConfig[key], ...configObj[key]};
        continue;
      }
      this.myConfig[key] = configObj[key];
    }
  }

  @Input()
  public set network(network: string | undefined) {
    if (typeof network === 'undefined') {
      return;
    }

    this.networkJSON = network;

    this.createNetwork();
  }

  public get network() {
    return this.networkJSON;
  }

  public showDetails = false;
  public selectedWrapper: Wrapper | null = null;

  public collapseAnalysisQuick = true;
  public collapseAnalysis = true;
  public collapseDetails = true;
  public collapseTask = true;
  public collapseSelection = true;
  public collapseBaitFilter = true;
  public collapseQuery = true;
  public collapseData = true;
  public collapseOverview = true;

  public proteinData: ProteinNetwork;

  public proteins: any;
  public edges: any;

  private networkInternal: any;
  public nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};

  private dumpPositions = false;
  public physicsEnabled = false;

  public queryItems: Wrapper[] = [];
  public showAnalysisDialog = false;
  public showThresholdDialog = false;
  public analysisDialogTarget: 'drug' | 'drug-target';

  public showCustomProteinsDialog = false;

  public selectedAnalysisToken: string | null = null;

  public currentDataset = [];

  public currentViewProteins: Node[];
  public currentViewSelectedTissue: Tissue | null = null;
  public currentViewNodes: any[];

  public expressionExpanded = false;
  public selectedTissue: Tissue | null = null;

  @Input()
  public textColor = 'red';

  @ViewChild('network', {static: false}) networkEl: ElementRef;

  constructor(private http: HttpClient, public analysis: AnalysisService) {

    this.showDetails = false;

    this.analysis.subscribeList((items, selected) => {
      if (!this.nodeData.nodes) {
        return;
      }
      if (selected !== null) {
        if (items.length === 0) {
          return;
        }
        const updatedNodes = [];
        for (const item of items) {
          const node = this.nodeData.nodes.get(item.id);
          if (!node) {
            continue;
          }
          const pos = this.networkInternal.getPositions([item.id]);
          node.x = pos[item.id].x;
          node.y = pos[item.id].y;
          node.x = pos[item.id].x;
          node.y = pos[item.id].y;
          Object.assign(node, this.myConfig.nodeGroups[node.group]);
          updatedNodes.push(node);
        }
        this.nodeData.nodes.update(updatedNodes);
      } else {
        const updatedNodes = [];
        this.nodeData.nodes.forEach((node) => {
          const nodeSelected = this.analysis.idInSelection(node.id);
          Object.assign(node, this.myConfig.nodeGroups[node.group]);
        });
        this.nodeData.nodes.update(updatedNodes);
      }
    });
  }

  ngOnInit() {
  }

  async ngAfterViewInit() {
    this.createNetwork();

    if (this.onload) {
      // tslint:disable-next-line:no-eval
      eval(this.onload);
    }
  }

  private getNetwork() {
    const network = JSON.parse(this.networkJSON);

    this.proteins = network.nodes;
    this.edges = network.edges;
  }

  private zoomToNode(id: string) {
    this.nodeData.nodes.getIds();
    const coords = this.networkInternal.getPositions(id)[id];
    if (!coords) {
      return;
    }
    let zoomScale = null;
    if (id.startsWith('eff')) {
      zoomScale = 1.0;
    } else {
      zoomScale = 3.0;
    }
    this.networkInternal.moveTo({
      position: {x: coords.x, y: coords.y},
      scale: zoomScale,
      animation: true,
    });
  }

  public async openSummary(item: Wrapper, zoom: boolean) {
    this.selectedWrapper = item;
    if (zoom) {
      this.zoomToNode(item.nodeId);
    }
    this.showDetails = true;
  }

  public async closeSummary() {
    this.selectedWrapper = null;
    this.showDetails = false;
  }

  public async createNetwork() {
    this.analysis.resetSelection();
    this.selectedWrapper = null;
    this.getNetwork();
    this.proteinData = new ProteinNetwork(this.proteins, this.edges);
    this.proteinData.linkNodes();

    // Populate baits
    const effectNames = [];

    const {nodes, edges} = this.mapDataToNodes(this.proteinData);
    this.nodeData.nodes = new vis.DataSet(nodes);
    this.nodeData.edges = new vis.DataSet(edges);

    const container = this.networkEl.nativeElement;
    const options = NetworkSettings.getOptions('main');
    this.networkInternal = new vis.Network(container, this.nodeData, options);
    this.networkInternal.on('doubleClick', (properties) => {
      const nodeIds: Array<string> = properties.nodes;
      if (nodeIds.length > 0) {
        const nodeId = nodeIds[0];
        const node = this.nodeData.nodes.get(nodeId);
        if (this.analysis.inSelection(node)) {
          this.analysis.removeItems([node]);
        } else {
          this.analysis.addItems([node]);
        }
      }
    });

    this.networkInternal.on('click', (properties) => {
      const nodeIds: Array<string> = properties.nodes;
      if (nodeIds.length > 0) {
        const nodeId = nodeIds[0];
        const node = this.nodeData.nodes.get(nodeId);
        const wrapper = node.wrapper;
        this.openSummary(wrapper, false);
      } else {
        this.closeSummary();
      }
    });
    this.networkInternal.on('deselectNode', (properties) => {
      this.closeSummary();
    });

    if (this.selectedWrapper) {
      this.zoomToNode(this.selectedWrapper.nodeId);
    }

    this.queryItems = [];
    this.fillQueryItems(this.proteins);
    if (this.selectedWrapper) {
      this.networkInternal.selectNodes([this.selectedWrapper.nodeId]);
    }
  }

  fillQueryItems(hostProteins: Node[]) {
    this.queryItems = [];
    hostProteins.forEach((protein) => {
      this.queryItems.push(getWrapperFromProtein(protein));
    });

    this.currentViewNodes = this.nodeData.nodes;
    this.currentViewProteins = this.proteins;
  }

  public queryAction(item: any) {
    if (item) {
      this.openSummary(item, true);
    }
  }

  public updatePhysicsEnabled(bool) {
    this.physicsEnabled = bool;
    this.networkInternal.setOptions({
      physics: {
        enabled: this.physicsEnabled,
        stabilization: {
          enabled: false,
        },
      }
    });
  }

  private mapCustomNode(customNode: Node): any {
    let group = customNode.group;
    if (typeof group === 'undefined' || typeof this.myConfig.nodeGroups[group] === 'undefined') {
      group = 'default';
    }
    const node = JSON.parse(JSON.stringify(this.myConfig.nodeGroups[group]));
    let nodeLabel = customNode.name;
    if (customNode.name.length === 0) {
      nodeLabel = customNode.id;
    }
    node.label = nodeLabel;
    node.id = customNode.id;
    node.x = customNode.x;
    node.y = customNode.y;
    return node;
  }

  private mapCustomEdge(customEdge: NodeInteraction): any {
    let group = customEdge.group;
    if (typeof group === 'undefined' || typeof this.myConfig.edgeGroups[group] === 'undefined') {
      group = 'default';
    }
    const edge = JSON.parse(JSON.stringify(this.myConfig.edgeGroups[group]));
    edge.from = customEdge.from;
    edge.to = customEdge.to;
    return edge;
  }

  private mapDataToNodes(data: ProteinNetwork): { nodes: any[], edges: any[] } {
    const nodes = [];
    const edges = [];

    for (const protein of data.proteins) {
      nodes.push(this.mapCustomNode(protein));
    }

    for (const edge of data.edges) {
      edges.push(this.mapCustomEdge(edge));
    }

    return {
      nodes,
      edges,
    };
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

  analysisWindowChanged($event: [any[], [Node[], Tissue]]) {
    if ($event) {
      this.currentViewNodes = $event[0];
      this.currentViewProteins = $event[1][0];
      this.currentViewSelectedTissue = $event[1][1];
    } else {
      this.currentViewNodes = this.nodeData.nodes;
      this.currentViewProteins = this.proteins;
      this.currentViewSelectedTissue = this.selectedTissue;
    }
  }

  gProfilerLink(): string {
    const queryString = this.analysis.getSelection()
      .filter(wrapper => wrapper.group === 'protein')
      .map(wrapper => wrapper.access)
      .join('%0A');
    return 'http://biit.cs.ut.ee/gprofiler/gost?' +
      'organism=hsapiens&' +
      `query=${queryString}&` +
      'ordered=false&' +
      'all_results=false&' +
      'no_iea=false&' +
      'combined=false&' +
      'measure_underrepresentation=false&' +
      'domain_scope=annotated&' +
      'significance_threshold_method=g_SCS&' +
      'user_threshold=0.05&' +
      'numeric_namespace=ENTREZGENE_ACC&' +
      'sources=GO:MF,GO:CC,GO:BP,KEGG,TF,REAC,MIRNA,HPA,CORUM,HP,WP&' +
      'background=';
  }

  public selectTissue(tissue: Tissue | null) {
    this.expressionExpanded = false;
    if (!tissue) {
      this.selectedTissue = null;
      const updatedNodes = [];
      for (const item of this.proteins) {
        const node = this.nodeData.nodes.get(item.nodeId);
        if (!node) {
          continue;
        }
        const pos = this.networkInternal.getPositions([item.nodeId]);
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
        // protein.expressionLevel = undefined;
        (node.wrapper.data as Node).expressionLevel = undefined;
        updatedNodes.push(node);
      }
      this.nodeData.nodes.update(updatedNodes);
    } else {
      this.selectedTissue = tissue;

      const minExp = 0.3;

      // const params = new HttpParams().set('tissue', `${tissue.id}`).set('data', JSON.stringify(this.currentDataset));
      // this.http.get<any>(
      //   `${environment.backend}tissue_expression/`, {params})
      //   .subscribe((levels) => {
      //     const updatedNodes = [];
      //     const maxExpr = Math.max(...levels.map(lvl => lvl.level));
      //     for (const lvl of levels) {
      //       const item = getWrapperFromProtein(lvl.protein);
      //       const node = this.nodeData.nodes.get(item.nodeId);
      //       if (!node) {
      //         continue;
      //       }
      //       const gradient = lvl.level !== null ? (Math.pow(lvl.level / maxExpr, 1 / 3) * (1 - minExp) + minExp) : -1;
      //       const pos = this.network.getPositions([item.nodeId]);
      //       node.x = pos[item.nodeId].x;
      //       node.y = pos[item.nodeId].y;
      //       Object.assign(node,
      //         NetworkSettings.getNodeStyle(
      //           node.wrapper.type,
      //           node.isSeed,
      //           this.analysis.inSelection(item),
      //           undefined,
      //           undefined,
      //           gradient));
      //       node.wrapper = item;
      //       node.gradient = gradient;
      //       this.proteins.find(prot => getProteinNodeId(prot) === item.nodeId).expressionLevel = lvl.level;
      //       (node.wrapper.data as Protein).expressionLevel = lvl.level;
      //       updatedNodes.push(node);
      //     }
      //     this.nodeData.nodes.update(updatedNodes);
      //   });

    }

    this.currentViewSelectedTissue = this.selectedTissue;
  }

}
