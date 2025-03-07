import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LoggerService } from 'src/app/services/logger/logger.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  styleUrls: ['./logger.component.scss']
})
export class LoggerComponent implements OnInit {
  @ViewChild('logsContainer') logsContainer!: ElementRef;
  collapseLogger: boolean = true;
  private logsSubscription: Subscription;

  constructor(public logger: LoggerService) { }

  ngOnInit(): void {
    this.logsSubscription = this.logger.logs$.subscribe(() => {
      this.scrollToBottom();
    });
  }

  ngOnDestroy(): void {
    this.logsSubscription.unsubscribe();
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.logsContainer) {
        this.logsContainer.nativeElement.scrollTop = this.logsContainer.nativeElement.scrollHeight;
      }
    }, 0);
  }

  collapseLog(): void {
    this.collapseLogger = !this.collapseLogger
    this.scrollToBottom();
  }
}
