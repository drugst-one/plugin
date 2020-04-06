import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
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
  public currentProteinAc = '';
  public geneNames: Array<string> = [];
  public proteinNames: Array<string> = [];
  public proteinAcs: Array<string> = [];

  public viralProteinCheckboxes: Array<{ checked: boolean; data: ViralProtein }> = [];

  public proteinData: ProteinNetwork;

  public proteins: any;
  public effects: any;
  public edges: any;

  private network: any;
  private nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};

  private dumpPositions = false;
  public physicsEnabled = false;

  public queryItems: QueryItem[] = [];
  public showAnalysisDialog = false;

  public selectedAnalysisToken: string | null = null;

  public currentDataset = [];
  private screenshotArray = [0];

  public datasetItems: Array<{ label: string, datasets: string, data: Array<[string, string]> }> = [
    {label: 'All', datasets: 'TUM & Krogan', data: [['TUM', 'HCoV'], ['TUM', 'SARS-CoV2'], ['Krogan', 'SARS-CoV2']]},
    {label: 'HCoV', datasets: 'TUM', data: [['TUM', 'HCoV']]},
    {label: 'CoV2', datasets: 'TUM & Krogan', data: [['TUM', 'SARS-CoV2'], ['Krogan', 'SARS-CoV2']]},
    {label: 'CoV2', datasets: 'Krogan', data: [['Krogan', 'SARS-CoV2']]},
    {label: 'CoV2', datasets: 'TUM', data: [['TUM', 'SARS-CoV2']]}];

  public selectedDataset = this.datasetItems[0];


  @ViewChild('network', {static: false}) networkEl: ElementRef;

  constructor(private http: HttpClient,
              private route: ActivatedRoute,
              private router: Router,
              public analysis: AnalysisService) {
    this.geneNames.push('IFI16');
    this.proteinNames.push('Gamma-interface-inducible protein 16');
    this.proteinAcs.push('Q16666');

    this.route.queryParams.subscribe(async (params) => {
      this.dumpPositions = params.dumpPositions;
      this.physicsEnabled = !!this.dumpPositions;

      const protein = params.protein;
      if (!protein) {
        // In this case, the URL is just `/explorer`
        // Therefore, we do not show a modal
        this.showDetails = false;
        return;
      }

      // In this case, the URL is `/explorer/<protein>`

      if (this.currentProteinAc === protein) {
        // The protein group is the same as before, so we do not need to do anything
        // TODO Also highlight node when reloading the page/sharing the URL
        return;
      }

      // We have a new protein id, so we need to load it and show the modal...

      this.currentProteinAc = protein;

      // TODO: Perform call here for 'protein'...
      // this.zoomToNode(protein)
      this.showDetails = true;
    });

    this.analysis.subscribe((protein, selected) => {
      const nodeId = `p_${protein.proteinAc}`;
      const node = this.nodeData.nodes.get(nodeId);
      if (!node) {
        return;
      }
      const pos = this.network.getPositions([nodeId]);
      node.x = pos[nodeId].x;
      node.y = pos[nodeId].y;
      if (selected) {
        node.color = '#48C774';
        this.nodeData.nodes.update(node);
      } else {
        node.color = '#e2b600';
        this.nodeData.nodes.update(node);
      }
    });
  }

  ngOnInit() {
  }


  async ngAfterViewInit() {
    if (!this.network) {
      this.selectedDataset = this.datasetItems[4];
      await this.createNetwork(this.datasetItems[4].data);
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

  public async openSummary(protein: Protein, zoom: boolean) {
    await this.router.navigate(['explorer'], {queryParams: {protein: protein.proteinAc}});
    if (zoom) {
      this.zoomToNode(`p_${protein.proteinAc}`);
    }
  }

  public async closeSummary() {
    await this.router.navigate(['explorer']);
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
    this.network.on('select', (properties) => {
      const id: Array<string> = properties.nodes;
      if (id.length > 0) {
        if (id[0].startsWith('p_')) {
          const protein = this.proteinData.getProtein(id[0].substr(2));
          this.openSummary(protein, false);
          if (properties.event.srcEvent.ctrlKey) {
            if (this.inSelection(protein.proteinAc) === true) {
              this.removeFromSelection(protein.proteinAc);
            } else {
              this.addToSelection(protein.proteinAc);
              this.analysis.getCount();
            }
          }
        } else {
          this.closeSummary();
        }
      }
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

    if (this.currentProteinAc) {
      this.zoomToNode(`p_${this.currentProteinAc}`);
    }

    this.queryItems = [];
    this.fillQueryItems(this.proteins, this.effects);
  }


  fillQueryItems(hostProteins: Protein[], viralProteins: ViralProtein[]) {
    this.queryItems = [];
    hostProteins.forEach((protein) => {
      this.queryItems.push({
        name: protein.proteinAc,
        type: 'Host Protein',
        data: protein
      });
    });

    viralProteins.forEach((effect) => {
      this.queryItems.push({
        name: effect.effectName,
        type: 'Viral Protein',
        data: effect
      });
    });
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
        const nodeId = `eff_${effect.effectName}_${effect.virusName}_${effect.datasetName}`;
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
      if (item.type === 'Host Protein') {
        this.openSummary(item.data, true);
      } else if (item.type === 'Viral Protein') {
        this.zoomToNode(`eff_${item.data.effectName}_${item.data.virusName}_${item.data.datasetName}`
        );
      }
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

  private mapHostProteinToNode(protein: Protein): any {
    let color = '#e2b600';
    if (this.analysis.inSelection(protein)) {
      color = '#48C774';
    }
    return {
      id: `p_${protein.proteinAc}`,
      label: `${protein.proteinAc}`,
      size: 10, font: '5px', color, shape: 'ellipse', shadow: false,
      x: protein.x,
      y: protein.y,
    };
  }

  private mapViralProteinToNode(effect: ViralProtein): any {
    return {
      id: `eff_${effect.effectName}_${effect.virusName}_${effect.datasetName}`,
      label: `${effect.effectName} (${effect.virusName}, ${effect.datasetName})`,
      size: 10, color: '#118AB2', shape: 'box', shadow: true, font: {color: '#FFFFFF'},
      x: effect.x,
      y: effect.y,
    };
  }

  private mapEdge(edge: ProteinViralInteraction): any {
    return {
      from: `p_${edge.proteinAc}`,
      to: `eff_${edge.effectName}_${edge.virusName}_${edge.datasetName}`,
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

  public addAllHostProteins() {
    const visibleIds = new Set<string>(this.nodeData.nodes.getIds());
    for (const protein of this.proteinData.proteins) {
      const nodeId = `p_${protein.proteinAc}`;
      const found = visibleIds.has(nodeId);
      if (found && !this.analysis.inSelection(protein)) {
        this.analysis.addProtein(protein);
      }
    }
  }

  inSelection(proteinAc: string): boolean {
    if (!this.proteinData || !proteinAc) {
      return false;
    }
    const protein = this.proteinData.getProtein(proteinAc);
    if (!protein) {
      return false;
    }
    return this.analysis.inSelection(protein);
  }

  addToSelection(proteinAc: string) {
    if (!this.proteinData || !proteinAc) {
      return false;
    }
    const protein = this.proteinData.getProtein(proteinAc);
    if (!protein) {
      return false;
    }
    this.analysis.addProtein(protein);
  }

  removeFromSelection(proteinAc: string) {
    if (!this.proteinData || !proteinAc) {
      return false;
    }
    const protein = this.proteinData.getProtein(proteinAc);
    if (!protein) {
      return false;
    }
    this.analysis.removeProtein(protein);
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

}
