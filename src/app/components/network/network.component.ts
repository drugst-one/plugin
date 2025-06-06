import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import domtoimage from 'dom-to-image-cross-origin';
import {InteractionDatabase} from 'src/app/config';
import {DrugstoneConfigService} from 'src/app/services/drugstone-config/drugstone-config.service';
import {NetexControllerService} from 'src/app/services/netex-controller/netex-controller.service';
import {OmnipathControllerService} from 'src/app/services/omnipath-controller/omnipath-controller.service';
import {mapCustomEdge, mapCustomNode, mapNetexEdge} from '../../main-network';
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
import {downLoadFile, pieChartContextRenderer} from 'src/app/utils';
import {NetworkHandlerService} from 'src/app/services/network-handler/network-handler.service';
import {LegendService} from 'src/app/services/legend-service/legend-service.service';
import {LoadingScreenService} from 'src/app/services/loading-screen/loading-screen.service';
import {version} from '../../../version';
import {Subject} from 'rxjs';
import { ToastService } from 'src/app/services/toast/toast.service';
import { LoggerService } from 'src/app/services/logger/logger.service';

declare var C2S: any;

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss']
})
export class NetworkComponent implements OnInit {

  constructor(
    public legendService: LegendService,
    public networkHandler: NetworkHandlerService,
    public analysis: AnalysisService,
    public drugstoneConfig: DrugstoneConfigService,
    public netex: NetexControllerService,
    public omnipath: OmnipathControllerService,
    public loadingScreen: LoadingScreenService,
    public toast: ToastService,
    public logger: LoggerService
  ) {
    try {
      this.versionString = version;
    } catch (e) {
    }
    if(version)
      this.readLatestVersion()
  }

  @Input() public networkType: NetworkType;
  @Input() public nodeData: NodeData;

  @ViewChild('network', {static: false}) networkEl: ElementRef;
  @ViewChild('networkWithLegend', {static: false}) networkWithLegendEl: ElementRef;

  public networkInternal: any = null;
  public inputNetwork: NetworkData = {nodes: [], edges: []};

  public selectedWrapper: Wrapper | null = null;

  public activeEdge: NodeInteraction;

  public adjacentDrugs = false;

  public ignorePosition = false;

  public selectedDrugTargetType = new Subject<string | null>();
  public selectedDrugTargetTypeLast: string | null = null;
  public selectedDrugTargetType$ = this.selectedDrugTargetType.asObservable();
  public drugTargetTypes: string[] = [];
  public drugTargetTypesWithoutAdj: string[] = [];

  public adjacentDisordersProtein = false;
  public adjacentDisordersDrug = false;
  public adjacentDrugList: Node[] = [];
  public adjacentDrugEdgesList: Node[] = [];
  public adjacentProteinDisorderList: Node[] = [];
  public adjacentProteinDisorderEdgesList: Node[] = [];
  public adjacentDrugDisorderList: Node[] = [];
  public adjacentDrugDisorderEdgesList: Node[] = [];

  public undirectedEdges;

  public currentDataset = [];

  public currentViewProteins: Node[] = [];
  public currentViewSelectedTissue: Tissue | null = null;
  public currentViewNodes: Node[] = [];
  public currentViewEdges: NodeInteraction[];

  public expressionExpanded = false;
  public drugTargetSelectionExpanded = false;
  public selectedTissue: Tissue | null = null;


  // change this to true to have sidebar open per default
  // public networkSidebarOpen = false;

  public queryItems: Wrapper[] = [];

  public networkPositions: any;

  public highlightSeeds = false;
  public seedMap: NodeAttributeMap = {};

  // keys are node drugstoneIds
  public expressionMap: NodeAttributeMap = {};
  public gradientMap: NodeAttributeMap = {};

  public fullscreen = false;

  public nodeRenderer = null;

  public loading = false;

  public versionString = undefined;
  public latestVersionString = undefined;

  public nodeGroupsWithExpression: Set<string> = new Set();

  private selectMode = false;

  @Output() createNetwork: EventEmitter<string> = new EventEmitter<string>();
  @Output() networkEmitter: EventEmitter<string> = new EventEmitter<string>();


  ngOnInit(): void {
    this.networkHandler.networks[this.networkType] = this;
  }

  isBig(): boolean {
    return this.nodeData.nodes.length > 100 || this.nodeData.edges.length > 100;
  }

  @Output() resetEmitter: EventEmitter<boolean> = new EventEmitter();

  public reset() {
    this.resetEmitter.emit(true);
  }
  async readLatestVersion() {
    this.latestVersionString = await this.netex.getLatestVersion(this.versionString)
  }

  exportSVG() {
    // Found this idea in a bug ticket: https://github.com/almende/vis/issues/723#issuecomment-460763667

    const canvas = this.networkEl.nativeElement.querySelector('canvas');

    // Create a new SVG context
    const ctx = new C2S({
      width: canvas.width,
      height: canvas.height,
      embedImages: true,
    });

    // Monkey patch the canvas context temporarily
    const canvasProto = this.networkInternal.canvas.__proto__;
    const originalGetContext = canvasProto.getContext;

    canvasProto.getContext = function () {
      return ctx;
    };

    // Force redraw with SVG context
    const originalOptions = this.networkInternal.getOptionsFromConfigurator?.() || {};
    const svgOptions = {
      nodes: {
        shapeProperties: {
          interpolation: false,
        },
        scaling: {
          label: { drawThreshold: 0 },
        },
      },
      edges: {
        scaling: {
          label: { drawThreshold: 0 },
        },
      },
    };

    this.networkInternal.setOptions(svgOptions);
    this.networkInternal.redraw();

    const svgString = ctx.getSerializedSvg(true);

    // Restore the original context and options after export
    canvasProto.getContext = originalGetContext;
    this.networkInternal.setOptions(originalOptions);

    return downLoadFile(svgString, "mage/svg+xml;charset=utf-8", "svg", "drugstone" );
  }


  getResetInputNetwork(): NetworkData {
    const nodes = [...this.nodeData.nodes.get()];
    nodes.forEach(n => {
      if (n._group) {
        n.group = n._group;
        delete n._group;
      }
    });
    const uniqueEdges = new Map();
    this.nodeData.edges.get().forEach(edge => {
      const key = `${edge.from}->${edge.to}`;
      if (!uniqueEdges.has(key)) {
        uniqueEdges.set(key, edge);
      }
    });
    const edges = Array.from(uniqueEdges.values());
    return {edges: edges, nodes};
  }

  public getDrugTargetTypes() {
    return this.drugTargetTypes;
  }

  public subscribeSelection(callback) {
    this.selectedDrugTargetType$.subscribe(() => {
      callback();
    });
  }

  public setDrugTargetTypes(drugTargetTypes: string[], adj = false) {
    if (adj) {
      this.drugTargetTypesWithoutAdj = [...drugTargetTypes];
      drugTargetTypes.filter(type => !this.drugTargetTypes.includes(type)).forEach((type) => {
        this.drugTargetTypes.push(type);
      });
    } else {
      this.drugTargetTypes = drugTargetTypes;
    }
  }

  // TODO create method to get selected drug target type as string instead of subject or observable
  public setSelectedDrugTargetType(value: string | null) {
    this.selectedDrugTargetTypeLast = value;
    this.selectedDrugTargetType.next(value);
  }

  public getSelectedDrugTargetType() {
    return this.selectedDrugTargetTypeLast;
  }

  resetInputNetwork() {
    const nodes = this.inputNetwork.nodes;
    nodes.forEach(n => {
      if (n._group) {
        n.group = n._group;
        delete n._group;
      }
    });
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
            }, this.drugstoneConfig.config, this.drugstoneConfig, false);
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
            this.adjacentDrugDisorderEdgesList.push(mapCustomEdge(edge, this.drugstoneConfig.currentConfig(), this.drugstoneConfig, false));
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

  public updateAdjacentDrugSelection(event, stabil: boolean) {
    this.networkHandler.activeNetwork.drugTargetSelectionExpanded = false;
    if (event === this.getSelectedDrugTargetType()) {
      return;
    }
    this.setSelectedDrugTargetType(event);
    if (this.networkHandler.activeNetwork.showsAdjacentDrugs()) {
      this.updateAdjacentDrugs(false, false).then(() => {
        // if (this.networkHandler.activeNetwork.hasDrugsLoaded()) {
        //   this.updateFoundDrugs(stabil).then(() => {
        this.updateAdjacentDrugs(true, stabil);
        // });
        // } else {
        //   this.updateAdjacentDrugs(true, stabil);
        // }
      });
    }
    // else {
    //   this.updateFoundDrugs(stabil);
    // }
  }

  public showsAdjacentDrugs(): boolean {
    return this.adjacentDrugs;
  }

  public updateFoundDrugs(stabl: boolean): Promise<any> {
    return new Promise<boolean>(async (resolve, reject) => {

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
        this.netex.adjacentDrugs(this.drugstoneConfig.config.interactionDrugProtein, this.drugstoneConfig.config.licensedDatasets, this.nodeData.nodes.get(), this.drugstoneConfig.currentConfig().approvedDrugs).then(response => {
          const existingDrugIDs = this.nodeData.nodes.get().filter(n => n.drugstoneId && n.drugstoneType === 'drug').map(n => n.drugstoneId);
          const availableDrugTargetTypes = new Set<string>();
          for (const interaction of response.pdis) {
            if (interaction.actions) {
              for (const action of interaction.actions) {
                availableDrugTargetTypes.add(action);
              }
            }
            if (this.networkHandler.activeNetwork.getSelectedDrugTargetType() && interaction.actions && !interaction.actions.includes(this.networkHandler.activeNetwork.getSelectedDrugTargetType())) {
              continue;
            }
            const label = interaction.actions && interaction.actions.length > 0 ? interaction.actions.join(',') : undefined;
            const edge = mapCustomEdge({
              from: interaction.protein,
              to: interaction.drug
            }, this.drugstoneConfig.currentConfig(), this.drugstoneConfig, false);
            if (proteinMap[edge.from]) {
              proteinMap[edge.from].forEach(from => {
                if (addedEdge[from] && addedEdge[from].indexOf(edge.to) !== -1) {
                  return;
                }
                const e = JSON.parse(JSON.stringify(edge));
                e.from = from;
                e.to = edge.to;
                if (label) {
                  e.label = label;
                }
                this.adjacentDrugEdgesList.push(e);
                if (!addedEdge[from]) {
                  addedEdge[from] = [edge.to];
                } else {
                  addedEdge[from].push(edge.to);
                }
              });
            }
            this.networkHandler.activeNetwork.setDrugTargetTypes(Array.from(availableDrugTargetTypes), true);
          }
          const addedDrugs = new Set<string>();
          Object.values(addedEdge).forEach(targets => { // @ts-ignore
            targets.forEach(t => addedDrugs.add(t));
          });
          for (const drug of response.drugs) {
            drug.group = 'foundDrug';
            drug.id = getDrugNodeId(drug);
            if (!existingDrugIDs.includes(drug.drugstoneId) && addedDrugs.has(drug.drugstoneId)) {
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
    // @ts-ignore
    this.downloadDom(this.networkWithLegendEl.nativeElement).catch(error => {
      console.error('Falling back to network only screenshot. Some components seem to be inaccessible, most likely the legend is a custom image with CORS access problems on the host server side.');
      // @ts-ignore
      this.downloadDom(this.networkEl.nativeElement).catch(e => {
        console.error('Some network content seems to be inaccessible for saving as a screenshot. This can happen due to custom images used as nodes. Please ensure correct CORS accessability on the images host server.');
        this.loadingScreen.stateUpdate(false)
        console.error(e);
      });
    });
  }

  public async downloadDom(originalElement: object) {
    this.loadingScreen.stateUpdate(true)
    // @ts-ignore
    let originalCanvas = originalElement.querySelector('canvas');

    let position = this.networkInternal.getViewPosition();
    let scale = this.networkInternal.getScale()

    let ratio = 8;

    let originalHeight = originalCanvas.clientHeight;
    let originalWidth = originalCanvas.clientWidth;
    originalCanvas.width = originalWidth * ratio;
    originalCanvas.height = originalHeight * ratio;
    originalCanvas.style.width = "calc( 100% * " + ratio + ")";
    originalCanvas.style.height = "calc( 100% * " + ratio + ")";

    let newCanvas = document.createElement('canvas');
    let canvasContainer = document.createElement('div');
    newCanvas.width = originalCanvas.width;
    newCanvas.height = originalCanvas.height;
    newCanvas.style.width = originalCanvas.style.width;
    newCanvas.style.height = originalCanvas.style.height;
    let newCtx = newCanvas.getContext('2d');
    canvasContainer.appendChild(newCanvas)
    canvasContainer.style.height = originalCanvas.height;
    canvasContainer.style.width = originalCanvas.width;
    canvasContainer.style.position = "relative";
    let legendElement;
    legendElement = document.body.getElementsByClassName("drugstone-plugin-legend")[0];
    if (!legendElement)
      legendElement = document.body.getElementsByClassName("legend")[0];
    // @ts-ignore
    let legend = legendElement.cloneNode(true);
    legend.style['max-width'] = '11rem'
    legend.style.width = "auto";
    legend.style.position = "absolute";
    legend.style.bottom = "0px";
    legend.style.zoom = ((legend.classList.contains("legend-small") ? 0.75 : 1) * ratio).toString();
    let right = this.drugstoneConfig.config.legendPos === 'right'
    if (right) {
      //TODO fix legend position
    } else {
      legend.style['transform-origin'] = "bottom left";
    }
    // @ts-ignore
    canvasContainer.appendChild(legend)

    this.networkInternal.once("afterDrawing", () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          createImageBitmap(originalCanvas).then(imgBitmap => {
            newCtx.drawImage(imgBitmap, 0, 0);
            document.body.appendChild(canvasContainer);
            requestAnimationFrame(() => {
              setTimeout(() => {
                return domtoimage.toPng(canvasContainer).then((generatedImage) => {
                  const a = document.createElement('a');
                  a.href = generatedImage;
                  a.download = `Network.png`;
                  this.logger.logMessage(`Downloaded network as PNG: ${a.download}`);
                  a.click();
                }).catch(e => {
                  console.error(e);
                  this.analysis.screenshotError()
                }).finally(() => {
                  document.body.removeChild(canvasContainer);
                  originalCanvas.width = originalWidth;
                  originalCanvas.height = originalHeight;
                  originalCanvas.style.width = "100%";
                  originalCanvas.style.height = "100%";
                  this.networkInternal.moveTo({position, scale: scale, animation: false});
                  this.loadingScreen.stateUpdate(false)
                });
              }, 1000);
            });
          });
        }, 2500);
      });
    });
    // @ts-ignore
    this.networkInternal.moveTo({
      position,
      scale: ratio * scale,
      animation: false
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

  getMinXCoordinate(nodes: any[]): number {
    let minX = nodes.length > 0 ? nodes[0]["x"] : 0;
    nodes.forEach(node => {
      if (node["x"] < minX) {
        minX = node["x"];
      }
    });
    return minX;
  }


  drawLabelOnCanvas(canvasElement: HTMLCanvasElement, maxX: number, y: number, label: string) {
    const context = canvasElement.getContext('2d');
    const text = label.startsWith("Multiple") ? "Multiple" : label;
    const x = maxX - 500;
    context.font = "bold 40px verdana, sans-serif ";
    context.fillStyle = "black";
    this.networkHandler.activeNetwork.networkInternal.on("beforeDrawing", function (ctx) {
      context.fillText(text, x, y);
    });
  }

  getYpositions(nodes: any[]): any {
    let yPositions = {};
    nodes.forEach(node => {
      if (!(node["layer"] in yPositions)) {
        yPositions[node["layer"]] = node["y"];
      }
    });
    return yPositions;
  }

  private removeXYFromNodes(nodes: any[]): any[] {
    for (const node of nodes) {
      delete node["x"];
      delete node["y"];
    }
    return nodes;
  }

  public updateLabel(idspace: string) {
    for (const node of this.nodeData.nodes.get()) {
      const labelArray = node[idspace];
      node["label"] = labelArray && labelArray.length > 0 ? labelArray[0] : node.id;    }
    const nodes = this.nodeData.nodes.get();
    this.nodeData.nodes.update(nodes);
  }

  public async removeNode(node: any) {
    this.logger.logMessage(`Deleted node with id: ${node["id"]} and label: ${node["label"] ?? node["id"]}`);
    const nodesToRemove = this.nodeData.nodes.get().filter(n => n.id === node.id);
    const edgesToRemove = this.nodeData.edges.get().filter(e => e.from === node.id || e.to === node.id);

    this.nodeData.nodes.remove(nodesToRemove.map(n => n.id));
    this.nodeData.edges.remove(edgesToRemove.map(e => e.id));
    const nodes = await this.netex.recalculateStatistics({ "nodes": this.nodeData.nodes.get(), "edges": this.nodeData.edges.get() }, this.drugstoneConfig.currentConfig());
    this.nodeData.nodes.update(nodes);
    // remove drugs and disorders when node is deleted
    if(this.adjacentDrugs || this.adjacentDisordersDrug || this.adjacentDisordersProtein){
      await this.updateAdjacentDrugs(false, true);
      await this.updateAdjacentProteinDisorders(false, true);
      await this.updateAdjacentDrugDisorders(false, true);
    }
  }

  public async addNode(node: Node) {
    this.updateDirectedEdgesOverlay(false);
    if (this.drugstoneConfig.currentConfig().layoutOn) {
      await this.updateLayoutEnabled(false);
    }
    this.logger.logMessage(`Added node with id: ${node["id"]} and label: ${node["label"] ?? node["id"]}`);
    var nodes = this.nodeData.nodes.get();
    for (const n of nodes) {
      if (n.id === node.id) {
        this.toast.setNewToast({ "message": 'The added node was already part of the network.', type: 'warning' });
        return;
      }
    }
    nodes.push(node);
    const edges = this.nodeData.edges.get();
    if(this.drugstoneConfig.currentConfig().autofillEdges){
      await this.autofill_edges_for_new_node(nodes, edges, node);
    }
    nodes = await this.netex.recalculateStatistics({"nodes": nodes, "edges": edges}, this.drugstoneConfig.currentConfig());
    await this.nodeData.nodes.update(nodes);
    await this.nodeData.edges.update(edges);
    // remove drugs and disorders when node is added
    if (this.adjacentDrugs || this.adjacentDisordersDrug || this.adjacentDisordersProtein) {
      await this.updateAdjacentDrugs(false, true);
      await this.updateAdjacentProteinDisorders(false, true);
      await this.updateAdjacentDrugDisorders(false, true);
    }
  }

  private async autofill_edges_for_new_node(nodes: any, edges: any, addedNode: any) {
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
    const filteredNodes = nodes.filter(n => n.drugstoneType === 'protein');
    const netexEdges = await this.netex.fetchEdges(filteredNodes, this.drugstoneConfig.currentConfig().interactionProteinProtein, this.drugstoneConfig.currentConfig().licensedDatasets);
    const filteredEdges = netexEdges.filter(edge => edge.proteinA === addedNode["drugstoneId"][0] || edge.proteinB === addedNode["drugstoneId"][0]);
    edges.push(...filteredEdges.map(netexEdge => mapNetexEdge(netexEdge, this.drugstoneConfig.currentConfig(), node_map)).flatMap(e => e));
  }

  public updateDirectedEdgesOverlay(bool: boolean) {
    this.drugstoneConfig.currentConfig().overlayDirectedEdges = bool;
    this.loadingScreen.stateUpdate(true);
    if (bool) {
      this.undirectedEdges = this.nodeData.edges.get();
      const nodes = this.nodeData.nodes.get();
      const nodesMappedDict: { [key: string]: any } = {};
      nodes.forEach((node: any) => {
        nodesMappedDict[node["id"]] = node;
      });
      const drugstoneMapping: { [key: string]: string } = {};
      nodes.forEach((node: any) => {
        if (node.drugstoneId && node.drugstoneId.length > 0) {
          drugstoneMapping[node["drugstoneId"][0]] = node["id"];
        }
      });
      this.netex.overlayDirectedEdges(this.nodeData.edges.get(), nodesMappedDict, drugstoneMapping).then(response => {
        const mappedEdges = response.flatMap(edge => mapCustomEdge(edge, this.drugstoneConfig.currentConfig(), this.drugstoneConfig));
        this.nodeData.edges.update(mappedEdges);
      }
    )} else {
      if (this.undirectedEdges) {
        this.nodeData.edges.clear();
        this.nodeData.edges.update(this.undirectedEdges);
      }
    }
    this.loadingScreen.stateUpdate(false);
  }

  clearCanvas() {
    this.networkInternal.off("beforeDrawing");
  }

  public async updateLayoutEnabled(bool: boolean) {
    this.drugstoneConfig.currentConfig().layoutOn = bool;
    let minX;
    let yPositions;
    let ys: number[] = [];
    this.loadingScreen.stateUpdate(true);

    if (bool){
      this.ignorePosition = false;
      this.netex.applyLayout(this.nodeData.nodes.get(), "True").then(response => {
        this.nodeData.nodes.update(response);
        minX = this.getMinXCoordinate(response);
        yPositions = this.getYpositions(response);
        let originalCanvas = this.networkEl.nativeElement.querySelector('canvas');
        ys = [];
        Object.keys(yPositions).forEach(key => {
          ys.push(yPositions[key]);
          this.drawLabelOnCanvas(originalCanvas, minX, yPositions[key], key);
        });
      });
    } else if (this.nodeData.nodes){
      this.clearCanvas();
      const nodes = this.removeXYFromNodes(this.nodeData.nodes.get());
      await this.nodeData.nodes.update(nodes);

      await this.stabilize();
    }
    this.loadingScreen.stateUpdate(false);
  }

  public getOptions() {
    return this.networkInternal.options;
  }

  public updateOptions(options: any) {
    this.networkInternal.setOptions(options);
  }

  public openEdgeSummary(edgeId: string) {
    this.selectedWrapper = undefined;
    const edgeMap = this.nodeData.edges.get({returnType: 'Object'});
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
        if (node.drugstoneType && node.drugstoneType === 'drug') {
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
      const pos = this.networkInternal.getPositions([node.id]);
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
    this.drugstoneConfig.config.fullscreen = !this.drugstoneConfig.config.fullscreen;
    this.loadingScreen.fullscreenUpdate(this.drugstoneConfig.config.fullscreen);
  }

  public isFullscreen() {
    return this.drugstoneConfig.config.fullscreen && !this.analysis.analysisActive;
  }

  public showEULA() {
    this.drugstoneConfig.showLicense = true;
  }

  public openBugreport() {
    this.drugstoneConfig.showBugreport = true;
  }

  protected readonly undefined = undefined;
}
