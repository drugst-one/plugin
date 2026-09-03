import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';

interface DistributionNodeValue {
  id: string;
  value: number | null;
}

@Component({
  standalone: false,
  selector: 'app-pruning-distribution-dialog',
  templateUrl: './pruning-distribution-dialog.component.html',
  styleUrls: ['./pruning-distribution-dialog.component.scss'],
})
export class PruningDistributionDialogComponent implements OnChanges, OnDestroy {
  @Input() show = false;
  @Input() propertyName = '';
  @Input() nodes: any[] = [];
  @Input() minimum?: number;
  @Input() maximum?: number;
  @Input() cutoff?: number;
  @Input() pruningDirection = 'greater';
  @Input() pruningType = '';

  @Output() close = new EventEmitter<void>();
  @Output() cutoffChange = new EventEmitter<number>();
  @ViewChild('histogramSvg') histogramSvg?: ElementRef<SVGSVGElement>;
  @ViewChild('sortedSvg') sortedSvg?: ElementRef<SVGSVGElement>;

  distributionValues: number[] = [];
  distributionNodeValues: DistributionNodeValue[] = [];
  distributionMissingValues = 0;
  distributionBins: { from: number; to: number; count: number }[] = [];
  distributionMaxBinCount = 0;
  readonly plotWidth = 640;
  readonly plotHeight = 220;
  readonly padding = { left: 42, right: 18, top: 16, bottom: 32 };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show']) {
      document.body.classList.toggle('pruning-distribution-open', this.show);
    }
    if (changes['nodes'] || changes['propertyName'] || changes['show']) {
      this.buildDistribution();
    }
  }

  ngOnDestroy(): void {
    document.body.classList.remove('pruning-distribution-open');
  }

  private buildDistribution(): void {
    const nodeValues: DistributionNodeValue[] = [];
    let missing = 0;
    for (const node of this.nodes ?? []) {
      const value = node.properties?.[this.propertyName];
      if (typeof value === 'number' && Number.isFinite(value)) {
        nodeValues.push({ id: String(node.id ?? node.label ?? ''), value });
      } else {
        nodeValues.push({ id: String(node.id ?? node.label ?? ''), value: null });
        missing += 1;
      }
    }
    const values = nodeValues.flatMap(entry => entry.value == null ? [] : [entry.value]).sort((a, b) => a - b);
    this.distributionValues = values;
    this.distributionNodeValues = nodeValues;
    this.distributionMissingValues = missing;

    if (!values.length) {
      this.distributionBins = [];
      this.distributionMaxBinCount = 0;
      return;
    }

    const min = values[0];
    const max = values[values.length - 1];
    if (min === max) {
      this.distributionBins = [{ from: min, to: max, count: values.length }];
      this.distributionMaxBinCount = values.length;
      return;
    }

    const binCount = Math.min(30, Math.max(5, Math.ceil(Math.sqrt(values.length))));
    const binWidth = (max - min) / binCount;
    const bins = Array.from({ length: binCount }, (_, index) => ({ from: min + index * binWidth, to: min + (index + 1) * binWidth, count: 0 }));
    values.forEach(value => bins[Math.min(Math.floor((value - min) / binWidth), binCount - 1)].count++);
    this.distributionBins = bins;
    this.distributionMaxBinCount = Math.max(...bins.map(bin => bin.count));
  }

  get innerWidth(): number { return this.plotWidth - this.padding.left - this.padding.right; }
  get innerHeight(): number { return this.plotHeight - this.padding.top - this.padding.bottom; }
  get distributionMinimum(): number { return this.distributionValues[0] ?? 0; }
  get distributionMaximum(): number { return this.distributionValues[this.distributionValues.length - 1] ?? 0; }

  get cutoffX(): number {
    const range = (this.maximum ?? 0) - (this.minimum ?? 0);
    return !range || this.cutoff == null ? this.padding.left : this.padding.left + ((this.cutoff - (this.minimum ?? 0)) / range) * this.innerWidth;
  }

  get sortedCutoffX(): number {
    if (this.cutoff == null || !this.distributionValues.length) return this.padding.left;
    const match = this.sortedValues.findIndex(value => value <= this.cutoff!);
    return this.sortedValueX(match === -1 ? this.sortedValues.length - 1 : match);
  }

  histogramBarX(index: number): number { return this.padding.left + (index / this.distributionBins.length) * this.innerWidth; }
  histogramBarWidth(): number { return this.distributionBins.length ? this.innerWidth / this.distributionBins.length : 0; }
  histogramBarHeight(count: number): number { return this.distributionMaxBinCount ? (count / this.distributionMaxBinCount) * this.innerHeight : 0; }
  sortedValueX(index: number): number { return this.padding.left + (index / Math.max(1, this.distributionValues.length - 1)) * this.innerWidth; }
  sortedValueY(value: number): number {
    const range = this.distributionMaximum - this.distributionMinimum;
    return !range ? this.padding.top + this.innerHeight / 2 : this.padding.top + this.innerHeight - ((value - this.distributionMinimum) / range) * this.innerHeight;
  }
  get sortedValues(): number[] { return [...this.distributionValues].reverse(); }
  get sortedValuesPolyline(): string { return this.sortedValues.map((value, index) => `${this.sortedValueX(index)},${this.sortedValueY(value)}`).join(' '); }

  get sortedValueTicks(): { value: number; y: number }[] {
    const min = this.distributionMinimum;
    const max = this.distributionMaximum;
    if (min === max) return [{ value: min, y: this.sortedValueY(min) }];
    const middle = (min + max) / 2;
    return [max, middle, min].map(value => ({ value, y: this.sortedValueY(value) }));
  }

  get sortedPrunedRegionX(): number {
    return this.pruningDirection === 'greater' ? this.sortedCutoffX : this.padding.left;
  }

  get sortedPrunedRegionWidth(): number {
    const plotEnd = this.padding.left + this.innerWidth;
    return this.pruningDirection === 'greater'
      ? plotEnd - this.sortedCutoffX
      : this.sortedCutoffX - this.padding.left;
  }

  get sortedCutoffLabelX(): number {
    return this.sortedCutoffX + (this.pruningDirection === 'greater' ? -5 : 5);
  }

  get sortedCutoffLabelAnchor(): string {
    return this.pruningDirection === 'greater' ? 'end' : 'start';
  }

  get qualifyingNodeCount(): number {
    if (this.cutoff == null) return 0;
    return this.distributionValues.filter(value => this.pruningDirection === 'greater' ? value >= this.cutoff! : value <= this.cutoff!).length;
  }

  get qualifyingNodeIds(): string[] {
    if (this.cutoff == null) return [];
    return this.distributionNodeValues
      .filter(({ value }) => value != null && (this.pruningDirection === 'greater' ? value >= this.cutoff! : value <= this.cutoff!))
      .map(({ id }) => id);
  }

  get prunedNodeIds(): string[] {
    if (this.cutoff == null) return [];
    return this.distributionNodeValues
      .filter(({ value }) => value != null && (this.pruningDirection === 'greater' ? value < this.cutoff! : value > this.cutoff!))
      .map(({ id }) => id);
  }

  get missingNodeIds(): string[] {
    return this.distributionNodeValues.filter(({ value }) => value == null).map(({ id }) => id);
  }

  get qualifyingNodesTooltip(): string { return this.nodeIdsTooltip('Nodes retained by this cutoff', this.qualifyingNodeIds); }
  get prunedNodesTooltip(): string { return this.nodeIdsTooltip('Nodes removed by this cutoff', this.prunedNodeIds); }
  get missingNodesTooltip(): string { return this.nodeIdsTooltip('Nodes without a numeric value', this.missingNodeIds); }

  private nodeIdsTooltip(label: string, ids: string[]): string {
    return `${label} (${ids.length}): ${ids.join(', ') || 'none'}`;
  }

  formatValue(value?: number): string {
    if (value == null) return '';
    if (value === 0) return '0';
    return Math.abs(value) >= 1 ? value.toPrecision(4) : value.toPrecision(3);
  }

  formatAxisValue(value: number): string {
    return value.toFixed(2);
  }

  downloadHistogram(): void {
    this.downloadSvg(this.histogramSvg?.nativeElement, `${this.propertyName}-distribution.svg`);
  }

  downloadSortedPlot(): void {
    this.downloadSvg(this.sortedSvg?.nativeElement, `${this.propertyName}-ranked-values.svg`);
  }

  downloadData(): void {
    const header = ['nodeId', 'property', 'score', 'qualifiesForCutoff', 'previewStatus'];
    const rows = this.distributionNodeValues.map(({ id, value }) => {
      const qualifies = value != null && this.cutoff != null && (this.pruningDirection === 'greater' ? value >= this.cutoff : value <= this.cutoff);
      const status = value == null ? 'no numeric value' : qualifies ? 'retained by cutoff' : 'would be pruned';
      return [id, this.propertyName, value == null ? '' : value, qualifies ? 'true' : 'false', status];
    });
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    this.downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${this.propertyName}-pruning-data.csv`);
  }

  private downloadSvg(svg: SVGSVGElement | undefined, fileName: string): void {
    if (!svg) return;
    const copy = svg.cloneNode(true) as SVGSVGElement;
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = '.distribution-axis{stroke:#9b9b9b;stroke-width:1}.distribution-bar{fill:#3273dc;opacity:.72}.distribution-line{stroke:#3273dc;stroke-width:2}.distribution-pruned-region{fill:#b7b7b7;opacity:.42}.distribution-cutoff{stroke:#d83a3a;stroke-width:2}.distribution-cutoff-label,.distribution-label{fill:#222;font-size:11px}.distribution-cutoff-label{fill:#b02222;font-weight:600}.distribution-label-end,.distribution-y-label{text-anchor:end}';
    copy.insertBefore(style, copy.firstChild);
    this.downloadBlob(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml;charset=utf-8' }), fileName);
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  setCutoffFromDistribution(event: PointerEvent): void {
    const svg = event.currentTarget as SVGSVGElement;
    const bounds = svg.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(this.innerWidth, (event.clientX - bounds.left) * this.plotWidth / bounds.width - this.padding.left));
    const rawValue = (this.minimum ?? 0) + (relativeX / this.innerWidth) * ((this.maximum ?? 0) - (this.minimum ?? 0));
    const step = this.pruningType === 'float' ? ((this.maximum ?? 0) - (this.minimum ?? 0)) / 1000 : 1;
    const precision = this.pruningType === 'float' ? Math.max(0, Math.ceil(-Math.log10(step || 1))) : 0;
    this.cutoffChange.emit(Number(rawValue.toFixed(precision)));
  }

  setCutoffFromSortedDistribution(event: PointerEvent): void {
    const svg = event.currentTarget as SVGSVGElement;
    const bounds = svg.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(this.innerWidth, (event.clientX - bounds.left) * this.plotWidth / bounds.width - this.padding.left));
    const index = Math.round((relativeX / this.innerWidth) * Math.max(0, this.sortedValues.length - 1));
    const value = this.sortedValues[index];
    if (value != null) this.cutoffChange.emit(value);
  }
}
