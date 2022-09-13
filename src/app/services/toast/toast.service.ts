import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { LiveToasts, Toast } from 'src/app/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor() { }

  public toasts: Toast[] = [];

  // id of toasts will be counted up
  private id = 0;
  public liveToasts: LiveToasts = {};

  private getToasts = new Subject<LiveToasts>();

  public setNewToast(toast: Toast) {
    this.liveToasts[this.id] = toast;
    this.getToasts.next(this.liveToasts);
    this.setTimer(this.id);
    this.id ++;
  }

  public setTimer(id: number) {
    setTimeout(() => {
      this.deleteToast(id);
    }, 8000);
  }

  public deleteToast(id: number) {
    if (this.liveToasts.hasOwnProperty(id)) {
      delete this.liveToasts[id];
    }
  }

  get getToasts$ () {
    return this.getToasts.asObservable();
  }

}
