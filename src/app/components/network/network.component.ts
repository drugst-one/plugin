import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import domtoimage from 'dom-to-image';
import {InteractionDatabase} from 'src/app/config';
import {DrugstoneConfigService} from 'src/app/services/drugstone-config/drugstone-config.service';
import {NetexControllerService} from 'src/app/services/netex-controller/netex-controller.service';
import {OmnipathControllerService} from 'src/app/services/omnipath-controller/omnipath-controller.service';
import {mapCustomEdge, mapCustomNode} from '../../main-network';
import {
  getDrugNodeId,
  getWrapperFromNode,
  Node,
  NodeData,
  NodeAttributeMap,
  NodeInteraction,
  Tissue,
  Wrapper,
  NetworkType, NetworkData
} from '../../interfaces';
import {AnalysisService} from 'src/app/services/analysis/analysis.service';
import {NetworkSettings} from 'src/app/network-settings';
import {pieChartContextRenderer} from 'src/app/utils';
import {NetworkHandlerService} from 'src/app/services/network-handler/network-handler.service';
import {LegendService} from 'src/app/services/legend-service/legend-service.service';
import {LoadingScreenService} from 'src/app/services/loading-screen/loading-screen.service';


@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss']
})
export class NetworkComponent implements OnInit {

  @Input() public networkType: NetworkType;
  @Input() public nodeData: NodeData;

  @ViewChild('network', {static: false}) networkEl: ElementRef;
  @ViewChild('networkWithLegend', {static: false}) networkWithLegendEl: ElementRef;

  public networkInternal: any = null;
  public inputNetwork: NetworkData = {nodes: [], edges: []};

  public selectedWrapper: Wrapper | null = null;

  public activeEdge: NodeInteraction;

  public adjacentDrugs = false;

  public adjacentDisordersProtein = false;
  public adjacentDisordersDrug = false;
  public adjacentDrugList: Node[] = [];
  public adjacentDrugEdgesList: Node[] = [];
  public adjacentProteinDisorderList: Node[] = [];
  public adjacentProteinDisorderEdgesList: Node[] = [];
  public adjacentDrugDisorderList: Node[] = [];
  public adjacentDrugDisorderEdgesList: Node[] = [];

  public currentDataset = [];

  public currentViewProteins: Node[] = [];
  public currentViewSelectedTissue: Tissue | null = null;
  public currentViewNodes: Node[] = [];
  public currentViewEdges: NodeInteraction[];

  public expressionExpanded = false;
  public selectedTissue: Tissue | null = null;

  // change this to true to have sidebar open per default
  // public networkSidebarOpen = false;

  public queryItems: Wrapper[] = [];

  public showMenu: boolean = false;

  public networkPositions: any;

  public highlightSeeds = false;
  public seedMap: NodeAttributeMap = {};

  // keys are node drugstoneIds
  public expressionMap: NodeAttributeMap = {};
  public gradientMap: NodeAttributeMap = {};

  public fullscreen = false;

  public nodeRenderer = null;

  public loading = false;

  public nodeGroupsWithExpression: Set<string> = new Set();

  constructor(
    public legendService: LegendService,
    public networkHandler: NetworkHandlerService,
    public analysis: AnalysisService,
    public drugstoneConfig: DrugstoneConfigService,
    public netex: NetexControllerService,
    public omnipath: OmnipathControllerService,
    public loadingScreen: LoadingScreenService) {
  }

  ngOnInit(): void {
    this.networkHandler.networks[this.networkType] = this;
  }

  isBig(): boolean {
    return this.nodeData.nodes.length > 100 || this.nodeData.edges.length > 100;
  }

  setLoading(bool: boolean): void {
    this.loading = bool;
  }

  async getInteractions(key: InteractionDatabase) {
    let edges = [];
    if (key === 'omnipath') {
      const names = this.nodeData.nodes.map((node) => node.label);
      const nameToNetworkId = {};
      this.nodeData.nodes.map((node) => nameToNetworkId[node.label] = node.id);
      edges = await this.omnipath.getInteractions(names, this.drugstoneConfig.currentConfig().identifier, nameToNetworkId);
    }
    this.nodeData.edges.update(edges);
  }

  updateQueryItems() {
    this.queryItems = [];
    if (this.currentViewNodes) {
      this.currentViewNodes.forEach((protein) => {
        this.queryItems.push(getWrapperFromNode(protein));
      });
    }
  }

  public saveAddNodes(nodeList: Node[]) {
    const existing = this.nodeData.nodes.get().map(n => n.id);
    const toAdd = nodeList.filter(n => existing.indexOf(n.id) === -1);
    this.nodeData.nodes.add(toAdd);
  }

  public async updateAdjacentProteinDisorders(bool: boolean, stabl: boolean) {
    return new Promise<boolean>((resolve, reject) => {
      this.loadingScreen.stateUpdate(true);
      this.adjacentDisordersProtein = bool;
      if (this.adjacentDisordersProtein) {
        this.adjacentProteinDisorderList = [];
        this.adjacentProteinDisorderEdgesList = [];
        this.legendService.add_to_context('adjacentDisorders');
        this.netex.adjacentDisorders(this.nodeData.nodes.get(), 'proteins', this.drugstoneConfig.config.associatedProteinDisorder, this.drugstoneConfig.config.licensedDatasets).then(response => {
          const proteinMap = this.getProteinMap();
          const addedEdge = {};
          for (const interaction of response.edges) {
            const edge = mapCustomEdge({
              from: interaction.protein,
              to: interaction.disorder
            }, this.drugstoneConfig.config, this.drugstoneConfig);
            if (proteinMap[edge.from]) {
              proteinMap[edge.from].forEach(from => {
                if (addedEdge[from] && addedEdge[from].indexOf(edge.to) !== -1) {
                  return;
                }
                const e = JSON.parse(JSON.stringify(edge));
                e.from = from;
                e.to = edge.to;
                this.adjacentProteinDisorderEdgesList.push(e);
                if (!addedEdge[from]) {
                  addedEdge[from] = [edge.to];
                } else {
                  addedEdge[from].push(edge.to);
                }
              });
            }
          }
          for (const disorder of response.disorders) {
            disorder.group = 'defaultDisorder';
            disorder.id = disorder.drugstoneId;
            this.adjacentProteinDisorderList.push(mapCustomNode(disorder, this.drugstoneConfig.currentConfig(), this.drugstoneConfig));
          }
          this.saveAddNodes(this.adjacentProteinDisorderList);
          this.nodeData.edges.add(this.adjacentProteinDisorderEdgesList);
          this.updateQueryItems();
        }).then(() => {
          if (stabl) {
            this.stabilize().then(() => {
              this.loadingScreen.stateUpdate(false);
              resolve(true);
            });
          } else {
            this.loadingScreen.stateUpdate(false);
            resolve(true);
          }
        });
      } else {
        if (!this.adjacentDisordersDrug) {
          this.legendService.remove_from_context('adjacentDisorders');
        }
        this.saveRemoveDisorders(this.adjacentProteinDisorderList);
        this.nodeData.edges.remove(this.adjacentProteinDisorderEdgesList);
        this.updateQueryItems();
        if (stabl) {
          this.stabilize().then(() => {
            this.loadingScreen.stateUpdate(false);
            resolve(true);
          });
        } else {
          this.loadingScreen.stateUpdate(false);
          resolve(true);
        }
      }
    });
  }

  public async updateAdjacentDrugDisorders(bool: boolean, stabl: boolean): Promise<any> {
    return new Promise<boolean>((resolve, reject) => {
      this.loadingScreen.stateUpdate(true);
      this.adjacentDisordersDrug = bool;
      if (this.adjacentDisordersDrug) {
        this.adjacentDrugDisorderList = [];
        this.adjacentDrugDisorderEdgesList = [];
        this.legendService.add_to_context('adjacentDisorders');
        this.netex.adjacentDisorders(this.nodeData.nodes.get(), 'drugs', this.drugstoneConfig.config.indicationDrugDisorder, this.drugstoneConfig.config.licensedDatasets).then(response => {
          for (const interaction of response.edges) {
            const edge = {from: interaction.drug, to: interaction.disorder};
            this.adjacentDrugDisorderEdgesList.push(mapCustomEdge(edge, this.drugstoneConfig.currentConfig(), this.drugstoneConfig));
          }
          for (const disorder of response.disorders) {
            disorder.group = 'defaultDisorder';
            disorder.id = disorder.drugstoneId;
            this.adjacentDrugDisorderList.push(mapCustomNode(disorder, this.drugstoneConfig.currentConfig(), this.drugstoneConfig));
          }
          this.saveAddNodes(this.adjacentDrugDisorderList);
          this.nodeData.edges.add(this.adjacentDrugDisorderEdgesList);
          this.updateQueryItems();
        }).then(() => {
          if (stabl) {
            this.stabilize().then(() => {
              this.loadingScreen.stateUpdate(false);
              resolve(true);
            });
          } else {
            this.loadingScreen.stateUpdate(false);
            resolve(true);
          }
        });
      } else {
        if (!this.adjacentDisordersProtein) {
          this.legendService.remove_from_context('adjacentDisorders');
        }
        this.saveRemoveDisorders(this.adjacentDrugDisorderList);
        this.nodeData.edges.remove(this.adjacentDrugDisorderEdgesList);
        this.updateQueryItems();
        if (stabl) {
          this.stabilize().then(() => {
            this.loadingScreen.stateUpdate(false);
            resolve(true);
          });
        } else {
          this.loadingScreen.stateUpdate(false);
          resolve(true);
        }
      }
    });
  }

  public getProteinMap() {
    const proteinMap = {};
    this.nodeData.nodes.get().forEach(n => {
      if (n.drugstoneType === 'protein') {
        n.drugstoneId.forEach(id => {
          if (typeof id === 'string') {
            if (proteinMap[id]) {
              proteinMap[id].push(n.id);
            } else {
              proteinMap[id] = [n.id];
            }
          } else {
            n.id.forEach(single_id => {
              if (proteinMap[single_id]) {
                proteinMap[single_id].push(n.id);
              } else {
                proteinMap[single_id] = [n.id];
              }
            });
          }
        });
      }
    });
    return proteinMap;
  }

  public stabilize(): Promise<any> {
    return new Promise<boolean>((resolve, reject) => {
      this.networkInternal.once('stabilizationIterationsDone', () => {
        this.updatePhysicsEnabled(this.drugstoneConfig.config.physicsOn);
        this.networkInternal.fit();
        this.loadingScreen.stateUpdate(false);
        resolve(true);
      });
      this.loadingScreen.stateUpdate(true);
      this.networkInternal.stabilize(1000);
    });
  }

  public updateAdjacentDrugs(bool: boolean, stabl: boolean): Promise<any> {
    return new Promise<boolean>(async (resolve, reject) => {
      this.loadingScreen.stateUpdate(true);
      this.adjacentDrugs = bool;
      if (this.adjacentDrugs) {
        this.adjacentDrugList = [];
        this.adjacentDrugEdgesList = [];
        this.legendService.add_to_context('adjacentDrugs');
        const addedEdge = {};
        const proteinMap = this.getProteinMap();
        this.netex.adjacentDrugs(this.drugstoneConfig.config.interactionDrugProtein, this.drugstoneConfig.config.licensedDatasets, this.nodeData.nodes.get()).then(response => {
          const existingDrugIDs = this.nodeData.nodes.get().filter(n => n.drugstoneId && n.drugstoneType === 'drug').map(n => n.drugstoneId);
          for (const interaction of response.pdis) {
            const edge = mapCustomEdge({
              from: interaction.protein,
              to: interaction.drug
            }, this.drugstoneConfig.currentConfig(), this.drugstoneConfig);

            if (proteinMap[edge.from]) {
              proteinMap[edge.from].forEach(from => {
                if (addedEdge[from] && addedEdge[from].indexOf(edge.to) !== -1) {
                  return;
                }
                const e = JSON.parse(JSON.stringify(edge));
                e.from = from;
                e.to = edge.to;
                this.adjacentDrugEdgesList.push(e);
                if (!addedEdge[from]) {
                  addedEdge[from] = [edge.to];
                } else {
                  addedEdge[from].push(edge.to);
                }
              });
            }
          }
          for (const drug of response.drugs) {
            drug.group = 'foundDrug';
            drug.id = getDrugNodeId(drug);
            if (!existingDrugIDs.includes(drug.drugstoneId)) {
              existingDrugIDs.push(drug.drugstoneId);
              this.adjacentDrugList.push(mapCustomNode(drug, this.drugstoneConfig.currentConfig(), this.drugstoneConfig));
            }
          }
          this.nodeData.nodes.add(this.adjacentDrugList);
          this.nodeData.edges.add(this.adjacentDrugEdgesList);
          this.updateQueryItems();
        }).then(() => {
          if (stabl) {
            this.stabilize().then(() => {
              this.loadingScreen.stateUpdate(false);
              resolve(true);
            });
          } else {
            this.loadingScreen.stateUpdate(false);
            resolve(true);
          }
        });
      } else {
        // remove adjacent drugs, make sure that also drug associated disorders are removed
        if (this.adjacentDisordersDrug) {
          await this.updateAdjacentDrugDisorders(false, true);
        }
        this.legendService.remove_from_context('adjacentDrugs');
        // if (!this.adjacentDisordersProtein)
        //   this.legendService.remove_from_context('adjacentDisorders')
        this.nodeData.nodes.remove(this.adjacentDrugList);
        this.nodeData.edges.remove(this.adjacentDrugEdgesList);
        this.adjacentDrugList = [];
        this.adjacentDrugEdgesList = [];

        this.updateQueryItems();
        if (stabl) {
          this.stabilize().then(() => {
            this.loadingScreen.stateUpdate(false);
            resolve(true);
          });
        } else {
          this.loadingScreen.stateUpdate(false);
          resolve(true);
        }
      }
    });
  }

  public saveRemoveDisorders(nodeList: Node[]) {
    const other = this.adjacentDrugDisorderList === nodeList ? this.adjacentProteinDisorderList : this.adjacentDrugDisorderList;
    if (other == null) {
      this.nodeData.nodes.remove(nodeList);
    } else {
      const otherIds = other.map(d => d.id);
      const rest = nodeList.filter(d => otherIds.indexOf(d.id) === -1);
      this.nodeData.nodes.remove(rest);
    }
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

  public updatePhysicsEnabled(bool: boolean) {
    // this.drugstoneConfig.config.physicsOn = bool;
    this.networkInternal.setOptions({
      physics: {
        enabled: bool,
        stabilization: {
          enabled: false,
        },
      }
    });
  }

  public openEdgeSummary(edgeId: string) {
    this.selectedWrapper = undefined;
    const edgeMap = this.nodeData.edges.get({returnType:'Object'});
    this.activeEdge = edgeMap[edgeId];
  }

  public zoomToNode(id: string) {
    // get network object, depending on whether analysis is open or not
    // this.nodeData.nodes.getIds();
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

  public toggleNetworkSidebar() {
    this.networkHandler.networkSidebarOpen = !this.networkHandler.networkSidebarOpen;
  }

  public selectTissue(tissue: Tissue | null) {
    this.loadingScreen.stateUpdate(true);
    this.nodeGroupsWithExpression = new Set();
    this.expressionExpanded = false;
    if (!tissue) {
      // delete expression values
      this.expressionMap = {};
      // delete gradient map
      this.gradientMap = {};
      this.selectedTissue = null;
      this.nodeRenderer = null;
      const updatedNodes = [];
      // for (const item of this.proteins) {
      const proteins = this.nodeData.nodes.get().filter(n => n.drugstoneId && n.drugstoneType === 'protein');
      for (const node of proteins) {
        const pos = this.networkInternal.getPositions([node.id]);
        node.x = pos[node.id].x;
        node.y = pos[node.id].y;
        Object.assign(
          node,
          NetworkSettings.getNodeStyle(
            node,
            this.drugstoneConfig.currentConfig(),
            node.isSeed && this.networkHandler.activeNetwork.highlightSeeds,
            false,
            1.0,
            this.nodeRenderer
          )
        );
        updatedNodes.push(node);
      }
      this.nodeData.nodes.update(updatedNodes);
      for (const node of proteins) {
        const pos = this.networkInternal.getPositions([node.id]);
        node.x = pos[node.id].x;
        node.y = pos[node.id].y;

        Object.assign(
          node,
          NetworkSettings.getNodeStyle(
            node,
            this.drugstoneConfig.currentConfig(),
            node.isSeed && this.networkHandler.activeNetwork.highlightSeeds,
            this.analysis.inSelection(getWrapperFromNode(node)),
            1.0,
            this.nodeRenderer
          )
        );
        updatedNodes.push(node);
      }
      this.nodeData.nodes.update(updatedNodes);
      this.loadingScreen.stateUpdate(false);

    } else {
      this.selectedTissue = tissue;
      const minExp = 0;
      // filter out non-proteins, e.g. drugs
      const proteinNodes = [];
      this.nodeData.nodes.forEach(element => {
        if (element.drugstoneType === 'protein') {
          proteinNodes.push(element);
        }
      });
      this.netex.tissueExpressionGenes(this.selectedTissue, proteinNodes).subscribe(async (response) => {
          this.expressionMap = response;
          const updatedNodes = [];
          this.nodeRenderer = pieChartContextRenderer;
          // mapping from netex IDs to network IDs, TODO check if this step is necessary
          const networkIdMapping = {};
          this.nodeData.nodes.get().forEach(element => {
            if (element.drugstoneType === 'protein') {
              this.nodeGroupsWithExpression.add(element.group);
              element.drugstoneId.forEach(id => {
                if (networkIdMapping[id]) {
                  networkIdMapping[id].push(element.id);
                } else {
                  networkIdMapping[id] = [element.id];
                }
              });
            }
          });
          let maxExpr = 1_000_000;
          await this.netex.maxTissueExpression(this.selectedTissue).then(response => {
            maxExpr = response.max;
          }).catch(err => {
            console.error(err);
            maxExpr = Math.max(...Object.values(this.expressionMap));
          });
          const exprMap = {};
          for (const [drugstoneId, expressionlvl] of Object.entries(this.expressionMap)) {
            networkIdMapping[drugstoneId].forEach(networkId => {
              if (!exprMap[networkId]) {
                exprMap[networkId] = [expressionlvl];
              } else {
                exprMap[networkId].push(expressionlvl);
              }
            });
          }
          this.expressionMap = {};
          Object.keys(exprMap).forEach(networkId => {
            const expressionlvl = exprMap[networkId] ? exprMap[networkId].reduce((a, b) => a + b) / exprMap[networkId].length : null;
            this.expressionMap[networkId] = expressionlvl;
            const node = this.nodeData.nodes.get(networkId);
            if (node === null) {
              return;
            }
            const wrapper = getWrapperFromNode(node);
            const gradient = expressionlvl !== null ? (Math.pow(expressionlvl / maxExpr, 1 / 3) * (1 - minExp) + minExp) : -1;
            this.gradientMap[networkId] = gradient;
            const pos = this.networkInternal.getPositions([networkId]);
            node.x = pos[networkId].x;
            node.y = pos[networkId].y;
            Object.assign(node,
              NetworkSettings.getNodeStyle(
                node,
                this.drugstoneConfig.currentConfig(),
                node.isSeed && this.networkHandler.activeNetwork.highlightSeeds,
                this.analysis.inSelection(wrapper),
                gradient,
                this.nodeRenderer));
            // custom ctx renderer for pie chart
            node.shape = 'custom';
            node.ctxRenderer = pieChartContextRenderer;
            updatedNodes.push(node);
          });
          this.nodeData.nodes.update(updatedNodes);
          this.loadingScreen.stateUpdate(false);
        }
      );
    }
    this.currentViewSelectedTissue = this.selectedTissue;
  }

  public hasDrugsLoaded(): boolean {
    if (this.nodeData && this.nodeData.nodes) {
      for (const node of this.nodeData.nodes.get()) {
        if (node.drugstoneType && node.drugstoneId === 'drug') {
          return true;
        }
      }
    }
    return false;
  }

  public getGradient(nodeId: string) {
    return (Object.keys(this.gradientMap).length && this.gradientMap[nodeId] != null) ? this.gradientMap[nodeId] : 1.0;
  }

  /**
   * To highlight the seeds in the analysis network, not used in the browser network
   * @param bool
   */
  public updateHighlightSeeds(bool: boolean) {
    this.loadingScreen.stateUpdate(true);
    this.highlightSeeds = bool;
    const updatedNodes = [];
    if (this.highlightSeeds) {
      this.legendService.add_to_context('seeds');
    } else {
      this.legendService.remove_from_context('seeds');
    }
    for (const node of this.nodeData.nodes.get().filter(n => n.drugstoneType === 'protein')) {
      if (node.drugstoneId === undefined) {
        // nodes that are not mapped to backend remain untouched
        continue;
      }
      // const node: Node = this.nodeData.nodes.get(item.id);
      if (!node) {
        continue;
      }
      const pos = this.networkHandler.activeNetwork.networkInternal.getPositions([node.id]);
      node.x = pos[node.id].x;
      node.y = pos[node.id].y;
      const isSeed = this.highlightSeeds ? this.seedMap[node.id] : false;
      Object.assign(
        node,
        NetworkSettings.getNodeStyle(
          node,
          this.drugstoneConfig.currentConfig(),
          isSeed,
          this.analysis.inSelection(getWrapperFromNode(node)),
          this.getGradient(node.id),
          this.nodeRenderer
        )
      ),
        updatedNodes.push(node);
    }
    this.nodeData.nodes.update(updatedNodes);
    this.loadingScreen.stateUpdate(false);
  }

  public toggleFullscreen() {
    this.fullscreen = !this.fullscreen;
    this.loadingScreen.fullscreenUpdate(this.fullscreen);
  }

  public showEULA() {
    this.drugstoneConfig.showLicense = true;
  }

  public hideMenu() {
    setTimeout(() => {
      this.showMenu = false;
    }, 100);
  }
}
