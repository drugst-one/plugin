import {AfterViewInit, Component, ElementRef, OnInit, ViewChild, Output, EventEmitter} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Edge, Effect, getDatasetFilename, Protein, ProteinNetwork} from '../protein-network';
import {HttpClient} from '@angular/common/http';
import {ApiService} from '../../api.service';
import {AnalysisService} from '../../analysis.service';

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

  public viralProteinCheckboxes: Array<{ checked: boolean; data: Effect }> = [];

  public proteinData: ProteinNetwork;

  public proteins: any;
  public effects: any;
  public edges: any;

  private network: any;
  private nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};

  private seed = 1;  // TODO: Remove this

  private dumpPositions = false;
  public physicsEnabled = false;

  public queryItems = [];
  public showAnalysisDialog = false;

  public datasetItems: Array<{ label: string, datasets: string, data: Array<[string, string]> }> = [
    {label: 'All', datasets: 'TUM & Krogan', data: [['TUM', 'HCoV'], ['TUM', 'SARS-CoV2'], ['Krogan', 'SARS-CoV2']]},
    {label: 'HCoV', datasets: 'TUM', data: [['TUM', 'HCoV']]},
    {label: 'CoV2', datasets: 'TUM & Krogan', data: [['TUM', 'SARS-CoV2'], ['Krogan', 'SARS-CoV2']]},
    {label: 'CoV2', datasets: 'Krogan', data: [['Krogan', 'SARS-CoV2']]},
    {label: 'CoV2', datasets: 'TUM', data: [['TUM', 'SARS-CoV2']]}];

  @ViewChild('network', {static: false}) networkEl: ElementRef;

  constructor(private http: HttpClient,
              private route: ActivatedRoute,
              private router: Router,
              private api: ApiService,
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
      const nodeId = `pg_${protein.proteinAc}`;
      const node = this.nodeData.nodes.get(nodeId);
      const pos = this.network.getPositions([nodeId]);
      node.x = pos[nodeId].x;
      node.y = pos[nodeId].y;
      if (selected) {
        if (node) {
          node.color = '#c42eff';
          this.nodeData.nodes.update(node);
        }
      } else {
        if (node) {
          node.color = '#e2b600';
          this.nodeData.nodes.update(node);
        }
      }
    });
  }

  ngOnInit() {
  }


  async ngAfterViewInit() {
    if (!this.network) {
      await this.createNetwork(this.datasetItems[0].data);
    }
  }

  private async getNetwork(dataset: Array<[string, string]>) {
    const data: any = await this.api.getNetwork(dataset);
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
    this.network.moveTo({
      position: {x: coords.x, y: coords.y},
      scale: 1.0,
      animation: true,
    });
  }

  public async openSummary(protein: Protein, zoom: boolean) {
    await this.router.navigate(['explorer'], {queryParams: {protein: protein.proteinAc}});
    if (zoom) {
      this.zoomToNode(`pg_${protein.proteinAc}`);
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
    this.network.on('click', (properties) => {
      const id: Array<string> = properties.nodes;
      // TODO use groupID
      if (id.length > 0) {
        if (id[0].startsWith('pg_')) {
          const protein = this.proteinData.getProtein(id[0].substr(3));
          this.openSummary(protein, false);
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
      this.zoomToNode(`pg_${this.currentProteinAc}`);
    }

    this.queryItems = this.proteins;
  }

  public async filterNodes() {
    const visibleIds = new Set<string>(this.nodeData.nodes.getIds());

    const removeIds = new Set<string>();
    const addNodes = new Map<string, Node>();

    const showAll = !this.viralProteinCheckboxes.find((eff) => eff.checked);
    const connectedProteinAcs = new Set<string>();

    this.viralProteinCheckboxes.forEach((cb) => {
      const effects: Array<Effect> = [];
      this.proteinData.effects.forEach((effect) => {
        if (effect.effectName === cb.data.effectName) {
          effects.push(effect);
        }
      });
      effects.forEach((effect) => {
        const nodeId = `eff_${effect.effectName}_${effect.virusName}_${effect.datasetName}`;
        const found = visibleIds.has(nodeId);
        if ((cb.checked || showAll) && !found) {
          const node = this.mapEffectToNode(effect);
          // this.nodeData.nodes.add(node);
          addNodes.set(node.id, node);
        } else if ((!showAll && !cb.checked) && found) {
          // this.nodeData.nodes.remove(nodeId);
          removeIds.add(nodeId);
        }
        if (cb.checked || showAll) {
          effect.proteins.forEach((pg) => {
            connectedProteinAcs.add(pg.proteinAc);
          });
        }
      });
    });
    const filteredProteins = [];
    for (const protein of this.proteinData.proteins) {
      const nodeId = `pg_${protein.proteinAc}`;
      const contains = connectedProteinAcs.has(protein.proteinAc);
      const found = visibleIds.has(nodeId);
      if (contains) {
        filteredProteins.push(protein);

        if (!found) {
          const node = this.mapProteinToNode(protein);
          // this.nodeData.nodes.add(node);
          addNodes.set(node.id, node);
        }
      } else if (found) {
        // this.nodeData.nodes.remove(nodeId);
        removeIds.add(nodeId);
      }
    }

    this.nodeData.nodes.remove(Array.from(removeIds.values()));
    this.nodeData.nodes.add(Array.from(addNodes.values()));

    this.queryItems = filteredProteins;
  }

  public updatePhysicsEnabled() {
    this.network.setOptions({
      physics: {
        enabled: this.physicsEnabled,
        stabilization: {
          enabled: false,
        },
      }
    });
  }

  private mapProteinToNode(protein: Protein): any {
    let color = '#e2b600';
    if (this.analysis.inSelection(protein)) {
      color = '#c42eff';
    }
    return {
      id: `pg_${protein.proteinAc}`,
      label: `${protein.proteinAc}`,
      size: 10, font: '5px', color, shape: 'ellipse', shadow: false,
      x: protein.x,
      y: protein.y,
    };
  }

  private mapEffectToNode(effect: Effect): any {
    return {
      id: `eff_${effect.effectName}_${effect.virusName}_${effect.datasetName}`,
      label: `${effect.effectName} (${effect.virusName}, ${effect.datasetName})`,
      size: 10, color: '#118AB2', shape: 'box', shadow: true, font: {color: '#FFFFFF'},
      x: effect.x,
      y: effect.y,
    };
  }

  private mapEdge(edge: Edge): any {
    return {
      from: `pg_${edge.proteinAc}`,
      to: `eff_${edge.effectName}_${edge.virusName}_${edge.datasetName}`,
      color: {color: '#afafaf', highlight: '#854141'},
    };
  }

  private mapDataToNodes(data: ProteinNetwork): { nodes: any[], edges: any[] } {
    const nodes = [];
    const edges = [];

    for (const protein of data.proteins) {
      nodes.push(this.mapProteinToNode(protein));
    }

    for (const effect of data.effects) {
      nodes.push(this.mapEffectToNode(effect));
    }

    for (const edge of data.edges) {
      edges.push(this.mapEdge(edge));
    }

    return {
      nodes,
      edges,
    };
  }

  // TODO: Remove this:
  private random() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Selection
  // TODO: Improve usage of group ids, revise this after models have been changed to just protein

  inSelection(proteinAc: string): boolean {
    if (!this.proteinData || !proteinAc) {
      return false;
    }
    const protein = this.proteinData.getProtein(proteinAc);
    return this.analysis.inSelection(protein);
  }

  addToSelection(proteinAc: string) {
    if (!this.proteinData || !proteinAc) {
      return false;
    }
    const protein = this.proteinData.getProtein(proteinAc);
    this.analysis.addProtein(protein);
  }

  removeFromSelection(proteinAc: string) {
    if (!this.proteinData || !proteinAc) {
      return false;
    }
    const protein = this.proteinData.getProtein(proteinAc);
    this.analysis.removeProtein(protein);
  }

}
