import {QueryItem, Task} from './interfaces';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../environments/environment';
import {toast} from 'bulma-toast';
import {Injectable} from '@angular/core';

export type AlgorithmType = 'trustrank' | 'keypathwayminer' | 'multisteiner' | 'closeness' | 'degree';
export type QuickAlgorithmType = 'quick';

export const algorithmNames = {
  trustrank: 'Trust-Rank',
  keypathwayminer: 'KeyPathwayMiner',
  multisteiner: 'Multi-Steiner',
  closeness: 'Closeness Centrality',
  degree: 'Degree Centrality',
  quick: 'Quick-Find Drugs',
};

export interface Algorithm {
  slug: AlgorithmType | QuickAlgorithmType;
  name: string;
}

export const TRUSTRANK: Algorithm = {slug: 'trustrank', name: algorithmNames.trustrank};
export const CLOSENESS_CENTRALITY: Algorithm = {slug: 'closeness', name: algorithmNames.closeness};
export const DEGREE_CENTRALITY: Algorithm = {slug: 'degree', name: algorithmNames.degree};
export const KEYPATHWAYMINER: Algorithm = {slug: 'keypathwayminer', name: algorithmNames.keypathwayminer};
export const MULTISTEINER: Algorithm = {slug: 'multisteiner', name: algorithmNames.multisteiner};

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {

  private selectedItems = new Map<string, QueryItem>();
  private selectSubject = new Subject<{ item: QueryItem, selected: boolean }>();

  public tokens: string[] = [];
  public finishedTokens: string[] = [];
  public tasks: Task[] = [];

  private intervalId: any;
  private canLaunchNewTask = false;

  constructor(private http: HttpClient) {
    const tokens = localStorage.getItem('tokens');
    const finishedTokens = localStorage.getItem('finishedTokens');


    if (tokens) {
      this.tokens = JSON.parse(tokens);
    }
    if (finishedTokens) {
      this.finishedTokens = JSON.parse(finishedTokens);
    }
    this.startWatching();
  }

  removeTask(token) {
    this.tokens = this.tokens.filter((item) => item !== token);
    this.finishedTokens = this.finishedTokens.filter((item) => item !== token);
    this.tasks = this.tasks.filter((item) => item.token !== (token));
    localStorage.setItem('tokens', JSON.stringify(this.tokens));
  }

  removeAllTasks() {
    this.tasks.forEach((task) => {
      this.removeTask(task.token);
    });
  }

  async getTasks() {
    return await this.http.get<any>(`${environment.backend}tasks/?tokens=${JSON.stringify(this.tokens)}`).toPromise().catch((e) => {
      clearInterval(this.intervalId);
    });
  }

  public addItem(item: QueryItem) {
    if (!this.inSelection(item.name)) {
      this.selectedItems.set(`${item.name}`, item);
      this.selectSubject.next({item, selected: true});
    }
  }

  public addAllHostProteins(nodes, proteins) {
    const visibleIds = new Set<string>(nodes.getIds());
    for (const protein of proteins) {
      const nodeId = protein.proteinAc;
      const found = visibleIds.has(nodeId) || visibleIds.has('p_' + nodeId);
      if (found && !this.inSelection(protein.name)) {
        this.addItem({
          name: protein.proteinAc,
          type: 'Host Protein',
          data: protein
        });
      }
    }
  }

  public addAllViralProteins(nodes, effects) {
    const visibleIds = new Set<string>(nodes.getIds());
    for (const effect of effects) {
      const nodeId = effect.effectId;
      const found = visibleIds.has(nodeId) || visibleIds.has('eff_' + effect.effectName + '_' +
        effect.datasetName + '_' + effect.virusName);
      if (found && !this.inSelection(effect.effectName + '_' +
        effect.datasetName + '_' + effect.virusName)) {
        this.addItem({
          name: effect.effectId,
          type: 'Viral Protein',
          data: effect
        });
      }
    }
  }

  resetSelection() {
    const oldSelection = this.selectedItems.values();
    for (const item of oldSelection) {
      this.removeItem(item.name);
    }
  }

  inSelection(itemName: string): boolean {
    return this.selectedItems.has(itemName);
  }

  removeItem(itemName: string) {
    const item = this.selectedItems.get(itemName);
    if (this.selectedItems.delete(itemName)) {
      this.selectSubject.next({item, selected: false});
    }
  }

  getSelection(): QueryItem[] {
    return Array.from(this.selectedItems.values());
  }

  getCount(): number {
    return this.selectedItems.size;
  }

  subscribe(cb: (item: QueryItem, selected: boolean) => void) {
    this.selectSubject.subscribe((event) => {
      cb(event.item, event.selected);
    });
  }

  async startQuickAnalysis() {
    if (!this.canLaunchTask()) {
      toast({
        message: 'You can only run 3 tasks at once. Please wait for one of them to finish or delete it from the task list.',
        duration: 5000,
        dismissible: true,
        pauseOnHover: true,
        type: 'is-danger',
        position: 'top-center',
        animate: {in: 'fadeIn', out: 'fadeOut'}
      });
      return;
    }

    const resp = await this.http.post<any>(`${environment.backend}task/`, {
      algorithm: 'quick',
      target: 'drug',
      parameters: {
        seeds: this.getSelection().map((i) => i.name),
      },
    }).toPromise();
    this.tokens.push(resp.token);
    localStorage.setItem('tokens', JSON.stringify(this.tokens));
    this.startWatching();

    toast({
      message: 'Quick analysis started. This may take a while.' +
        'Once the computation finished you can view the results in the task list to the right.',
      duration: 10000,
      dismissible: true,
      pauseOnHover: true,
      type: 'is-success',
      position: 'top-center',
      animate: {in: 'fadeIn', out: 'fadeOut'}
    });
  }

  async startAnalysis(algorithm, target: 'drug' | 'drug-target', parameters) {
    if (!this.canLaunchTask()) {
      toast({
        message: 'You can only run 3 tasks at once. Please wait for one of them to finish or delete it from the task list.',
        duration: 5000,
        dismissible: true,
        pauseOnHover: true,
        type: 'is-danger',
        position: 'top-center',
        animate: {in: 'fadeIn', out: 'fadeOut'}
      });
      return;
    }

    const resp = await this.http.post<any>(`${environment.backend}task/`, {
      algorithm,
      target,
      parameters,
    }).toPromise();
    this.tokens.push(resp.token);
    localStorage.setItem('tokens', JSON.stringify(this.tokens));
    this.startWatching();
  }

  showToast(task: Task, status: 'DONE' | 'FAILED') {
    let toastMessage;
    let toastType;
    if (status === 'DONE') {
      toastMessage = 'Computation finished successfully. Click the task in the task list to view the results.';
      toastType = 'is-success';
    } else if (status === 'FAILED') {
      toastMessage = 'Computation failed.';
      toastType = 'is-danger';
    }

    toast({
      message: toastMessage,
      duration: 5000,
      dismissible: true,
      pauseOnHover: true,
      type: toastType,
      position: 'top-center',
      animate: {in: 'fadeIn', out: 'fadeOut'}
    });
  }

  public canLaunchTask(): boolean {
    return this.canLaunchNewTask;
  }

  startWatching() {
    const watch = async () => {
      if (this.tokens.length > 0) {
        this.tasks = await this.getTasks();
        let queuedOrRunningTasks = 0;
        this.tasks.forEach((task) => {
          if (!task.info.done && !task.info.failed) {
            queuedOrRunningTasks++;
          }
          if (!this.finishedTokens.find((finishedToken) => finishedToken === task.token)) {
            if (task.info.done) {
              this.finishedTokens.push(task.token);
              this.showToast(task, 'DONE');
              localStorage.setItem('finishedTokens', JSON.stringify(this.finishedTokens));
            } else if (task.info.failed) {
              this.finishedTokens.push(task.token);
              this.showToast(task, 'FAILED');
              localStorage.setItem('finishedTokens', JSON.stringify(this.finishedTokens));
            } else {
            }
          }
        });
        this.canLaunchNewTask = queuedOrRunningTasks < 3;
      } else {
        this.canLaunchNewTask = true;
      }
    };
    watch();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = setInterval(watch, 5000);
  }


}
