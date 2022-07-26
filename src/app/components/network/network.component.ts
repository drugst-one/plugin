import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import domtoimage from 'dom-to-image';
import {InteractionDatabase} from 'src/app/config';
import {DrugstoneConfigService} from 'src/app/services/drugstone-config/drugstone-config.service';
import {NetexControllerService} from 'src/app/services/netex-controller/netex-controller.service';
import {OmnipathControllerService} from 'src/app/services/omnipath-controller/omnipath-controller.service';
import {mapCustomEdge, mapCustomNode, mapNetexEdge, ProteinNetwork} from '../../main-network';
import {
  getDrugNodeId,
  getWrapperFromNode,
  LegendContext,
  Node,
  NodeData,
  NodeAttributeMap,
  NodeInteraction,
  Tissue,
  Wrapper,
  NetworkType
} from '../../interfaces';
import {AnalysisService} from 'src/app/services/analysis/analysis.service';
import {NetworkSettings} from 'src/app/network-settings';
import {pieChartContextRenderer} from 'src/app/utils';
import {NetworkHandlerService} from 'src/app/services/network-handler/network-handler.service';


@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss']
})
export class NetworkComponent implements OnInit {

  @Input() public networkType: NetworkType;
  @Input() public nodeData: NodeData;
  @Input() public legendContext: LegendContext;


  @ViewChild('network', {static: false}) networkEl: ElementRef;
  @ViewChild('networkWithLegend', {static: false}) networkWithLegendEl: ElementRef;

  public networkInternal: any = null;

  public selectedWrapper: Wrapper | null = null;

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
  public networkSidebarOpen = false;

  public queryItems: Wrapper[] = [];

  public networkPositions: any;

  public highlightSeeds = false;
  public seedMap: NodeAttributeMap = {};

  // keys are node drugstoneIds
  public expressionMap: NodeAttributeMap = {};
  public gradientMap: NodeAttributeMap = {};


  constructor(public networkHandler: NetworkHandlerService, public analysis: AnalysisService, public drugstoneConfig: DrugstoneConfigService, public netex: NetexControllerService, public omnipath: OmnipathControllerService) {
  }

  ngOnInit(): void {
    this.networkHandler.networks[this.networkType] = this;
  }

  async getInteractions(key: InteractionDatabase) {
    let edges = [];
    if (key == 'omnipath') {
      const names = this.nodeData.nodes.map((node) => node.label);
      const nameToNetworkId = {};
      this.nodeData.nodes.map((node) => nameToNetworkId[node.label] = node.id);
      edges = await this.omnipath.getInteractions(names, this.drugstoneConfig.config.identifier, nameToNetworkId);
    }
    this.nodeData.edges.update(edges);
  }

  updateQueryItems() {
    this.queryItems = [];
    this.currentViewNodes.forEach((protein) => {
      this.queryItems.push(getWrapperFromNode(protein));
    });
  }

  public saveAddNodes(nodeList: Node[]) {
    const existing = this.nodeData.nodes.get().map(n => n.id);
    const toAdd = nodeList.filter(n => existing.indexOf(n.id) === -1)
    this.nodeData.nodes.add(toAdd);
  }

  public updateAdjacentProteinDisorders(bool: boolean) {
    this.adjacentDisordersProtein = bool;
    if (this.adjacentDisordersProtein) {

      this.netex.adjacentDisorders(this.nodeData.nodes.get(), 'proteins', this.drugstoneConfig.config.associatedProteinDisorder, this.drugstoneConfig.config.licencedDatasets).subscribe(response => {
        const proteinMap = this.getProteinMap()
        const addedEdge = {}
        for (const interaction of response.edges) {
          const edge = mapCustomEdge({from: interaction.protein, to: interaction.disorder}, this.drugstoneConfig.config)
          if (proteinMap[edge.from]) {
            proteinMap[edge.from].forEach(from => {
              if (addedEdge[from] && addedEdge[from].indexOf(edge.to) !== -1)
                return
              const e = JSON.parse(JSON.stringify(edge))
              e.from = from
              e.to = edge.to
              this.adjacentProteinDisorderEdgesList.push(e);
              if (!addedEdge[from])
                addedEdge[from] = [edge.to]
              else
                addedEdge[from].push(edge.to)
            })
          }
        }
        for (const disorder of response.disorders) {
          disorder.group = 'defaultDisorder';
          disorder.id = disorder.drugstoneId;
          this.adjacentProteinDisorderList.push(mapCustomNode(disorder, this.drugstoneConfig.config))
        }
        this.saveAddNodes(this.adjacentProteinDisorderList);
        this.nodeData.edges.add(this.adjacentProteinDisorderEdgesList);
        this.updateQueryItems();
      });
      this.legendContext = this.adjacentDrugs ? 'adjacentDrugsAndDisorders' : 'adjacentDisorders';
    } else {
      this.saveRemoveDisorders(this.adjacentProteinDisorderList);
      this.nodeData.edges.remove(this.adjacentProteinDisorderEdgesList);
      this.adjacentProteinDisorderList = [];
      this.adjacentProteinDisorderEdgesList = [];
      this.legendContext = this.adjacentDisordersDrug ? this.legendContext : this.adjacentDrugs ? 'adjacentDrugs' : 'explorer';
      this.updateQueryItems();
    }
  }

  public updateAdjacentDrugDisorders(bool: boolean) {
    this.adjacentDisordersDrug = bool;
    if (this.adjacentDisordersDrug) {
      this.netex.adjacentDisorders(this.nodeData.nodes.get(), 'drugs', this.drugstoneConfig.config.indicationDrugDisorder, this.drugstoneConfig.config.licencedDatasets).subscribe(response => {
        for (const interaction of response.edges) {
          const edge = {from: interaction.drug, to: interaction.disorder};
          this.adjacentDrugDisorderEdgesList.push(mapCustomEdge(edge, this.drugstoneConfig.config));
        }
        for (const disorder of response.disorders) {
          disorder.group = 'defaultDisorder';
          disorder.id = disorder.drugstoneId;
          this.adjacentDrugDisorderList.push(mapCustomNode(disorder, this.drugstoneConfig.config));
        }
        this.saveAddNodes(this.adjacentDrugDisorderList);
        this.nodeData.edges.add(this.adjacentDrugDisorderEdgesList);
        this.updateQueryItems();
      });
      this.legendContext = this.adjacentDrugs ? 'adjacentDrugsAndDisorders' : 'adjacentDisorders';
    } else {
      this.saveRemoveDisorders(this.adjacentDrugDisorderList);
      this.nodeData.edges.remove(this.adjacentDrugDisorderEdgesList);
      this.adjacentDrugDisorderList = [];
      this.adjacentDrugDisorderEdgesList = [];
      this.legendContext = this.adjacentDisordersProtein ? this.legendContext : this.adjacentDrugs ? 'adjacentDrugs' : 'explorer';
      this.updateQueryItems();
    }
  }

  public getProteinMap() {
    const proteinMap = {}
    this.nodeData.nodes.get().forEach(n => {
      if (n.drugstoneType === 'protein') {
        n.drugstoneId.forEach(id => {
          if (typeof id === 'string') {
            if (proteinMap[id])
              proteinMap[id].push(n.id)
            else
              proteinMap[id] = [n.id];
          } else {
            n.id.forEach(single_id => {
              if (proteinMap[single_id])
                proteinMap[single_id].push(n.id)
              else
                proteinMap[single_id] = [n.id];
            })
          }
        });
      }
    });
    return proteinMap
  }

  public updateAdjacentDrugs(bool: boolean) {
    this.adjacentDrugs = bool;
    if (this.adjacentDrugs) {
      const addedEdge = {}
      const proteinMap = this.getProteinMap()
      this.netex.adjacentDrugs(this.drugstoneConfig.config.interactionDrugProtein, this.drugstoneConfig.config.licencedDatasets, this.nodeData.nodes.get()).subscribe(response => {
        const existingDrugIDs = this.nodeData.nodes.get().filter(n => n.drugstoneId && n.drugstoneType === 'drug').map(n => n.drugstoneId);
        for (const interaction of response.pdis) {
          const edge = mapCustomEdge({from: interaction.protein, to: interaction.drug}, this.drugstoneConfig.config)

          if (proteinMap[edge.from]) {
            proteinMap[edge.from].forEach(from => {
              if (addedEdge[from] && addedEdge[from].indexOf(edge.to) !== -1)
                return
              const e = JSON.parse(JSON.stringify(edge))
              e.from = from
              e.to = edge.to
              this.adjacentDrugEdgesList.push(e);
              if (!addedEdge[from])
                addedEdge[from] = [edge.to]
              else
                addedEdge[from].push(edge.to)
            })
          }
        }
        for (const drug of response.drugs) {
          drug.group = 'foundDrug';
          drug.id = getDrugNodeId(drug);
          if (existingDrugIDs.indexOf(drug.drugstoneId) === -1) {
            this.adjacentDrugList.push(mapCustomNode(drug, this.drugstoneConfig.config))
          }
        }

        this.nodeData.nodes.add(this.adjacentDrugList);
        this.nodeData.edges.add(this.adjacentDrugEdgesList);
        this.updateQueryItems();
      })
      this.legendContext = this.adjacentDisordersDrug || this.adjacentDisordersProtein ? 'adjacentDrugsAndDisorders' : 'adjacentDrugs';
    } else {
      // remove adjacent drugs, make sure that also drug associated disorders are removed
      if (this.adjacentDisordersDrug) {
        this.updateAdjacentDrugDisorders(false);
      }
      this.nodeData.nodes.remove(this.adjacentDrugList);
      this.nodeData.edges.remove(this.adjacentDrugEdgesList);
      this.adjacentDrugList = [];
      this.adjacentDrugEdgesList = [];

      this.legendContext = this.adjacentDisordersDrug || this.adjacentDisordersProtein ? 'adjacentDisorders' : 'explorer';
      this.updateQueryItems();
    }
  }

  public saveRemoveDisorders(nodeList: Node[]) {
    const other = this.adjacentDrugDisorderList === nodeList ? this.adjacentProteinDisorderList : this.adjacentDrugDisorderList
    if (other == null)
      this.nodeData.nodes.remove(nodeList);
    else {
      const otherIds = other.map(d => d.id);
      const rest = nodeList.filter(d => otherIds.indexOf(d.id) === -1)
      this.nodeData.nodes.remove(rest)
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
    this.drugstoneConfig.config.physicsOn = bool;
    this.networkInternal.setOptions({
      physics: {
        enabled: this.drugstoneConfig.config.physicsOn,
        stabilization: {
          enabled: false,
        },
      }
    });
  }

  public zoomToNode(id: string) {
    // get network object, depending on whether analysis is open or not
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

  toggleNetworkSidebar() {
    this.networkSidebarOpen = !this.networkSidebarOpen;
  }

  public selectTissue(tissue: Tissue | null) {
    this.expressionExpanded = false;
    if (!tissue) {
      this.selectedTissue = null;
      const updatedNodes = [];
      // for (const item of this.proteins) {
      for (const item of this.currentViewProteins) {
        if (item.drugstoneId === undefined) {
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
            this.drugstoneConfig.config,
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
        if (element.drugstoneType === 'protein') {
          proteinNodes.push(element);
        }
      });
      this.netex.tissueExpressionGenes(this.selectedTissue, proteinNodes).subscribe((response) => {
          this.expressionMap = response;
          const updatedNodes = [];
          // mapping from netex IDs to network IDs, TODO check if this step is necessary
          const networkIdMapping = {}
          this.nodeData.nodes.get().forEach(element => {
            if (element.drugstoneType === 'protein') {
              element.drugstoneId.forEach(id => {
                if (networkIdMapping[id])
                  networkIdMapping[id].push(element.id);
                else
                  networkIdMapping[id] = [element.id]
              });
            }
          });
          const maxExpr = Math.max(...Object.values(this.expressionMap));
          const exprMap = {}
          for (const [drugstoneId, expressionlvl] of Object.entries(this.expressionMap)) {
            networkIdMapping[drugstoneId].forEach(networkId => {
              if (!exprMap[networkId])
                exprMap[networkId] = [expressionlvl]
              else
                exprMap[networkId].push(expressionlvl)
            })
          }
          this.expressionMap = {}
          Object.keys(exprMap).forEach(networkId => {
            const expressionlvl = exprMap[networkId] ? exprMap[networkId].reduce((a, b) => a + b) / exprMap[networkId].length : null;
            this.expressionMap[networkId] = expressionlvl
            const node = this.nodeData.nodes.get(networkId);
            if (node === null) {
              return;
            }
            const wrapper = getWrapperFromNode(node);
            const gradient = expressionlvl !== null ? (Math.pow(expressionlvl / maxExpr, 1 / 3) * (1 - minExp) + minExp) : -1;
            const pos = this.networkInternal.getPositions([networkId]);
            node.x = pos[networkId].x;
            node.y = pos[networkId].y;
            Object.assign(node,
              NetworkSettings.getNodeStyle(
                node,
                this.drugstoneConfig.config,
                node.isSeed,
                this.analysis.inSelection(wrapper),
                gradient));
            // custom ctx renderer for pie chart
            node.shape = 'custom';
            node.ctxRenderer = pieChartContextRenderer;
            updatedNodes.push(node);
          })
          this.nodeData.nodes.update(updatedNodes);
        }
      )
    }

    this.currentViewSelectedTissue = this.selectedTissue;
  }

  public hasDrugsLoaded(): boolean {
    if(this.nodeData && this.nodeData.nodes)
      for(const node of this.nodeData.nodes.get())
        if(node.drugstoneType && node.drugstoneId === 'drug')
          return true;
    return false;
  }

  public setLegendContext() {
    if (this.hasDrugsLoaded() || this.adjacentDrugs) {
      if (this.highlightSeeds) {
        this.legendContext = "drugAndSeeds";
      } else {
        this.legendContext = "drug";
      }
    } else {
      if (this.highlightSeeds) {
        this.legendContext = "drugTargetAndSeeds";
      } else {
        this.legendContext = 'drugTarget';
      }
    }
    console.log(this.legendContext)
  }

  /**
   * To highlight the seeds in the analysis network, not used in the browser network
   * @param bool
   */
  public updateHighlightSeeds(bool: boolean) {
    this.highlightSeeds = bool;
    const updatedNodes = [];
    for (const item of this.currentViewProteins) {
      if (item.drugstoneId === undefined) {
        // nodes that are not mapped to backend remain untouched
        continue;
      }
      const node: Node = this.nodeData.nodes.get(item.id);
      if (!node) {
        continue;
      }
      const pos = this.networkHandler.activeNetwork.networkInternal.getPositions([item.id]);
      node.x = pos[item.id].x;
      node.y = pos[item.id].y;
      const isSeed = this.highlightSeeds ? this.seedMap[node.id] : false;
      const gradient = (this.gradientMap !== {}) && (this.gradientMap[item.id]) ? this.gradientMap[item.id] : 1.0;
      Object.assign(
        node,
        NetworkSettings.getNodeStyle(
          node,
          this.drugstoneConfig.config,
          isSeed,
          this.analysis.inSelection(getWrapperFromNode(item)),
          gradient
        )
      )
      updatedNodes.push(node);
    }
    this.nodeData.nodes.update(updatedNodes);
    this.setLegendContext();
  }

}
