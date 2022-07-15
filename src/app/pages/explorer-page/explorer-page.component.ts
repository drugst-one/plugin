import {
  AfterViewInit,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  getWrapperFromNode,
  Node,
  NodeInteraction,
  Tissue,
  Wrapper
} from '../../interfaces';
import { ProteinNetwork, mapNetexEdge } from '../../main-network';
import { AnalysisService } from '../../services/analysis/analysis.service';
import { OmnipathControllerService } from '../../services/omnipath-controller/omnipath-controller.service';
import { NetworkSettings } from '../../network-settings';
import { defaultConfig, EdgeGroup, NodeGroup } from '../../config';
import { NetexControllerService } from 'src/app/services/netex-controller/netex-controller.service';
import { removeDuplicateObjectsFromList } from '../../utils';
import * as merge from 'lodash/fp/merge';
import * as JSON5 from 'json5';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';
import { NetworkHandlerService } from 'src/app/services/network-handler/network-handler.service';


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
      this.activateConfig();
    }
  }

  @Input()
  public set network(network: string | undefined) {
    if (network == null) {
      return;
    }
    try {
      this.networkJSON = JSON.stringify(typeof network === 'string' ? JSON5.parse(network) : network);
    } catch {
      console.log('ERROR: Failed parsing input network')
    }
    this.activateConfig();
  }

  @Output()
  public taskEvent = new EventEmitter<object>();

  public get network() {
    return this.networkJSON;
  }

  public windowWidth = 0;

  public showDetails = false;

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

  // this will store the vis Dataset
  public nodeData: { nodes: any, edges: any } = { nodes: null, edges: null };

  public showAnalysisDialog = false;
  public showThresholdDialog = false;
  public analysisDialogTarget: 'drug' | 'drug-target';

  public showCustomProteinsDialog = false;

  public selectedAnalysisToken: string | null = null;

  @Input() inputNetwork = {};

  @Input() set taskId(token: string | null) {
    if (token == null || token.length === 0)
      this.selectedAnalysisToken = null
    this.selectedAnalysisToken = token;
  }

  constructor(
    public omnipath: OmnipathControllerService,
    public analysis: AnalysisService,
    public drugstoneConfig: DrugstoneConfigService,
    public netex: NetexControllerService,
    public networkHandler: NetworkHandlerService) {
    this.showDetails = false;
    this.analysis.subscribeList(async (items, selected) => {
      // return if analysis panel is open or no nodes are loaded
      if (this.selectedAnalysisToken || !this.nodeData.nodes) {
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
            this.drugstoneConfig.config,
            false,
            selected,
            this.networkHandler.activeNetwork.getGradient(wrapper.id),
            this.networkHandler.activeNetwork.nodeRenderer
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
          //   Object.assign(node, this.drugstoneConfig.config.nodeGroups.default);
          // } else {
          //   Object.assign(node, this.drugstoneConfig.config.nodeGroups[node.group]);
          // };
          Object.assign(node, this.drugstoneConfig.config.nodeGroups[node.group]);

        });
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
  }

  async ngAfterViewInit() {
    this.networkHandler.setActiveNetwork('explorer');

    if (this.onload) {
      // tslint:disable-next-line:no-eval
      eval(this.onload);
    }
  }

  public activateConfig() {

    let configObj = typeof this._config === 'string' ? this._config.length === 0 ? {} : JSON5.parse(this._config) : this._config;
    const groupsObj = typeof this._groups === 'string' ? this._groups.length === 0 ? {} : JSON5.parse(this._groups) : this._groups;
    configObj = merge(configObj, groupsObj);

    this.drugstoneConfig.config = merge(this.drugstoneConfig.config, configObj);

    // update Drugst.One according to the settings
    // check if config updates affect network
    let updateNetworkFlag = false;
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
    // trigger updates on config e.g. in legend
    this.drugstoneConfig.config = { ...this.drugstoneConfig.config };
    if (updateNetworkFlag && typeof this.networkJSON !== 'undefined') {
      // update network if network config has changed and networkJSON exists
      if (this.networkHandler.activeNetwork.networkInternal !== null) {
        // a network exists, save node positions
        this.networkHandler.activeNetwork.networkPositions = this.networkHandler.activeNetwork.networkInternal.getPositions();
      }
      this.createNetwork().then(() => {
        if (this.drugstoneConfig.config.physicsOn) {
          this.networkHandler.activeNetwork.updatePhysicsEnabled(true);
        }
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
  public async createNetwork() {
    this.analysis.resetSelection();

    this.networkHandler.activeNetwork.selectedWrapper = null;
    // getNetwork synchronizes the input network with the database
    await this.getNetwork();
    this.proteinData = new ProteinNetwork(this.proteins, this.edges);

    if (this.networkHandler.activeNetwork.networkPositions) {
      this.proteinData.updateNodePositions(this.networkHandler.activeNetwork.networkPositions)
    }
    // TODO do we still need this?
    // this.proteinData.linkNodes();

    const { nodes, edges } = this.proteinData.mapDataToNetworkInput(this.drugstoneConfig.config);
    if (this.drugstoneConfig.config.autofillEdges && nodes.length) {
      const netexEdges = await this.netex.fetchEdges(nodes, this.drugstoneConfig.config.interactionProteinProtein);
      edges.push(...netexEdges.map(netexEdge => mapNetexEdge(netexEdge, this.drugstoneConfig.config)))
    }

    this.nodeData.nodes = new vis.DataSet(nodes);
    this.nodeData.edges = new vis.DataSet(edges);
    const container = this.networkHandler.activeNetwork.networkEl.nativeElement;

    const options = NetworkSettings.getOptions('main', this.drugstoneConfig.config.physicsOn);

    this.networkHandler.activeNetwork.networkInternal = new vis.Network(container, this.nodeData, options);

    this.networkHandler.activeNetwork.networkInternal.on('doubleClick', (properties) => {
      const nodeIds: Array<string> = properties.nodes;
      if (nodeIds != null && nodeIds.length > 0) {
        const nodeId = nodeIds[0];
        const node = this.nodeData.nodes.get(nodeId);
        if (node.drugstoneId === undefined || !node.drugstoneId.startsWith('p')) {
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
      const nodeIds: Array<string> = properties.nodes;
      if (nodeIds != null && nodeIds.length > 0) {
        const nodeId = nodeIds[0];
        const node = this.nodeData.nodes.get(nodeId);
        const wrapper = getWrapperFromNode(node);
        this.openSummary(wrapper, false);
      } else {
        this.closeSummary();
      }
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
    this.networkHandler.activeNetwork.currentViewProteins = this.proteins;
    // this.fillQueryItems(this.currentViewNodes);
    if (this.networkHandler.activeNetwork.selectedWrapper) {
      this.networkHandler.activeNetwork.networkInternal.selectNodes([this.networkHandler.activeNetwork.selectedWrapper.id]);
    }
  }

  public zoomToNode(id: string) {
    this.networkHandler.activeNetwork.zoomToNode(id);
  }

  private async getNetwork() {

    const network = JSON.parse(this.networkJSON);
    if (this.drugstoneConfig.config.identifier === 'ensg') {
      // @ts-ignore
      network.nodes.forEach(node => {
        node.id = this.removeEnsemblVersion(node.id);
      });
      if (network.edges != null)
        // @ts-ignore
        network.edges.forEach(edge => {
          edge.from = this.removeEnsemblVersion(edge.from);
          edge.to = this.removeEnsemblVersion(edge.to);
        });
    }

    // map data to nodes in backend
    if (network.nodes != null && network.nodes.length) {
      network.nodes = await this.netex.mapNodes(network.nodes, this.drugstoneConfig.config.identifier);
    }

    if (this.drugstoneConfig.config.identifier === 'ensg') {
      // remove possible duplicate IDs
      network.nodes = removeDuplicateObjectsFromList(network.nodes, 'drugstoneId');
    }

    // at this point, we have nodes synched with the backend
    // use drugstoneIds where posssible, but use original id as node name if no label given
    const nodeIdMap = {};
    network.nodes.forEach((node) => {
      // set node label to original id before node id will be set to netex id
      node.label = node.label ? node.label : node.id;
      nodeIdMap[node.id] = node.drugstoneId ? node.drugstoneId : node.id;
      node.id = nodeIdMap[node.id];
    });

    // adjust edge labels accordingly and filter
    const edges = new Array();
    if (network.edges != null)
      network.edges.forEach(edge => {
        edge.from = nodeIdMap[edge.from];
        edge.to = nodeIdMap[edge.to];
        // check if edges have endpoints
        if (edge.from !== undefined && edge.to !== undefined) {
          edges.push(edge);
        }
      });
    // remove edges without endpoints
    network.edges = edges;
    this.inputNetwork = network;
    this.proteins = network.nodes;
    this.edges = network.edges;
  }

  private setWindowWidth(width: number) {
    this.windowWidth = width;
    this.drugstoneConfig.smallStyle = this.windowWidth < 1250;
  }

  public async openSummary(item: Wrapper, zoom: boolean) {
    this.networkHandler.activeNetwork.selectedWrapper = item;
    // add expression information if loaded
    if (this.networkHandler.activeNetwork.expressionMap && this.networkHandler.activeNetwork.selectedWrapper.id in this.networkHandler.activeNetwork.expressionMap) {
      this.networkHandler.activeNetwork.selectedWrapper.expression = this.networkHandler.activeNetwork.expressionMap[this.networkHandler.activeNetwork.selectedWrapper.id]
    }
    if (zoom) {
      this.zoomToNode(item.id);
    }
    this.showDetails = true;
  }

  public async closeSummary() {
    this.networkHandler.activeNetwork.selectedWrapper = null;
    this.showDetails = false;
  }

  removeEnsemblVersion(versionId: string): string {
    return versionId.startsWith('ENSG') ? versionId.split('.')[0] : versionId;
  }

  public queryAction(item: any) {
    if (item) {
      this.openSummary(item, true);
    }
  }

  /**
   * Function to set the node group attribute in config
   * Validates input NodeGroups and handles setting defaults
   * @param key
   * @param values
   */
  public setConfigNodeGroup(key: string, nodeGroups: { [key: string]: NodeGroup }) {
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
        }
      }
      // if image is given, set node shape to image
      if (group.image) {
        group.shape = 'image';
      }
      // implement nodeShadow option, it needs to be set for all nodes or none
      group.shadow = this.drugstoneConfig.config.nodeShadow;

      // group must not have id, otherwise node id's would be overwritten which causes duplciates
      if (group.hasOwnProperty('id')) {
        delete group['id'];
      }
    });

    this.drugstoneConfig.config[key] = nodeGroups;
  }

  /**
   * Function to set the edge group attribute in config
   * Validates input EdgeGroups and handles setting defaults
   * @param key
   * @param values
   */
  public setConfigEdgeGroup(key: string, edgeGroups: { [key: string]: EdgeGroup }) {
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
      value.shadow = this.drugstoneConfig.config.edgeShadow;
    });
    this.drugstoneConfig.config[key] = edgeGroups;
  }

  gProfilerLink(): string {
    // nodes in selection have drugstoneId
    const queryString = this.analysis.getSelection()
      .filter(wrapper => wrapper.data.drugstoneId.startsWith('p'))
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


  emitTaskEvent(eventObject: object) {
    this.taskEvent.emit(eventObject);
  }

  setInputNetwork(network: any) {
    if (network == null)
      this.inputNetwork = { nodes: this.proteins, edges: this.edges }
    else
      this.inputNetwork = network;
  }

}
