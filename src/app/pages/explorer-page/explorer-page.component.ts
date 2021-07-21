import {
  AfterViewInit,
  Component,
  ElementRef, HostListener, Input,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  NodeInteraction,
  Node,
  Wrapper,
  getWrapperFromNode,
  Tissue,
  ExpressionMap,
  getDrugNodeId,
  Drug,
  legendContext
} from '../../interfaces';
import {mapCustomEdge, mapCustomNode, ProteinNetwork} from '../../main-network';
import {AnalysisService} from '../../services/analysis/analysis.service';
import {OmnipathControllerService} from '../../services/omnipath-controller/omnipath-controller.service';
import domtoimage from 'dom-to-image';
import {NetworkSettings} from '../../network-settings';
import {defaultConfig, EdgeGroup, IConfig, InteractionDatabase, NodeGroup} from '../../config';
import {NetexControllerService} from 'src/app/services/netex-controller/netex-controller.service';
import {rgbaToHex, rgbToHex, standardize_color} from '../../utils'
import * as merge from 'lodash/fp/merge';

// import * as 'vis' from 'vis-network';
// import {DataSet} from 'vis-data';
// import {vis} from 'src/app/scripts/vis-network.min.js';
declare var vis: any;
// import {Network, Data} from 'vis-network';
// declare var DataSet: any;
// declare var Network: any;

@Component({
  selector: 'app-explorer-page',
  templateUrl: './explorer-page.component.html',
  styleUrls: ['./explorer-page.component.scss'],
})

export class ExplorerPageComponent implements OnInit, AfterViewInit {

  private networkJSON = '{"nodes": [], "edges": []}';
  private networkPositions = undefined;

  // set default config on init
  public myConfig: IConfig = JSON.parse(JSON.stringify(defaultConfig));

  @Input()
  public onload: undefined | string;

  @Input()
  public set config(config: string | undefined) {
    if (typeof config === 'undefined') {
      return;
    }
    // check if config updates affect network
    let updateNetworkFlag = false;
    const configObj = JSON.parse(config);
    for (const key of Object.keys(configObj)) {
      if (key === 'nodeGroups') {
        this.setConfigNodeGroup(key, configObj[key]);
        updateNetworkFlag = true;
        // dont set the key here, will be set in function
        continue;
      } else if (key === 'edgeGroups') {
        this.setConfigEdgeGroup(key, configObj[key]);
        updateNetworkFlag = true;
        // dont set the key here, will be set in function
        continue;
      } else if (key === 'interactions') {
        this.getInteractions(configObj[key]);
        // dont set the key here, will be set in function
        continue;
      } else if (key === 'showLeftSidebar') {
        if (configObj[key]) {
          // shrink main column
          document.getElementById('main-column').classList.remove('leftgone');
        } else {
          // extend main column
          document.getElementById('main-column').classList.add('leftgone');
        }
      } else if (key === 'showRightSidebar') {
        if (configObj[key]) {
          // shrink main column
          document.getElementById('main-column').classList.remove('rightgone');
        } else {
          // extend main column
          document.getElementById('main-column').classList.add('rightgone');
        }
      }
      this.myConfig[key] = configObj[key];
    }
    // trigger updates on config e.g. in legend
    this.myConfig = {...this.myConfig};
    if (updateNetworkFlag && typeof this.networkJSON !== 'undefined') {
      // update network if network config has changed and networkJSON exists
      if (this.networkInternal !== undefined) {
        // a network exists, save node positions
        this.networkPositions = this.networkInternal.getPositions();
      }
      this.createNetwork();
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

  public windowWidth = 0;
  public smallStyle = false;

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

  public proteins: Node[];
  public edges: NodeInteraction[];

  private networkInternal: any;
  // this will store the vis Dataset
  public nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};

  private dumpPositions = false;
  public physicsEnabled = false;
  public adjacentDrugs = false;
  public adjacentDrugList: Node[] = [];
  public adjacentDrugEdgesList: Node[] = [];

  public queryItems: Wrapper[] = [];
  public showAnalysisDialog = false;
  public showThresholdDialog = false;
  public analysisDialogTarget: 'drug' | 'drug-target';

  public showCustomProteinsDialog = false;

  public selectedAnalysisToken: string | null = null;

  public currentDataset = [];

  public currentViewProteins: Node[];
  public currentViewSelectedTissue: Tissue | null = null;
  public currentViewNodes: Node[];

  public expressionExpanded = false;
  public selectedTissue: Tissue | null = null;

  public legendContext: legendContext = 'explorer';

  // keys are node netexIds
  public expressionMap: ExpressionMap = undefined;

  @Input()
  public textColor = 'red';

  @ViewChild('network', {static: false}) networkEl: ElementRef;
  @ViewChild('networkWithLegend', {static: false}) networkWithLegendEl: ElementRef;

  constructor(
    public omnipath: OmnipathControllerService,
    public analysis: AnalysisService,
    public netex: NetexControllerService) {


    this.showDetails = false;

    this.analysis.subscribeList((items, selected) => {
      // return if analysis panel is open or no nodes are loaded
      if (this.selectedAnalysisToken || !this.nodeData.nodes) {
        return;
      }
      if (selected !== null) {
        if (items.length === 0) {
          return;
        }
        const updatedNodes = [];
        for (const wrapper of items) {
          // const node: Node = this.nodeData.nodes.get(wrapper.id);
          const node = wrapper.data as Node;
          if (!node) {
            continue;
          }
          const pos = this.networkInternal.getPositions([wrapper.id]);
          node.x = pos[wrapper.id].x;
          node.y = pos[wrapper.id].y;
          const nodeStyled = NetworkSettings.getNodeStyle(
            node,
            this.myConfig,
            false,
            selected,
            1.0
            )
          nodeStyled.x = pos[wrapper.id].x;
          nodeStyled.y = pos[wrapper.id].y;
          updatedNodes.push(nodeStyled);
        }
        this.nodeData.nodes.update(updatedNodes);
      } else {
        const updatedNodes = [];
        this.nodeData.nodes.forEach((node) => {
          // const nodeSelected = this.analysis.idInSelection(node.id);
          // if (node.group == 'default') {
          //   Object.assign(node, this.myConfig.nodeGroups.default);
          // } else {
          //   Object.assign(node, this.myConfig.nodeGroups[node.group]);
          // };
          Object.assign(node, this.myConfig.nodeGroups[node.group]);

        });
        this.nodeData.nodes.update(updatedNodes);
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.setWindowWidth(event.target.innerWidth);
  }

  ngOnInit() {
    this.setWindowWidth(document.getElementById('appWindow').getBoundingClientRect().width);
  }

  async ngAfterViewInit() {
    // TODO find out if this had a function? we were loading the network twice
    // this.createNetwork();

    if (this.onload) {
      // tslint:disable-next-line:no-eval
      eval(this.onload);
    }
  }

  async getInteractions(key: InteractionDatabase) {
    let edges = [];
    if (key == 'omnipath') {
      const names = this.nodeData.nodes.map((node) => node.label);
      const nameToNetworkId = {};
      this.nodeData.nodes.map((node) => nameToNetworkId[node.label] = node.id);
      edges = await this.omnipath.getInteractions(names, this.myConfig.identifier, nameToNetworkId);
    }
    this.nodeData.edges.update(edges);
  }

  private async getNetwork() {

    const network = JSON.parse(this.networkJSON);

    // map data to nodes in backend
    if (network.nodes.length) {
      network.nodes = await this.netex.mapNodes(network.nodes, this.myConfig.identifier);
    }
    // at this point, we have nodes synched with the backend
    // use netexIds where posssible, but use original id as node name if no label given
    const nodeIdMap = {};
    const seenNodeIds = new Set();
    network.nodes.forEach((node, index, object) => {
      if (seenNodeIds.has(node.id)) {
        // remove duplicate ensg nodes, TODO is there a better way to do this?
        object.splice(index, 1);
        return;
      } else {
        seenNodeIds.add(node.id);
      }
      nodeIdMap[node.id] = node.netexId ? node.netexId : node.id;
      node.label = node.label ? node.label : node.id;
      node.id = nodeIdMap[node.id];
    });
    // adjust edge labels accordingly
    network.edges.forEach(edge => {
      edge.from = nodeIdMap[edge.from];
      edge.to = nodeIdMap[edge.to];
    });
    this.proteins = network.nodes;
    this.edges = network.edges;
  }

  private setWindowWidth(width: number) {
    this.windowWidth = width;
    this.smallStyle = this.windowWidth < 1250;
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
      this.zoomToNode(item.id);
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
    // getNetwork synchronizes the input network with the database
    await this.getNetwork();
    this.proteinData = new ProteinNetwork(this.proteins, this.edges);

    if (this.networkPositions) {
      this.proteinData.updateNodePositions(this.networkPositions)
    }
    this.proteinData.linkNodes();

    const {nodes, edges} = this.proteinData.mapDataToNetworkInput(this.myConfig);

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
        if (node.netexId === undefined || !node.netexId.startsWith('p')) {
          // skip if node is not a protein mapped to backend
          return;
        }
        const wrapper = getWrapperFromNode(node);
        if (this.analysis.inSelection(node)) {
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
        const wrapper = getWrapperFromNode(node);
        this.openSummary(wrapper, false);
      } else {
        this.closeSummary();
      }
    });
    this.networkInternal.on('deselectNode', (properties) => {
      this.closeSummary();
    });

    // // this might be not necessary, positions get saved right before reloding network
    // this.networkInternal.on('stabilizationIterationsDone', () => {
    //   this.networkPositions = this.networkInternal.getPositions();
    // });
    // this.networkInternal.stabilize();

    if (this.selectedWrapper) {
      this.zoomToNode(this.selectedWrapper.id);
    }

    this.queryItems = [];
    this.fillQueryItems(this.proteins);
    if (this.selectedWrapper) {
      this.networkInternal.selectNodes([this.selectedWrapper.id]);
    }
  }

  fillQueryItems(hostProteins: Node[]) {
    this.queryItems = [];
    hostProteins.forEach((protein) => {
      this.queryItems.push(getWrapperFromNode(protein));
    });

    this.currentViewNodes = this.nodeData.nodes;
    this.currentViewProteins = this.proteins;
  }

  public queryAction(item: any) {
    if (item) {
      this.openSummary(item, true);
    }
  }

  public updatePhysicsEnabled(bool: boolean) {
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
      this.legendContext = 'adjacentDrugs'
    } else {
      this.nodeData.nodes.remove(this.adjacentDrugList);
      this.nodeData.edges.remove(this.adjacentDrugEdgesList);
      this.adjacentDrugList = [];
      this.adjacentDrugEdgesList = [];

      this.legendContext = 'explorer'
    }
  }

  /**
   * Function to set the node group attribute in config
   * Validates input NodeGroups and handles setting defaults
   * @param key
   * @param values
   */
  public setConfigNodeGroup(key: string, nodeGroups: { [key: string]: NodeGroup }) {
    if (nodeGroups === undefined || !Object.keys(nodeGroups).length) {
      // if node groups are not set or empty, use default node group(s)
      this.myConfig[key] = defaultConfig.nodeGroups;
      // stop if nodeGroups do not contain any information
      return;
    }

    // make sure all keys are set
    Object.entries(nodeGroups).forEach(([key, group]) => {
      if (key in defaultConfig.nodeGroups) {
        // skip the groups that overwrite default groups in case user only wants to overwrite partially
        return
      }
      if (!group.color) {
        throw `Group ${defaultConfig.nodeGroups.groupName} has no attribute 'color'.`;
      }
      if (!group.shape) {
        throw `Group ${defaultConfig.nodeGroups.groupName} has no attribute 'shape'.`;
      }
      if (!group.groupName) {
        throw `Group ${defaultConfig.nodeGroups.groupName} has no attribute 'groupName'.`;
      }
      // set default values in case they are not set by user
      // these values are not mandatory but are neede to override default vis js styles after e.g. deselecting
      // because vis js "remembers" styles even though they are removed
      if (!group.borderWidth) {
        group.borderWidth = 0;
      }
      if (!group.borderWidthSelected) {
        group.borderWidthSelected = 0;
      }
      // if color is set as string, add detail settings
      if (typeof group.color === 'string') {
        group.color = {
          border: group.color,
          background: group.color,
          highlight: {
            border: group.color,
            background: group.color
          }
        }
      }
      // if image is given, set node shape to image
      if (group.image) {
        group.shape = 'image';
      }
      // color needs to be hexacode to calculate gradient, group.color might not be set for seed and selected group
      // if (!group.color.startsWith('#')) {
      //   // color is either rgba, rgb or string like "red"
      //   if (group.color.startsWith('rgba')) {
      //     group.color = rgbaToHex(group.color).slice(0, 7)
      //   } else if (group.color.startsWith('rgb')) {
      //     group.color = rgbToHex(group.color)
      //   } else (
      //     group.color = standardize_color(group.color)
      //   )
      // }
    });

    // make sure that return-groups (seeds, drugs, found nodes) are set
    const defaultNodeGroups = JSON.parse(JSON.stringify(defaultConfig.nodeGroups));
    // if user has set nodeGroups, do not use group "default"
    delete defaultNodeGroups.default;
    // if user has not set the return-groups, take the defaults
    // user merge function to do deep merge
    nodeGroups = merge(defaultNodeGroups, nodeGroups);
    // overwrite default node groups
    this.myConfig[key] = nodeGroups;
    console.log('nodeGroups after preprocessing')
    console.log(nodeGroups)
  }

  /**
   * Function to set the edge group attribute in config
   * Validates input EdgeGroups and handles setting defaults
   * @param key
   * @param values
   */
  public setConfigEdgeGroup(key: string, edgeGroups: { [key: string]: EdgeGroup }) {
    if (edgeGroups === undefined || !Object.keys(edgeGroups).length) {
      // if edge groups are not set or empty, use default edge group(s)
      this.myConfig[key] = defaultConfig.edgeGroups;
      // stop if edgeGroups do not contain any information
      return;
    }

    // // do not allow '_' in node Group names since it causes problems with backend
    // edgeGroups = removeUnderscoreFromKeys(edgeGroups)

    // make sure all keys are set
    Object.entries(edgeGroups).forEach(([key, value]) => {
      if (!('dashes' in value)) {
        // use dashes default value if not set
        value['dashes'] = defaultConfig.edgeGroups.default.dashes;
      }
    });
    // override default node groups
    this.myConfig[key] = edgeGroups;
  }

  public toImage() {
    this.downloadDom(this.networkWithLegendEl.nativeElement).catch(error => {
      console.error('Falling back to network only screenshot. Some components seem to be inaccessable, most likely the legend is a custom image with CORS access problems on the host server side.');
      this.downloadDom(this.networkEl.nativeElement).catch(e => {
        console.error('Some network content seems to be inaccessable for saving as a screenshot. This can happen due to custom images used as nodes. Please ensure correct CORS accessability on the images host server.');
        console.error(e);
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
    // nodes in selection have netexId
    const queryString = this.analysis.getSelection()
      .filter(wrapper => wrapper.data.netexId.startsWith('p'))
      .map(wrapper => wrapper.data.uniprotAc)
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
        if (item.netexId === undefined) {
          // nodes that are not mapped to backend remain untouched
          continue;
        }
        const node: Node = this.nodeData.nodes.get(item.id);
        if (!node) {
          continue;
        }
        const pos = this.networkInternal.getPositions([item.id]);
        node.x = pos[item.id].x;
        node.y = pos[item.id].y;
        Object.assign(
          node,
          NetworkSettings.getNodeStyle(
            node,
            this.myConfig,
            false,
            this.analysis.inSelection(getWrapperFromNode(item)),
            1.0
            )
        )
        updatedNodes.push(node);
      }
      this.nodeData.nodes.update(updatedNodes);
      // delete expression values
      this.expressionMap = undefined;
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
          const gradient = expressionlvl !== null ? (Math.pow(expressionlvl / maxExpr, 1 / 3) * (1 - minExp) + minExp) : -1;
          const pos = this.networkInternal.getPositions([networkId]);
          node.x = pos[networkId].x;
          node.y = pos[networkId].y;
          Object.assign(node,
            NetworkSettings.getNodeStyle(
              node,
              this.myConfig,
              node.isSeed,
              this.analysis.inSelection(wrapper),
              gradient));
          node.gradient = gradient;
          updatedNodes.push(node);
        }
        this.nodeData.nodes.update(updatedNodes);
      })
    }

    this.currentViewSelectedTissue = this.selectedTissue;
  }

}
