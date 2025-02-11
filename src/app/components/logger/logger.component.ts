import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LoggerService } from 'src/app/services/logger/logger.service';

@Component({
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  styleUrls: ['./logger.component.scss']
})
export class LoggerComponent implements OnInit, AfterViewChecked {
  @ViewChild('logsContainer') logsContainer!: ElementRef;
  collapseLogger: boolean = true;

  constructor(public logger: LoggerService) { }

  ngOnInit(): void {
  }

  scrollToBottom(): void {
    if (this.logsContainer) {
      this.logsContainer.nativeElement.scrollTop = this.logsContainer.nativeElement.scrollHeight;
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

}
