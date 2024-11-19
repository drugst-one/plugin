import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  logs: string[] = [];

  constructor() { }

  logMessage(message: string): void {
    this.logs.push(message);
  }
}
