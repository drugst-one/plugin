import {Injectable} from '@angular/core';
import {ProteinGroup} from './pages/protein-network';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {

  private selectedProteins = new Map<string, ProteinGroup>();
  private selectSubject = new Subject<{protein: ProteinGroup, selected: boolean}>();

  constructor() {
  }

  addProtein(protein: ProteinGroup) {
    if (!this.inSelection(protein)) {
      this.selectedProteins.set(`${protein.groupId}`, protein);
      this.selectSubject.next({protein, selected: true});
    }
  }

  inSelection(protein: ProteinGroup): boolean {
    return this.selectedProteins.has(`${protein.groupId}`);
  }

  removeProtein(protein: ProteinGroup) {
    if (this.selectedProteins.delete(`${protein.groupId}`)) {
      this.selectSubject.next({protein, selected: false});
    }
  }

  getSelection(): ProteinGroup[] {
    return Array.from(this.selectedProteins.values());
  }

  getCount(): number {
    return this.selectedProteins.size;
  }

  subscribe(cb: (protein: ProteinGroup, selected: boolean) => void) {
    this.selectSubject.subscribe((event) => {
      cb(event.protein, event.selected);
    });
  }

}
