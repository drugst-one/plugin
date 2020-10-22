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
  getWrapperFromViralProtein, getWrapperFromProtein, getNodeIdsFromPVI, getViralProteinNodeId, getProteinNodeId, Dataset, Tissue
} from '../../interfaces';
import {ProteinNetwork, getDatasetFilename} from '../../main-network';
import {HttpClient, HttpParams} from '@angular/common/http';
import {AnalysisService} from '../../analysis.service';
import html2canvas from 'html2canvas';
import {environment} from '../../../environments/environment';
import {NetworkSettings} from '../../network-settings';


declare var vis: any;

@Component({
  selector: 'app-explorer-page',
  templateUrl: './explorer-page.component.html',
  styleUrls: ['./explorer-page.component.scss'],
})
export class ExplorerPageComponent implements OnInit, AfterViewInit {

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

  private network: any;
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

  public datasetItems: Dataset[] = [
    {
      label: 'SARS-CoV-2 (Gordon et al.)',
      strains: 'SARS-CoV-2',
      hostTarget: 'Human cell line, HEK-293T kidney cells',
      method: 'AP-MS (affinity purification-mass spectrometry)',
      source: ['https://www.biorxiv.org/content/10.1101/2020.03.22.002386v3', 'bioRxiv'],
      year: 2020,
      datasetNames: 'Gordon et al., 2020',
      backendId: 'SARS_CoV2',
      data: [['Krogan', 'SARS-CoV2']]
    },
    {
      label: 'SARS-CoV-1 (Pfefferle et al.)',
      strains: 'SARS-CoV-1',
      hostTarget: 'Human brain and fetal brain cDNA libraries in yeast strains',
      method: 'High-Throughput Yeast Two Hybrid Screen (HTY2H) and validations with Lumier assay, ' +
        'as well as experimentally validated interactions from 20 publications.',
      source: ['https://www.ncbi.nlm.nih.gov/pubmed/22046132', 'NCBI'],
      year: 2011,
      datasetNames: 'Pfefferle et al., 2011',
      backendId: 'SARS_CoV1',
      data: [['Pfefferle', 'SARS-CoV1']]
    },
    {
      label: 'SARS-CoV-1 (VirHostNet 2.0)',
      strains: 'SARS-CoV-1',
      hostTarget: 'Different human cell lines',
      method: 'Literature curation, interactions from 14 publications, which have experimental validation by at ' +
        'least one of the following assays: co-immunoprecipitation, two hybrid, pull-down, mass spectrometry.',
      source: ['http://virhostnet.prabi.fr/', 'VirHostNet 2.0'],
      year: 2014,
      datasetNames: 'VirHostNet 2.0',
      backendId: 'SARS_CoV1',
      data: [['VirHostNet', 'SARS-CoV1']]
    },
  ];

  public selectedDataset = this.datasetItems[0];

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
          const pos = this.network.getPositions([item.nodeId]);
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
    if (!this.network) {
      this.selectedDataset = this.datasetItems[0];
      await this.createNetwork(this.selectedDataset.data);
      this.physicsEnabled = false;
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
    this.nodeData.nodes.getIds();
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

  public async createNetwork(dataset: Array<[string, string]>) {
    this.analysis.resetSelection();
    this.selectedWrapper = null;
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
    const options = NetworkSettings.getOptions('main');
    this.network = new vis.Network(container, this.nodeData, options);
    this.network.on('doubleClick', (properties) => {
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

    this.network.on('click', (properties) => {
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

    if (this.selectedWrapper) {
      this.zoomToNode(this.selectedWrapper.nodeId);
    }

    this.queryItems = [];
    this.fillQueryItems(this.proteins, this.effects);
    if (this.selectedWrapper) {
      this.network.selectNodes([this.selectedWrapper.nodeId]);
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
        const pos = this.network.getPositions([item.nodeId]);
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

      const params = new HttpParams().set('tissue', `${tissue.id}`).set('data', JSON.stringify(this.currentDataset));
      this.http.get<any>(
        `${environment.backend}tissue_expression/`, {params})
        .subscribe((levels) => {
          const updatedNodes = [];
          const maxExpr = Math.max(...levels.map(lvl => lvl.level));
          for (const lvl of levels) {
            const item = getWrapperFromProtein(lvl.protein);
            const node = this.nodeData.nodes.get(item.nodeId);
            if (!node) {
              continue;
            }
            const gradient = lvl.level !== null ? (Math.pow(lvl.level / maxExpr, 1 / 3) * (1 - minExp) + minExp) : -1;
            const pos = this.network.getPositions([item.nodeId]);
            node.x = pos[item.nodeId].x;
            node.y = pos[item.nodeId].y;
            Object.assign(node,
              NetworkSettings.getNodeStyle(
                node.wrapper.type,
                node.isSeed,
                this.analysis.inSelection(item),
                undefined,
                undefined,
                gradient));
            node.wrapper = item;
            node.gradient = gradient;
            this.proteins.find(prot => getProteinNodeId(prot) === item.nodeId).expressionLevel = lvl.level;
            (node.wrapper.data as Protein).expressionLevel = lvl.level;
            updatedNodes.push(node);
          }
          this.nodeData.nodes.update(updatedNodes);
        });

    }

    this.currentViewSelectedTissue = this.selectedTissue;
  }

}
