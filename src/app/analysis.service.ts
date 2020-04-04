import {Injectable} from '@angular/core';
import {Protein} from './pages/protein-network';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class AnalysisService {

  private selectedProteins = new Map<string, Protein>();
  private selectSubject = new Subject<{ protein: Protein, selected: boolean }>();

  public tokens: any[] = [];
  private stats: any;
  public tasks: any[] = [];

  private intervalId: any;

  constructor(private http: HttpClient) {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      this.tokens = JSON.parse(tokens);
    }
    this.startWatching();
  }

  async getTasks() {
    return await this.http.get<any>(`${environment.backend}tasks/?tokens=${JSON.stringify(this.tokens)}`).toPromise().catch((e) => {
      clearInterval(this.intervalId);
    });
  }

  addProtein(protein: Protein) {
    if (!this.inSelection(protein)) {
      this.selectedProteins.set(`${protein.proteinAc}`, protein);
      this.selectSubject.next({protein, selected: true});
    }
  }

  inSelection(protein: Protein): boolean {
    return this.selectedProteins.has(protein.proteinAc);
  }

  removeProtein(protein: Protein) {
    if (this.selectedProteins.delete(`${protein.proteinAc}`)) {
      this.selectSubject.next({protein, selected: false});
    }
  }

  getSelection(): Protein[] {
    return Array.from(this.selectedProteins.values());
  }

  getCount(): number {
    return this.selectedProteins.size;
  }

  subscribe(cb: (protein: Protein, selected: boolean) => void) {
    this.selectSubject.subscribe((event) => {
      cb(event.protein, event.selected);
    });
  }

  getTask(token): any {
    this.tasks.forEach((task) => {
      if (task.token === token) {
        return task;
      }
    });
  }

  reset() {
    this.tokens = null;
    this.tasks = null;
    this.stats = null;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  getStats(): any {
    return this.stats;
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

  startWatching() {
    this.intervalId = setInterval(async () => {
      if (this.tokens.length > 0) {
        this.tasks = await this.getTasks();
      }
    }, 1000);
  }

}
