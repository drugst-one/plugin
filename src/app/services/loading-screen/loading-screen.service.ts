import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingScreenService {

  constructor() { }

  private _active = new Subject<boolean>();
  private _fullscreen = new Subject<boolean>();

  stateUpdate(bool: boolean) {
    this._active.next(bool);
  }

  fullscreenUpdate(bool: boolean) {
    this._fullscreen.next(bool);
  }

  get _getUpdates () {
    return this._active.asObservable();
  }

  get _isFullscreen () {
    return this._fullscreen.asObservable();
  }
}
