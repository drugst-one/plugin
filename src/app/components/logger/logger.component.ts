import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { LoggerService } from 'src/app/services/logger/logger.service';
import { Subscription } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  styleUrls: ['./logger.component.scss']
})
export class LoggerComponent implements OnInit, AfterViewInit {
  @ViewChild('logsContainer') logsContainer!: ElementRef;
  @Output() heightChanged = new EventEmitter<void>();
  collapseLogger: boolean = true;
  expandedLogIndices = new Set<number>();
  copiedLogIndex: number | null = null;
  modalCopied = false;
  detailsModalOpen = false;
  detailsModalTitle = '';
  detailsModalContent = '';
  private logsSubscription: Subscription;

  constructor(public logger: LoggerService) { }

  ngOnInit(): void {
    this.logsSubscription = this.logger.logs$.subscribe(() => {
      this.scrollToBottom();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.heightChanged.emit(), 0);
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
    this.collapseLogger = !this.collapseLogger;
    this.scrollToBottom();
    setTimeout(() => this.heightChanged.emit(), 0);
  }

  hasDetails(details: unknown): boolean {
    return details !== undefined && details !== null;
  }

  isExpanded(index: number): boolean {
    return this.expandedLogIndices.has(index);
  }

  toggleDetails(index: number, event?: MouseEvent): void {
    const rowElement = (event?.currentTarget as HTMLElement | null)?.closest('tr') as HTMLElement | null;
    const expanding = !this.expandedLogIndices.has(index);

    if (this.expandedLogIndices.has(index)) {
      this.expandedLogIndices.delete(index);
    } else {
      this.expandedLogIndices.add(index);
    }

    setTimeout(() => {
      if (expanding && rowElement && this.logsContainer) {
        const container = this.logsContainer.nativeElement as HTMLElement;
        const targetTop = Math.max(rowElement.offsetTop - 8, 0);
        container.scrollTo({ top: targetTop, behavior: 'auto' });
      }
      this.heightChanged.emit();
    }, 0);
  }

  formatDetails(details: unknown): string {
    return JSON.stringify(details, null, 2);
  }

  async copyDetails(details: unknown, index?: number): Promise<void> {
    const formattedDetails = typeof details === 'string' ? details : this.formatDetails(details);
    try {
      await navigator.clipboard.writeText(formattedDetails);
      if (index !== undefined) {
        this.copiedLogIndex = index;
        setTimeout(() => {
          if (this.copiedLogIndex === index) {
            this.copiedLogIndex = null;
          }
        }, 2000);
      } else {
        this.modalCopied = true;
        setTimeout(() => {
          this.modalCopied = false;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy log details.', error);
    }
  }

  openDetailsModal(log: { component: string; time: Date; details?: unknown }): void {
    this.detailsModalTitle = `${log.component} | ${new Date(log.time).toLocaleString()}`;
    this.detailsModalContent = this.formatDetails(log.details);
    this.detailsModalOpen = true;
  }

  closeDetailsModal(): void {
    this.detailsModalOpen = false;
    this.detailsModalTitle = '';
    this.detailsModalContent = '';
    this.modalCopied = false;
  }
}
