import {Injectable} from '@angular/core';
import {QueryItem, Task} from './interfaces';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../environments/environment';
import {toast} from 'bulma-toast';

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

  async startAnalysis(algorithm, parameters) {
    const resp = await this.http.post<any>(`${environment.backend}task/`, {
      algorithm,
      parameters,
    }).toPromise();
    this.tokens.push(resp.token);
    localStorage.setItem('tokens', JSON.stringify(this.tokens));
    this.startWatching();
  }

  showToast(task: Task, status: 'DONE' | 'FAILED') {
    let toastMessage;
    let toastType;
    const startDate = new Date(task.info.startedAt);
    const finishedDate = new Date(task.info.finishedAt);
    if (status === 'DONE') {
      toastMessage = `Computation finished succesfully.
              \n- Algorithm: ${task.info.algorithm}
              \n- Started At: ${startDate.getHours()}:${startDate.getMinutes()}
              \n- Finished At: ${finishedDate.getHours()}:${finishedDate.getMinutes()}`;
      toastType = 'is-success';
    } else if (status === 'FAILED') {
      toastMessage = `Computation failed.
              \n- Algorithm: ${task.info.algorithm}
              \n- Started At: ${startDate.getHours()}:${startDate.getMinutes()}`;
      toastType = 'is-danger';
    }

    toast({
      message: toastMessage,
      duration: 5000,
      dismissible: true,
      pauseOnHover: true,
      type: toastType,
      position: 'top-center',
      animate: { in: 'fadeIn', out: 'fadeOut' }
    });
  }

  startWatching() {
    const watch = async () => {
      if (this.tokens.length > 0) {
        this.tasks = await this.getTasks();
        this.tasks.forEach((task) => {
          if (this.finishedTokens.find((finishedToken) => finishedToken === task.token)) {
          } else {
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
      }
    };
    watch();
    this.intervalId = setInterval(watch, 5000);
  }


}
