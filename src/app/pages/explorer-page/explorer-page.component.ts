import {
  AfterViewInit,
  Component,
  ElementRef, Input,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  ProteinViralInteraction,
  ViralProtein,
  Protein,
  Wrapper,
  getWrapperFromViralProtein,
  getWrapperFromProtein,
  getNodeIdsFromPVI,
  getViralProteinNodeId,
  getProteinNodeId,
  Dataset,
  Tissue
} from '../../interfaces';
import {ProteinNetwork, getDatasetFilename} from '../../main-network';
import {HttpClient, HttpParams} from '@angular/common/http';
import {AnalysisService} from '../../analysis.service';
import html2canvas from 'html2canvas';
import {environment} from '../../../environments/environment';
import {NetworkSettings} from '../../network-settings';
import {defaultConfig, IConfig} from "../../config";


declare var vis: any;

@Component({
  selector: 'app-explorer-page',
  templateUrl: './explorer-page.component.html',
  styleUrls: ['./explorer-page.component.scss'],
})
export class ExplorerPageComponent implements OnInit, AfterViewInit {

  private networkJSON = '{"nodes": [], "edges": []}';

  public myConfig: IConfig = defaultConfig;

  @Input()
  public onload: undefined | string;

  @Input()
  public set config(config: string | undefined) {
    if (typeof config === 'undefined') {
      return;
    }

    const configObj = JSON.parse(config);
    this.myConfig = JSON.parse(JSON.stringify(defaultConfig));
    for (const key of Object.keys(configObj)) {
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
  public collapseAnalysis = false;
  public collapseDetails = true;
  public collapseTask = true;
  public collapseSelection = true;
  public collapseBaitFilter = true;
  public collapseQuery = true;
  public collapseData = true;
  public collapseOverview = true;

  public viralProteinCheckboxes: Array<{ checked: boolean; data: ViralProtein }> = [];

  public proteinData: ProteinNetwork;

  public proteins: any;
  public effects: any;
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

  public currentViewProteins: Protein[];
  public currentViewViralProteins: ViralProtein[];
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
          const node = this.nodeData.nodes.get(item.nodeId);
          if (!node) {
            continue;
          }
          const pos = this.networkInternal.getPositions([item.nodeId]);
          node.x = pos[item.nodeId].x;
          node.y = pos[item.nodeId].y;
          node.x = pos[item.nodeId].x;
          node.y = pos[item.nodeId].y;
          Object.assign(node, NetworkSettings.getNodeStyle(
            node.wrapper.type,
            true,
            selected,
            undefined,
            undefined,
            node.gradient));
          updatedNodes.push(node);
        }
        this.nodeData.nodes.update(updatedNodes);
      } else {
        const updatedNodes = [];
        this.nodeData.nodes.forEach((node) => {
          const nodeSelected = this.analysis.idInSelection(node.id);
          Object.assign(node, NetworkSettings.getNodeStyle(
            node.wrapper.type,
            true,
            nodeSelected,
            undefined,
            undefined,
            node.gradient));
          updatedNodes.push(node);
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
    this.effects = [];
    this.edges = network.edges;
  }

  public reset(event) {
    const checked = event.target.checked;
    this.viralProteinCheckboxes.forEach(item => item.checked = checked);
    this.filterNodes();
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
    this.proteinData = new ProteinNetwork(this.proteins, this.effects, this.edges);
    this.proteinData.linkNodes();

    // Populate baits
    const effectNames = [];
    this.proteinData.effects.sort((a, b) => {
      return a.effectName.localeCompare(b.effectName);
    });
    this.viralProteinCheckboxes = [];
    this.proteinData.effects.forEach((effect) => {
      const effectName = effect.effectName;
      if (effectNames.indexOf(effectName) === -1) {
        effectNames.push(effectName);
        this.viralProteinCheckboxes.push({
          checked: false,
          data: effect,
        });
      }
    });

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
        const wrapper = node.wrapper;
        if (this.analysis.inSelection(wrapper)) {
          this.analysis.removeItems([wrapper]);
        } else {
          this.analysis.addItems([wrapper]);
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
    this.fillQueryItems(this.proteins, this.effects);
    if (this.selectedWrapper) {
      this.networkInternal.selectNodes([this.selectedWrapper.nodeId]);
    }
  }

  fillQueryItems(hostProteins: Protein[], viralProteins: ViralProtein[]) {
    this.queryItems = [];
    hostProteins.forEach((protein) => {
      this.queryItems.push(getWrapperFromProtein(protein));
    });

    viralProteins.forEach((viralProtein) => {
      this.queryItems.push(getWrapperFromViralProtein(viralProtein));
    });

    this.currentViewNodes = this.nodeData.nodes;
    this.currentViewProteins = this.proteins;
    this.currentViewViralProteins = this.effects;
  }

  public async filterNodes() {
    const visibleIds = new Set<string>(this.nodeData.nodes.getIds());

    const removeIds = new Set<string>();
    const addNodes = new Map<string, Node>();

    const showAll = !this.viralProteinCheckboxes.find((eff) => eff.checked);
    const connectedProteinAcs = new Set<string>();

    const filteredViralProteins = [];
    this.viralProteinCheckboxes.forEach((cb) => {
      const viralProteins: Array<ViralProtein> = [];
      this.proteinData.effects.forEach((effect) => {
        if (effect.effectName === cb.data.effectName) {
          viralProteins.push(effect);
        }
      });
      viralProteins.forEach((effect) => {
        const nodeId = getViralProteinNodeId(effect);
        const found = visibleIds.has(nodeId);
        if ((cb.checked || showAll) && !found) {
          const node = this.mapViralProteinToNode(effect);
          // this.nodeData.nodes.add(node);
          addNodes.set(node.id, node);
        } else if ((!showAll && !cb.checked) && found) {
          // this.nodeData.nodes.remove(nodeId);
          removeIds.add(nodeId);
        }
        if (cb.checked || showAll) {
          filteredViralProteins.push(effect);
          effect.proteins.forEach((pg) => {
            connectedProteinAcs.add(pg.proteinAc);
          });
        }
      });
    });
    const filteredProteins = [];
    for (const protein of this.proteinData.proteins) {
      const nodeId = getProteinNodeId(protein);
      const contains = connectedProteinAcs.has(protein.proteinAc);
      const found = visibleIds.has(nodeId);
      if (contains) {
        filteredProteins.push(protein);

        if (!found) {
          const node = this.mapHostProteinToNode(protein);
          addNodes.set(node.id, node);
        }
      } else if (found) {
        removeIds.add(nodeId);
      }
    }

    this.nodeData.nodes.remove(Array.from(removeIds.values()));
    this.nodeData.nodes.add(Array.from(addNodes.values()));
    this.fillQueryItems(filteredProteins, filteredViralProteins);
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

  private mapHostProteinToNode(hostProtein: Protein): any {
    const wrapper = getWrapperFromProtein(hostProtein);
    const node = NetworkSettings.getNodeStyle('host', true, this.analysis.inSelection(wrapper));
    let nodeLabel = hostProtein.name;
    if (hostProtein.name.length === 0) {
      nodeLabel = hostProtein.proteinAc;
    }
    node.label = nodeLabel;
    node.id = wrapper.nodeId;
    node.x = hostProtein.x;
    node.y = hostProtein.y;
    node.wrapper = wrapper;
    return node;
  }

  private mapViralProteinToNode(viralProtein: ViralProtein): any {
    const wrapper = getWrapperFromViralProtein(viralProtein);
    const node = NetworkSettings.getNodeStyle('virus', true, this.analysis.inSelection(wrapper));
    node.id = wrapper.nodeId;
    node.label = viralProtein.effectName;
    node.id = wrapper.nodeId;
    node.x = viralProtein.x;
    node.y = viralProtein.y;
    node.wrapper = wrapper;
    return node;
  }

  private mapEdge(edge: ProteinViralInteraction): any {
    const {from, to} = getNodeIdsFromPVI(edge);
    return {
      from, to,
      color: {
        color: NetworkSettings.getColor('edgeHostVirus'),
        highlight: NetworkSettings.getColor('edgeHostVirusHighlight')
      },
    };
  }

  private mapDataToNodes(data: ProteinNetwork): { nodes: any[], edges: any[] } {
    const nodes = [];
    const edges = [];

    for (const protein of data.proteins) {
      nodes.push(this.mapHostProteinToNode(protein));
    }

    for (const effect of data.effects) {
      nodes.push(this.mapViralProteinToNode(effect));
    }

    for (const edge of data.edges) {
      edges.push(this.mapEdge(edge));
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

  analysisWindowChanged($event: [any[], [Protein[], ViralProtein[], Tissue]]) {
    if ($event) {
      this.currentViewNodes = $event[0];
      this.currentViewProteins = $event[1][0];
      this.currentViewViralProteins = $event[1][1];
      this.currentViewSelectedTissue = $event[1][2];
    } else {
      this.currentViewNodes = this.nodeData.nodes;
      this.currentViewProteins = this.proteins;
      this.currentViewViralProteins = this.effects;
      this.currentViewSelectedTissue = this.selectedTissue;
    }
  }

  gProfilerLink(): string {
    const queryString = this.analysis.getSelection()
      .filter(wrapper => wrapper.type === 'host')
      .map(wrapper => wrapper.data.proteinAc)
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
      for (const protein of this.proteins) {
        const item = getWrapperFromProtein(protein);
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
        protein.expressionLevel = undefined;
        (node.wrapper.data as Protein).expressionLevel = undefined;
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
