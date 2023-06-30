import {
  AfterViewInit,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  getWrapperFromNode,
  Node,
  NodeInteraction,
  Tissue,
  Wrapper
} from '../../interfaces';
import {ProteinNetwork, mapNetexEdge} from '../../main-network';
import {AnalysisService} from '../../services/analysis/analysis.service';
import {NetworkSettings} from '../../network-settings';
import {defaultConfig, EdgeGroup, NodeGroup} from '../../config';
import {NetexControllerService} from 'src/app/services/netex-controller/netex-controller.service';
import * as merge from 'lodash/fp/merge';
import * as JSON5 from 'json5';
import {DrugstoneConfigService} from 'src/app/services/drugstone-config/drugstone-config.service';
import {NetworkHandlerService} from 'src/app/services/network-handler/network-handler.service';
import {LegendService} from '../../services/legend-service/legend-service.service';
import {ToastService} from '../../services/toast/toast.service';


declare var vis: any;

@Component({
  selector: 'app-explorer-page',
  templateUrl: './explorer-page.component.html',
  styleUrls: ['./explorer-page.component.scss'],
})

export class ExplorerPageComponent implements OnInit, AfterViewInit {

  private networkJSON = undefined;  //'{"nodes": [], "edges": []}'
  public _config: string;
  public _groups: string;

  @Input()
  public onload: undefined | string;

  @Input()
  public id: undefined | string;

  @ViewChild('analysis') analysisElement;

  public reset() {
    // const analysisNetwork = this.networkHandler.networks['analysis'];
    const explorerNetwork = this.networkHandler.networks['explorer'];
    if (this.analysisElement) {
      this.analysisElement.close();
    }
    this.selectedToken = null;
    explorerNetwork.selectTissue(null);
    explorerNetwork.adjacentDrugs = false;
    explorerNetwork.adjacentDisordersProtein = false;
    explorerNetwork.adjacentDisordersDrug = false;
    explorerNetwork.nodeRenderer = null;
    explorerNetwork.nodeGroupsWithExpression = new Set();
    explorerNetwork.updatePhysicsEnabled(false);
    this.legendService.reset();
    this.network = this.network;
  }

  @Input()
  public set config(config: string | undefined) {
    if (config == null) {
      return;
    }
    this._config = config;
    if (this.id !== null) {
      this.activateConfig();
    }
  }


  @Input()
  public set groups(groups: string | undefined) {
    if (groups == null) {
      return;
    }
    this._groups = groups;
    if (this.id !== null) {
      this.activateConfig(true);
    }
  }

  @Input()
  public set network(network: string | undefined) {
    this.drugstoneConfig.gettingNetworkIssue = false;
    this.drugstoneConfig.gettingNetworkEmpty = false;
    this.drugstoneConfig.parsingIssueNetwork = false;
    if (network == null) {
      this.drugstoneConfig.gettingNetworkIssue = true;
      console.error('Failed parsing input network! Reason: Network JSON is empty');
      return;
    }
    try {
      const nw = typeof network === 'string' ? JSON5.parse(network) : network;
      if (!nw.nodes || nw.nodes.length === 0) {
        this.drugstoneConfig.gettingNetworkEmpty = true;
        console.log('No nodes specified in network config.');
        return;
      }
      this.networkJSON = JSON.stringify(nw);
    } catch (e) {
      this.drugstoneConfig.parsingIssueNetwork = true;
      console.error('Failed parsing input network');
      console.error(e);
    }
    this.activateConfig(true);
  }

  @Output()
  public taskEvent = new EventEmitter<object>();

  public get network() {
    return this.networkJSON;
  }

  public windowWidth = 0;

  public showDetails = false;

  public collapseAnalysis = true;
  public collapseTask = true;
  public collapseViews = true;
  public collapseSelection = true;
  public collapseBaitFilter = true;
  public collapseQuery = true;
  public collapseData = true;

  public proteinData: ProteinNetwork;
  public edgeAttributes: Map<string, NodeInteraction>;

  // public proteins: Node[];
  // public edges: NodeInteraction[];

  // this will store the vis Dataset
  public nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};

  public showAnalysisDialog = false;
  public showThresholdDialog = false;
  public analysisDialogTarget: 'drug' | 'drug-target';


  public showCustomProteinsDialog = false;
  public selectedAnalysisTokenType: 'task' | 'view' | null = null;
  // public selectedAnalysisToken: string | null = null;
  public selectedToken: string | null = null;

  public set selectedViewToken(token: string | null) {
    if (token == null || token.length === 0) {
      this.selectedToken = null;
    } else {
      this.selectedToken = token;
      this.selectedAnalysisTokenType = 'view';
    }
  }

  public set selectedAnalysisToken(token: string | null) {
    if (token == null || token.length === 0) {
      this.selectedToken = null;
    } else {
      this.selectedToken = token;
      this.selectedAnalysisTokenType = 'task';
    }
  }

  public get selectedAnalysisToken() {
    if (this.selectedAnalysisTokenType === 'view') {
      return null;
    }
    return this.selectedToken;
  }

  public get selectedViewToken() {
    if (this.selectedAnalysisTokenType === 'task') {
      return null;
    }
    return this.selectedToken;
  }

  public setViewToken(token: string | null) {
    this.selectedViewToken = token;
  }

  public setTaskToken(token: string | null) {
    this.selectedAnalysisToken = token;
  }


  public bind(f: (token: (string | null)) => void) {
    return f.bind(this);
  }

  @Input() set taskId(token: string | null) {
    if (token == null || token.length === 0) {
      this.selectedAnalysisToken = null;
    }
    this.selectedAnalysisToken = token;
  }

  constructor(
    // public omnipath: OmnipathControllerService,
    public analysis: AnalysisService,
    public drugstoneConfig: DrugstoneConfigService,
    public netex: NetexControllerService,
    public networkHandler: NetworkHandlerService,
    public legendService: LegendService,
    public toast: ToastService,
  ) {

    this.showDetails = false;
    this.analysis.subscribeList(async (items, selected) => {
      // return if analysis panel is open or no nodes are loaded
      if (this.selectedAnalysisToken || this.selectedViewToken || !this.nodeData.nodes) {
        return;
      }
      if (selected !== null) {
        if (items == null || items.length === 0) {
          return;
        }
        const updatedNodes = [];
        for (const wrapper of items) {
          // const node: Node = this.nodeData.nodes.get(wrapper.id);
          const node = wrapper.data as Node;
          if (!node) {
            continue;
          }
          const pos = this.networkHandler.activeNetwork.networkInternal.getPositions([wrapper.id]);
          node.x = pos[wrapper.id].x;
          node.y = pos[wrapper.id].y;

          const nodeStyled = NetworkSettings.getNodeStyle(
            node,
            this.drugstoneConfig.currentConfig(),
            false,
            selected,
            this.networkHandler.activeNetwork.getGradient(node.id),
            this.networkHandler.activeNetwork.nodeRenderer
          );
          nodeStyled.x = pos[wrapper.id].x;
          nodeStyled.y = pos[wrapper.id].y;
          updatedNodes.push(nodeStyled);
        }
        this.nodeData.nodes.update(updatedNodes);
      }
    });

  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.setWindowWidth(document.getElementById('appWindow').getBoundingClientRect().width);
  }

  ngOnInit() {
    this.setWindowWidth(document.getElementById('appWindow').getBoundingClientRect().width);
    this.analysis.setViewTokenCallback(this.setViewToken.bind(this));
    this.analysis.setTaskTokenCallback(this.setTaskToken.bind(this));
  }

  async ngAfterViewInit() {
    this.networkHandler.setActiveNetwork('explorer');

    if (this.onload) {
      // tslint:disable-next-line:no-eval
      eval(this.onload);
    }
  }

  public activateConfig(updateNetworkFlag = false) {
    // remove analysis panel when loading config
    this.selectedAnalysisToken = null;

    let configObj = {};
    let groupsObj = {};
    try {
      if (typeof this._config === 'string') {
        if (this._config.length > 0) {
          configObj = JSON5.parse(this._config);
        }
      } else {
        configObj = this._config;
      }
    } catch (e) {
      this.drugstoneConfig.parsingIssueConfig = true;
      console.error('Error when parsing user defined config JSON. Please check your JSON string for syntax errors.');
      console.error(e);
    }
    try {
      if (typeof this._groups === 'string') {
        if (this._groups.length > 0) {
          groupsObj = JSON5.parse(this._groups);
        }
      } else {
        groupsObj = this._groups;
      }
    } catch (e) {
      this.drugstoneConfig.parsingIssueGroups = true;
      console.error('Error when parsing user defined groups JSON. Please check your JSON string for syntax errors.');
      console.error(e);
    }
    configObj = merge(configObj, groupsObj);
    if (this.drugstoneConfig.analysisConfig) {
      this.drugstoneConfig.set_analysisConfig({...this.drugstoneConfig.analysisConfig, configObj});
      // this.drugstoneConfig.set_analysisConfig(merge(this.drugstoneConfig.analysisConfig, configObj));
    } else {
      this.drugstoneConfig.config = {...this.drugstoneConfig.config, ...configObj};
    }
    // update Drugst.One according to the settings
    // check if config updates affect network
    for (const key of Object.keys(configObj)) {
      if (key === 'nodeGroups') {
        this.setConfigNodeGroup(key, configObj[key]);
        updateNetworkFlag = true;
      } else if (key === 'edgeGroups') {
        this.setConfigEdgeGroup(key, configObj[key]);
        updateNetworkFlag = true;
      } else if (key === 'interactions') {
        this.networkHandler.activeNetwork.getInteractions(configObj[key]);
      }
    }
    this.networkHandler.networkSidebarOpen = this.drugstoneConfig.config.expandNetworkMenu;
    // trigger updates on config e.g. in legend
    if (this.drugstoneConfig.analysisConfig) {
      this.drugstoneConfig.analysisConfig = {...this.drugstoneConfig.analysisConfig};
    } else {
      this.drugstoneConfig.config = {...this.drugstoneConfig.config};
    }
    if (updateNetworkFlag && typeof this.networkJSON !== 'undefined') {
      // update network if network config has changed and networkJSON exists
      if (this.networkHandler.activeNetwork.networkInternal !== null) {
        // a network exists, save node positions
        this.networkHandler.activeNetwork.networkPositions = this.networkHandler.activeNetwork.networkInternal.getPositions();
      }
      this.createNetwork().then(async () => {
        if (this.drugstoneConfig.config.physicsOn) {
          this.networkHandler.activeNetwork.updatePhysicsEnabled(true);
        }
        this.networkHandler.updateAdjacentNodes(!this.networkHandler.activeNetwork.isBig()).then((updated) => {
        }).catch(e => {
          console.error(e);
        });
      }).catch(e => {
        console.error(e);
      });
    }

  }

  analysisWindowChanged($event: [any[], [Node[], Tissue], NodeInteraction[]]) {
    if ($event) {
      this.networkHandler.setActiveNetwork('analysis');
      this.networkHandler.activeNetwork.currentViewNodes = $event[0];
      this.networkHandler.activeNetwork.currentViewEdges = $event[2];
      this.networkHandler.activeNetwork.currentViewProteins = $event[1][0];
      this.networkHandler.activeNetwork.currentViewSelectedTissue = $event[1][1];
    } else {
      this.networkHandler.setActiveNetwork('explorer');
    }
    // changes for either way (analysis open and close)
    this.networkHandler.activeNetwork.selectedWrapper = null;
    this.networkHandler.activeNetwork.updateQueryItems();
    // this.fillQueryItems(this.currentViewNodes);
  }

  /**
   * Creates the explorer network. Analysis component has distinct function.
   */
  public createNetwork(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {

      this.analysis.resetSelection();
      this.networkHandler.activeNetwork.selectedWrapper = null;
      // getNetwork synchronizes the input network with the database
      await this.getNetwork();
      this.proteinData = new ProteinNetwork(this.networkHandler.activeNetwork.inputNetwork.nodes, this.networkHandler.activeNetwork.inputNetwork.edges);
      if (this.networkHandler.activeNetwork.networkPositions) {
        this.proteinData.updateNodePositions(this.networkHandler.activeNetwork.networkPositions);
      }
      let {nodes, edges} = this.proteinData.mapDataToNetworkInput(this.drugstoneConfig.currentConfig(), this.drugstoneConfig);
      if (this.drugstoneConfig.config.autofillEdges && nodes.length) {
        let node_map = {};
        nodes.filter(n => n.drugstoneType === 'protein').forEach(node => {
          if (typeof node.drugstoneId === 'string') {
            if (node_map[node.drugstoneId]) {
              node_map[node.drugstoneId].push(node.id);
            } else {
              node_map[node.drugstoneId] = [node.id];
            }
          } else {
            node.drugstoneId.forEach(n => {
              if (node_map[n]) {
                node_map[n].push(node.id);
              } else {
                node_map[n] = [node.id];
              }
            });
          }
        });
        const netexEdges = await this.netex.fetchEdges(nodes, this.drugstoneConfig.config.interactionProteinProtein, this.drugstoneConfig.config.licensedDatasets);
        edges.push(...netexEdges.map(netexEdge => mapNetexEdge(netexEdge, this.drugstoneConfig.currentConfig(), node_map)).flatMap(e => e));
      }
      const edge_map = {};

      edges = edges.filter(edge => {
        if (edge_map[edge.to] && edge_map[edge.to].indexOf(edge.from) !== -1) {
          return false;
        }
        if (edge_map[edge.from] && edge_map[edge.from].indexOf(edge.to) !== -1) {
          return false;
        }
        if (!edge_map[edge.from]) {
          edge_map[edge.from] = [edge.to];
        } else {
          edge_map[edge.from].push(edge.to);
        }
        return true;
      });

      // @ts-ignore
      if (!this.drugstoneConfig.selfReferences) {
        edges = edges.filter(el => el.from !== el.to);
      }

      const duplicateNodeIds = [];
      const uniqueNodeIds = [];
      const uniqueNodes = [];
      nodes.forEach(node => {
        if (uniqueNodeIds.includes(node.id)) {
          duplicateNodeIds.push(node.id);
        } else {
          uniqueNodeIds.push(node.id);
          uniqueNodes.push(node);
        }
      });
      if (duplicateNodeIds.length > 0) {
        this.toast.setNewToast({message: 'Duplicate node ids removed: ' + duplicateNodeIds.join(', '), type: 'warning'});
        nodes = uniqueNodes;
      }
      this.nodeData.nodes = new vis.DataSet(nodes);
      this.nodeData.edges = new vis.DataSet(edges);

      const container = this.networkHandler.activeNetwork.networkEl.nativeElement;

      const options = NetworkSettings.getOptions('main', this.drugstoneConfig.currentConfig());

      this.networkHandler.activeNetwork.networkInternal = new vis.Network(container, this.nodeData, options);

      this.networkHandler.activeNetwork.networkInternal.once('stabilizationIterationsDone', () => {
        if (!this.drugstoneConfig.config.physicsOn) {
          this.networkHandler.activeNetwork.updatePhysicsEnabled(false);
        }
      });


      this.networkHandler.activeNetwork.networkInternal.on('doubleClick', (properties) => {
        const nodeIds: Array<string> = properties.nodes;
        if (nodeIds != null && nodeIds.length > 0) {
          const nodeId = nodeIds[0];
          const node = this.nodeData.nodes.get(nodeId);
          if (node.drugstoneId === undefined || node.drugstoneType !== 'protein') {
            this.analysis.unmappedNodeToast();
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

      this.networkHandler.activeNetwork.networkInternal.on('click', (properties) => {
        if (properties.nodes.length === 0 && properties.edges.length === 1) {
          // clicked on one edge
          const edgeId = properties.edges[0];
          this.networkHandler.activeNetwork.openEdgeSummary(edgeId);
        } else {
          // clicked not on one edge
          const nodeIds: Array<string> = properties.nodes;
          if (nodeIds != null && nodeIds.length > 0) {
            const nodeId = nodeIds[0];
            const node = this.nodeData.nodes.get(nodeId);
            const wrapper = getWrapperFromNode(node);
            this.openNodeSummary(wrapper, false);
          } else {
            this.closeSummary();
          }
        }
      });

      //  check if shift key is pressed
      window.addEventListener('keydown', (event) => {
        if (event.key === 'Shift') {
          this.networkHandler.shiftDown = true;
        }
      });

      window.addEventListener('keyup', (event) => {
        if (event.key === 'Shift') {
          this.networkHandler.shiftDown = false;
        }
      });

      this.networkHandler.activeNetwork.networkInternal.on('dragEnd', (properties) => {
        let node_ids = this.networkHandler.activeNetwork.networkInternal.getSelectedNodes();
        if (node_ids.length === 0 || !this.networkHandler.shiftDown || this.networkHandler.activeNetwork.networkType === 'analysis') {
          return;
        }
        this.analysis.addNodesByIdsToSelection(node_ids);
        this.networkHandler.activeNetwork.networkInternal.unselectAll();
      });

      this.networkHandler.activeNetwork.networkInternal.on('deselectNode', (properties) => {
        this.closeSummary();
      });

      if (this.networkHandler.activeNetwork.selectedWrapper) {
        this.zoomToNode(this.networkHandler.activeNetwork.selectedWrapper.id);
      }

      this.networkHandler.activeNetwork.currentViewNodes = this.nodeData.nodes;
      this.networkHandler.activeNetwork.currentViewEdges = this.nodeData.edges;

      this.networkHandler.activeNetwork.queryItems = [];
      this.networkHandler.activeNetwork.updateQueryItems();
      this.networkHandler.activeNetwork.currentViewProteins = this.networkHandler.activeNetwork.inputNetwork.nodes;
      if (this.networkHandler.activeNetwork.selectedWrapper) {
        this.networkHandler.activeNetwork.networkInternal.selectNodes([this.networkHandler.activeNetwork.selectedWrapper.id]);
      }

      resolve(true);
    });
  }

  public zoomToNode(id: string) {
    this.networkHandler.activeNetwork.zoomToNode(id);
  }

  private async getNetwork() {

    const network = JSON.parse(this.networkJSON);
    if (this.drugstoneConfig.currentConfig().identifier === 'ensg') {
      // @ts-ignore
      network.nodes.forEach(node => {
        node.id = this.removeEnsemblVersion(node.id);
      });
      if (network.edges != null)
        // @ts-ignore
      {
        network.edges.forEach(edge => {
          edge.from = this.removeEnsemblVersion(edge.from);
          edge.to = this.removeEnsemblVersion(edge.to);
        });
      }
    }

    // map data to nodes in backend
    if (network.nodes != null && network.nodes.length) {
      network.nodes = await this.netex.mapNodes(network.nodes, this.drugstoneConfig.currentConfig().identifier);
    }

    // if (this.drugstoneConfig.config.identifier === 'ensg') {
    // remove possible duplicate IDs
    // network.nodes = removeDuplicateObjectsFromList(network.nodes, 'drugstoneId');
    // }

    // at this point, we have nodes synched with the backend
    // use drugstoneIds where posssible, but use original id as node name if no label given
    // const nodeIdMap = {};
    network.nodes.forEach((node) => {
      // set node label to original id before node id will be set to netex id
      node.label = node.label ? node.label : node.id;
    });

    // adjust edge labels accordingly and filter
    const edges = new Array();
    if (network.edges != null) {
      network.edges.forEach(edge => {
        if (edge.from !== undefined && edge.to !== undefined) {
          edges.push(edge);
        }
      });
    }
    // remove edges without endpoints
    network.edges = edges;
    this.networkHandler.activeNetwork.inputNetwork = network;
    // this.proteins = network.nodes;
    // this.edges = network.edges;
  }

  private setWindowWidth(width: number) {
    this.windowWidth = width;
    this.drugstoneConfig.smallStyle = this.windowWidth < 1250;
  }

  public async openNodeSummary(item: Wrapper, zoom: boolean) {
    // close edge summary if open
    this.networkHandler.activeNetwork.activeEdge = null;
    this.networkHandler.activeNetwork.selectedWrapper = item;
    // add expression information if loaded
    if (this.networkHandler.activeNetwork.expressionMap && this.networkHandler.activeNetwork.selectedWrapper.id in this.networkHandler.activeNetwork.expressionMap) {
      this.networkHandler.activeNetwork.selectedWrapper.expression = this.networkHandler.activeNetwork.expressionMap[this.networkHandler.activeNetwork.selectedWrapper.id];
    }
    if (zoom) {
      this.zoomToNode(item.id);
    }
    this.showDetails = true;
  }

  public async closeSummary() {
    this.networkHandler.activeNetwork.selectedWrapper = null;
    this.networkHandler.activeNetwork.activeEdge = null;
    this.showDetails = false;
  }

  removeEnsemblVersion(versionId: string): string {
    return versionId.startsWith('ENSG') ? versionId.split('.')[0] : versionId;
  }

  public queryAction(item: any) {
    if (item) {
      this.openNodeSummary(item, true);
    }
  }

  /**
   * Function to set the node group attribute in config
   * Validates input NodeGroups and handles setting defaults
   * @param key
   * @param values
   */
  public setConfigNodeGroup(key: string, nodeGroups: { [key: string]: NodeGroup } | {}) {
    // make sure that return-groups (seeds, drugs, found nodes) are set
    const defaultNodeGroups = JSON.parse(JSON.stringify(defaultConfig.nodeGroups));
    // user merge function to do deep merge
    nodeGroups = merge(defaultNodeGroups, nodeGroups);


    // make sure all keys are set
    Object.entries(nodeGroups).forEach(([key, group]) => {
      if (!group.color && key !== 'selectedNode') {
        console.error(`Group ${key} has no attribute 'color'.`);
      }
      if (!group.shape && key !== 'selectedNode') {
        console.error(`Group ${key} has no attribute 'shape'.`);
      }
      if (!group.groupName && key !== 'selectedNode') {
        console.error(`Group ${key} has no attribute 'groupName'.`);
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
      if (!group.font) {
        group.font = defaultConfig.nodeGroups.default.font;
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
        };
      }
      // if image is given, set node shape to image
      if (group.image) {
        group.shape = 'image';
      }
      // implement nodeShadow option, it needs to be set for all nodes or none
      group.shadow = this.drugstoneConfig.currentConfig().nodeShadow;

      // group must not have id, otherwise node id's would be overwritten which causes duplciates
      if (group.hasOwnProperty('id')) {
        delete group['id'];
      }
    });

    this.drugstoneConfig.currentConfig()[key] = nodeGroups;
  }

  /**
   * Function to set the edge group attribute in config
   * Validates input EdgeGroups and handles setting defaults
   * @param key
   * @param values
   */
  public setConfigEdgeGroup(key: string, edgeGroups: { [key: string]: EdgeGroup; }) {
    // make sure that default-groups are set
    const defaultNodeGroups = JSON.parse(JSON.stringify(defaultConfig.edgeGroups));
    edgeGroups = merge(defaultNodeGroups, edgeGroups);

    // // do not allow '_' in node Group names since it causes problems with backend
    // edgeGroups = removeUnderscoreFromKeys(edgeGroups)

    // make sure all keys are set
    Object.entries(edgeGroups).forEach(([key, value]) => {
      if (!('dashes' in value)) {
        // use dashes default value if not set
        value['dashes'] = defaultConfig.edgeGroups.default.dashes;
      }

      // implement edgeShadow option, it needs to be set for all nodes or none
      value.shadow = this.drugstoneConfig.currentConfig().edgeShadow;
    });
    this.drugstoneConfig.currentConfig()[key] = edgeGroups;
  }

  gProfilerLink(): string {
    // nodes in selection have drugstoneId
    const queryString = this.analysis.getSelection()
      .filter(wrapper => wrapper.data.drugstoneType === 'protein')
      .map(wrapper => wrapper.data.id)
      .join('%0A');
    return 'https://biit.cs.ut.ee/gprofiler/gost?' +
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

  openGProfiler(): void {
    this.openExternal(this.gProfilerLink());
  }

  openExternal(url) {
    window.open(url, '_blank').focus();
  }

  async openDigest() {
    let proteins = this.analysis.getSelection()
      .filter(wrapper => wrapper.data.drugstoneType === 'protein')
      .map(wrapper => wrapper.data.id);
    let params = {
      runs: 1000,
      replace: 100,
      distance: 'jaccard',
      background_model: 'complete',
      type: 'gene',
      target: proteins,
      target_id: this.drugstoneConfig.currentConfig().identifier
    };
    let resp = await this.netex.digest_request(params).catch(err => console.error(err));
    let url = 'https://digest-validation.net/result?id=' + resp.task;
    this.openExternal(url);
  }

  async openNDEx() {
    const proteins = this.analysis.getSelection()
      .filter(wrapper => wrapper.data.drugstoneType === 'protein')
      .flatMap(wrapper => wrapper.data.symbol).filter(n => n != null);
    this.openExternal('https://ndexbio.org/iquery/?genes=' + proteins.join('%20'));
  }

  //TODO change to access through network service
  @ViewChild('analysisPanel')
  analysisPanel;

  getNodes():
    any {
    if (this.selectedAnalysisToken && this.analysisPanel) {
      return this.analysisPanel.getResultNodes();
    }
    return this.networkHandler.activeNetwork.inputNetwork.nodes;
  }

  getEdges(): any {
    if (this.selectedAnalysisToken && this.analysisPanel) {
      return this.analysisPanel.getResultEdges();
    }
    return this.networkHandler.activeNetwork.inputNetwork.edges;
  }


  emitTaskEvent(eventObject: object
  ) {
    this.taskEvent.emit(eventObject);
  }

}
