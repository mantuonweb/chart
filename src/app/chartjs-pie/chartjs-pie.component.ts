import { Component, ElementRef, input, viewChild, OnDestroy, output, effect, afterNextRender } from '@angular/core';
import { Chart, ChartConfiguration, ChartEvent, ArcElement, Tooltip, Legend, PieController, DoughnutController } from 'chart.js';
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register required Chart.js components and plugins
Chart.register(ArcElement, Tooltip, Legend, PieController, DoughnutController, ChartDataLabels);

/**
 * ChartjsPieComponent
 * 
 * Angular standalone component for rendering a reactive Chart.js pie chart.
 * Uses Angular signals and effects for automatic redraw on input changes.
 * Features inline labels on pie segments instead of using legends.
 * 
 * @example
 * 
 * <app-chartjs-pie
 *   [data]="chartData"
 *   [width]="400"
 *   [height]="400"
 *   [showInlineLabels]="true"
 *   [labelFormat]="'label-percentage'"
 *   [showLegend]="false"
 *   (segmentClick)="handleChartClick($event)">
 * </app-chartjs-pie>
 * 
 */
@Component({
  selector: 'app-chartjs-pie',
  template: `<div class="chart-container" [style.width.px]="width()" [style.height.px]="height()">
    <canvas #chart></canvas>
  </div>`,
  styles: [`
    .chart-container {
      position: relative;
    }
  `],
  standalone: true
})
export class ChartjsPieComponent implements OnDestroy {
  private destroyRef = inject(DestroyRef);
  private chart: Chart | null = null;

  /**
   * Reactive input for pie chart data.
   * Each data item can have a label, value, and optional color.
   */
  data = input<{ label: string, value: number, color?: string }[]>([]);

  /** 
   * Reactive input for chart width in pixels.
   * @default 300
   */
  width = input(300);

  /** 
   * Reactive input for chart height in pixels.
   * @default 300
   */
  height = input(300);

  /**
   * Optional title for the chart
   * @default ''
   */
  title = input('');

  /**
   * Whether to display the chart legend
   * @default false
   */
  showLegend = input(false);

  /**
   * Whether to show labels inside the pie segments
   * @default true
   */
  showInlineLabels = input(true);

  /**
   * Format for inline labels
   * Options: 'label', 'value', 'percentage', 'label-value', 'label-percentage'
   * @default 'label'
   */
  labelFormat = input<'label' | 'value' | 'percentage' | 'label-value' | 'label-percentage'>('label');

  /** 
   * Reference to the canvas element in the template.
   */
  chartContainer = viewChild<ElementRef<HTMLCanvasElement>>('chart');

  /**
   * Output event emitted when a pie segment is clicked.
   */
  segmentClick = output<{ label: string, value: number, color?: string }>();

  constructor() {
    effect(() => {
        // Access all inputs to track them
        const data = this.data();
        const width = this.width();
        const height = this.height();
        const title = this.title();
        const showLegend = this.showLegend();
        const showInlineLabels = this.showInlineLabels();
        const labelFormat = this.labelFormat();
        
        this.updateChart();
      });
    afterNextRender(() => {
      this.initChart();
      
      // Set up effect to redraw chart when inputs change
      
    });
  }

  /**
   * Initializes the Chart.js instance.
   * 
   * @private
   */
  private initChart(): void {
    const chartRef = this.chartContainer();
    if (!chartRef) return;

    const canvas = chartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Register click handler on canvas
    fromEvent(canvas, 'click')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: Event) => {
        if (!this.chart) return;
        
        const points = this.chart.getElementsAtEventForMode(
          event as unknown as any, 
          'nearest', 
          { intersect: true }, 
          false
        );
        
        if (points.length) {
          const firstPoint = points[0];
          const index = firstPoint.index;
          const dataItem = this.data()[index];
          if (dataItem) {
            this.segmentClick.emit(dataItem);
          }
        }
      });

    // Create initial chart
    this.chart = new Chart(ctx, this.getChartConfig());
  }

  /**
   * Updates the chart when inputs change.
   * 
   * @private
   */
  private updateChart(): void {
    if (!this.chart) return;
    
    const config = this.getChartConfig();
    
    this.chart.data = config.data;
    this.chart.options = config.options as any;
    this.chart.update();
  }

  /**
   * Generates the Chart.js configuration based on component inputs.
   * 
   * @private
   * @returns The Chart.js configuration object
   */
  private getChartConfig(): ChartConfiguration {
    const data = this.data();
    const showInlineLabels = this.showInlineLabels();
    const labelFormat = this.labelFormat();
    
    return {
      type: 'pie',
      data: {
        labels: data.map(item => item.label),
        datasets: [{
          data: data.map(item => item.value),
          backgroundColor: data.map(item => item.color || this.getRandomColor()),
          hoverOffset: 10,
          borderWidth: 1,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.showLegend(),
            position: 'top',
          },
          title: {
            display: !!this.title(),
            text: this.title()
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw as number;
                const total = context.chart.data.datasets[0].data.reduce((sum: number, val: any) => sum + val, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          },
          // Configure the datalabels plugin for inline labels
          datalabels: {

            color: '#fff',
            font: {
              weight: 'bold',
              size: 12
            },
            textStrokeColor: '#000',
            textStrokeWidth: 1,
            textShadowBlur: 3,
            textShadowColor: 'rgba(0,0,0,0.5)',
            formatter: (value: number, context: any) => {
              const label = context.chart.data.labels[context.dataIndex];
              const total = context.chart.data.datasets[0].data.reduce((sum: number, val: any) => sum + val, 0);
              const percentage = Math.round((value / total) * 100);
              
              switch (labelFormat) {
                case 'value':
                  return value;
                case 'percentage':
                  return `${percentage}%`;
                case 'label-value':
                  return `${label}: ${value}`;
                case 'label-percentage':
                  return `${label}: ${percentage}%`;
                case 'label':
                default:
                  return label;
              }
            },
            display: (context: any) => {
              if (!showInlineLabels) return false;
              const total = context.chart.data.datasets[0].data.reduce((sum: number, val: any) => sum + val, 0);
              const value = context.dataset.data[context.dataIndex];
              const percentage = (value / total) * 100;
              // Only show label if segment is at least 5% of the total
              return percentage >= 5;
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    };

  }  /**
   * Generates a random color when no color is specified.
   * 
   * @private
   * @returns A random hex color string
   */
  private getRandomColor(): string {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  /**
   * Lifecycle hook: destroys the Chart.js instance on component destruction.
   */
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}