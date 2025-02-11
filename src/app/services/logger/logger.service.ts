import { Injectable } from '@angular/core';
import { LogMessage } from './logMessage.interface';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  public MAIN_NETWORK = 'Main Network';
  logs: LogMessage[] = [];
  component: string;
  private storageKey = 'loggerLogs';
  private maxLogs = 100;

  constructor() {
    this.restoreLogsFromStorage();
    this.component = this.MAIN_NETWORK;
    this.logMessage('Application reloaded.');
  }

  logMessage(message: string): void {
    const log: LogMessage = {
      component: this.component,
      message: message,
      time: new Date(),
    };
    this.logs.push(log);

    this.saveLogsToStorage();
  }

  changeComponent(component: string): void {
    this.component = component;
  }

  private saveLogsToStorage(): void {
    const logsJson = JSON.stringify(this.logs);
    localStorage.setItem(this.storageKey, logsJson);
  }

  private restoreLogsFromStorage(): void {
    const logsJson = localStorage.getItem(this.storageKey);
    if (logsJson) {
      this.logs = JSON.parse(logsJson).map((log: any) => ({
        ...log,
        time: new Date(log.time),
      }));

      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }
    }
  }
  
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem(this.storageKey);
    this.logMessage('Logs cleared.');
  }

  downloadLogs() {
    let logText = 'Component\tMessage\tTime\n';

    const formatDate = (date: Date): string => {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const ss = String(date.getSeconds()).padStart(2, '0');
      return `${dd}.${mm}.${yyyy} ${hh}:${min}:${ss}`;
    };

    this.logs.forEach((log) => {
      const formattedTime = formatDate(new Date(log.time));
      logText += `${log.component}\t${log.message}\t${formattedTime}\n`;
    });

    const now = new Date();
    const formattedNow = formatDate(now).replace(/[:\s]/g, '-');
    const fileName = `logs_${formattedNow}.txt`;

    const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    this.logMessage(`Logs downloaded as file ${fileName}.`);
  }
}
