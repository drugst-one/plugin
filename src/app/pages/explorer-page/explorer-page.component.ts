import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import {ProteinViralInteraction, ViralProtein, Protein, QueryItem} from '../../interfaces';
import {ProteinNetwork, getDatasetFilename} from '../../main-network';
import {HttpClient, HttpParams} from '@angular/common/http';
import {AnalysisService} from '../../analysis.service';
import html2canvas from 'html2canvas';
import {environment} from '../../../environments/environment';


declare var vis: any;

@Component({
  selector: 'app-explorer-page',
  templateUrl: './explorer-page.component.html',
  styleUrls: ['./explorer-page.component.scss'],
})
export class ExplorerPageComponent implements OnInit, AfterViewInit {

  public showDetails = false;
  public selectedName = null;
  public selectedType = null;
  public selectedId = null;
  public selectedItem = null;
  public selectedVirusName = null;
  public selectedStatus = null;
  public collabsAnalysis = true;
  public collabsDetails = true;
  public collabsTask = true;
  public collabsSelection = true;
  public collabsDFilter = true;
  public collabsQuery = true;
  public collabsData = true;
  public collabsOverview = true;

  public viralProteinCheckboxes: Array<{ checked: boolean; data: ViralProtein }> = [];

  public proteinData: ProteinNetwork;

  public proteins: any;
  public effects: any;
  public edges: any;

  private network: any;
  public nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};

  private dumpPositions = false;
  public physicsEnabled = false;

  public queryItems: QueryItem[] = [];
  public showAnalysisDialog = false;
  public analysisDialogTarget: 'drug' | 'drug-target';

  public selectedAnalysisToken: string | null = null;

  public currentDataset = [];
  private screenshotArray = [0];

  public currentViewProteins: Protein[];
  public currentViewEffects: ViralProtein[];
  public currentViewNodes: Node[];

  public datasetItems: Array<{ id: string, label: string, datasets: string, data: Array<[string, string]> }> = [
    // {
    //   id: 'All (TUM & Krogan)',
    //   label: 'All',
    //   datasets: 'TUM & Krogan',
    //   data: [['TUM', 'HCoV'], ['TUM', 'SARS-CoV2'], ['Krogan', 'SARS-CoV2']]
    // },
    // {id: 'HCoV (TUM)', label: 'HCoV', datasets: 'TUM', data: [['TUM', 'HCoV']]},
    // {
    //   id: 'CoV2 (TUM & Krogan)',
    //   label: 'CoV2',
    //   datasets: 'TUM & Krogan',
    //   data: [['TUM', 'SARS-CoV2'], ['Krogan', 'SARS-CoV2']]
    // },
    // tslint:disable-next-line:max-line-length
    {id: 'CoV2 (Gordon et al., 2020)', label: 'CoV2', datasets: 'Gordon et al., 2020', data: [['Krogan', 'SARS-CoV2']]},
    // {id: 'CoV2 (TUM)', label: 'CoV2', datasets: 'TUM', data: [['TUM', 'SARS-CoV2']]}
      ];

  public selectedDataset = this.datasetItems[0];

  @ViewChild('network', {static: false}) networkEl: ElementRef;

  constructor(private http: HttpClient, public analysis: AnalysisService) {

    this.showDetails = false;

    this.analysis.subscribe((item, selected) => {
      let nodeId;
      if (item.type === 'Host Protein') {
        nodeId = `p_${item.name}`;
      } else if (item.type === 'Viral Protein') {
        nodeId = `eff_${item.name}`;
      }
      const node = this.nodeData.nodes.get(nodeId);
      if (!node) {
        return;
      }
      const pos = this.network.getPositions([nodeId]);
      node.x = pos[nodeId].x;
      node.y = pos[nodeId].y;
      if (selected) {
        node.color = '#48C774';
      } else {
        if (item.type === 'Host Protein') {
          node.color = '#e2b600';
        } else if (item.type === 'Viral Protein') {
          node.color = '#118AB2';
        }
      }
      this.nodeData.nodes.update(node);
    });
  }

  ngOnInit() {
  }


  async ngAfterViewInit() {
    if (!this.network) {
      this.selectedDataset = this.datasetItems[0];
      await this.createNetwork(this.selectedDataset.data);
    }
  }

  private async getNetwork(dataset: Array<[string, string]>) {
    this.currentDataset = dataset;
    const params = new HttpParams().set('data', JSON.stringify(dataset));
    const data = await this.http.get<any>(`${environment.backend}network/`, {params}).toPromise();
    this.proteins = data.proteins;
    this.effects = data.effects;
    this.edges = data.edges;
  }

  public reset(event) {
    const checked = event.target.checked;
    this.viralProteinCheckboxes.forEach(item => item.checked = checked);
    this.filterNodes();
  }

  private zoomToNode(id: string) {
    const coords = this.network.getPositions(id)[id];
    if (!coords) {
      return;
    }
    let zoomScale = null;
    if (id.startsWith('eff')) {
      zoomScale = 1.0;
    } else {
      zoomScale = 3.0;
    }
    this.network.moveTo({
      position: {x: coords.x, y: coords.y},
      scale: zoomScale,
      animation: true,
    });
  }

  public changeInfo(showList: any[]) {
    this.selectedItem = showList[0];
    this.selectedName = showList[1];
    this.selectedType = showList[2];
    this.selectedId = showList[3];
    this.selectedVirusName = showList[4];
    this.selectedStatus = showList[5];
  }

  public async openSummary(item: QueryItem, zoom: boolean) {
    this.selectedId = null;
    this.selectedItem = item;
    this.selectedType = item.type;
    this.selectedName = item.name;

    if (this.selectedType === 'Host Protein') {
      const hostProtein = item.data as Protein;
      this.selectedId = hostProtein.proteinAc;
      this.selectedName = hostProtein.name;

      if (zoom) {
        this.zoomToNode(`p_${item.name}`);
      }
    } else if (item.type === 'Viral Protein') {
      const viralProtein = item.data as ViralProtein;
      this.selectedName = viralProtein.effectName;
      this.selectedVirusName = viralProtein.virusName;
      if (zoom) {
        this.zoomToNode(`eff_${viralProtein.effectName}_${viralProtein.datasetName}_${viralProtein.virusName}`);
      }
    }
    this.showDetails = true;
  }

  public async closeSummary() {
    this.selectedItem = null;
    this.selectedName = null;
    this.selectedType = null;
    this.selectedId = null;
    this.selectedVirusName = null;
    this.selectedStatus = null;
    this.showDetails = false;
  }

  public async createNetwork(dataset: Array<[string, string]>) {
    await this.getNetwork(dataset);
    this.proteinData = new ProteinNetwork(this.proteins, this.effects, this.edges);
    if (!this.dumpPositions) {
      await this.proteinData.loadPositions(this.http, dataset);
    }
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
    const options = {
      layout: {
        improvedLayout: false,
      },
      edges: {
        smooth: false,
      },
      physics: {
        enabled: this.physicsEnabled,
        stabilization: {
          enabled: false,
        },
      },
    };
    this.network = new vis.Network(container, this.nodeData, options);
    this.network.on('selectNode', (properties) => {
      const id: Array<string> = properties.nodes;
      if (id.length > 0) {
        const nodeId = id[0].split('_');
        let node: QueryItem;
        if (nodeId[0].startsWith('p')) {
          node = {
            name: nodeId[1],
            type: 'Host Protein',
            data: this.proteinData.getProtein(nodeId[1])
          };
        } else if (nodeId[0].startsWith('e')) {
          const effect = this.effects.find((eff) => eff.effectName === nodeId[1] && eff.datasetName === nodeId[2] &&
            eff.virusName === nodeId[3]);
          node = {
            name: effect.effectId,
            type: 'Viral Protein',
            data: effect
          };
        }
        if (properties.event.srcEvent.ctrlKey) {
          if (this.analysis.inSelection(node.name) === true) {
            this.analysis.inSelection(node.name);
          } else {
            this.analysis.addItem(node);
            this.analysis.getCount();
          }
          this.openSummary(node, false);
        } else {
          this.openSummary(node, false);
        }
      } else {
        this.closeSummary();
      }
    });
    this.network.on('deselectNode', (properties) => {
      this.closeSummary();
    });


    if (this.dumpPositions) {
      this.network.on('stabilizationIterationsDone', () => {
        // tslint:disable-next-line:no-console
        console.log(`${getDatasetFilename(dataset)}`);
        // tslint:disable-next-line:no-console
        console.log(JSON.stringify(this.network.getPositions()));
      });
      this.network.stabilize();
    }

    if (this.selectedItem) {
      this.zoomToNode(`p_${this.selectedItem.name}`);
    }

    this.queryItems = [];
    this.fillQueryItems(this.proteins, this.effects);
    if (this.selectedItem) {
      this.network.selectNodes(['p_' + this.selectedItem.name]);
    }
  }

  fillQueryItems(hostProteins: Protein[], viralProteins: ViralProtein[]) {
    this.queryItems = [];
    hostProteins.forEach((protein) => {
      this.queryItems.push({
        name: protein.name,
        type: 'Host Protein',
        data: protein
      });
    });

    viralProteins.forEach((effect) => {
      this.queryItems.push({
        name: effect.effectId,
        type: 'Viral Protein',
        data: effect
      });
    });

    this.currentViewNodes = this.nodeData.nodes;
    this.currentViewProteins = this.proteins;
    this.currentViewEffects = this.effects;
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
        const nodeId = `eff_${effect.effectName}_${effect.datasetName}_${effect.virusName}`;
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
      const nodeId = `p_${protein.proteinAc}`;
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
    this.network.setOptions({
      physics: {
        enabled: this.physicsEnabled,
        stabilization: {
          enabled: false,
        },
      }
    });
  }

  private mapHostProteinToNode(hostProtein: Protein): any {
    let color = '#e2b600';
    if (this.analysis.inSelection(hostProtein.name)) {
      color = '#48C774';
    }
    return {
      id: `p_${hostProtein.proteinAc}`,
      label: `${hostProtein.name}`,
      size: 10, font: '5px', color, shape: 'ellipse', shadow: false,
      x: hostProtein.x,
      y: hostProtein.y,
    };
  }

  private mapViralProteinToNode(viralProtein: ViralProtein): any {
    let color = '#118AB2';
    if (this.analysis.inSelection(`${viralProtein.effectName}_${viralProtein.datasetName}_${viralProtein.virusName}`)) {
      color = '#48C774';
    }
    return {
      id: `eff_${viralProtein.effectName}_${viralProtein.datasetName}_${viralProtein.virusName}`,
      label: `${viralProtein.effectName} (${viralProtein.datasetName}, ${viralProtein.virusName})`,
      size: 10, color, shape: 'box', shadow: true, font: {color: '#FFFFFF'},
      x: viralProtein.x,
      y: viralProtein.y,
    };
  }

  private mapEdge(edge: ProteinViralInteraction): any {
    return {
      from: `p_${edge.proteinAc}`,
      to: `eff_${edge.effectName}_${edge.datasetName}_${edge.virusName}`,
      color: {color: '#afafaf', highlight: '#854141'},
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
    this.screenshotArray.forEach((key, index) => {
      const elem = document.getElementById(index.toString());
      html2canvas(elem).then((canvas) => {
        const generatedImage = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
        const a = document.createElement('a');
        a.href = generatedImage;
        a.download = `Network.png`;
        a.click();
      });
    });
  }

  analysisWindowChanged($event: any) {
    if ($event) {
      this.currentViewNodes = $event[0];
      this.currentViewProteins = $event[1][0];
      this.currentViewEffects = $event[1][1];
    } else {
      this.currentViewNodes = this.nodeData.nodes;
      this.currentViewProteins = this.proteins;
      this.currentViewEffects = this.effects;
    }
  }
}
