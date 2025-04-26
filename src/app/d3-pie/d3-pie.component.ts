import { Component, ElementRef, input, viewChild, OnDestroy, output, effect } from '@angular/core';
import * as d3 from 'd3';

/**
 * D3PieComponent
 * 
 * Angular standalone component for rendering a reactive D3 pie chart.
 * Uses Angular signals and effects for automatic redraw on input changes.
 * 
 * @example
 * 
 * <app-d3-pie
 *   [data]="pieData"
 *   [width]="500"
 *   [height]="400"
 *   (arcClick)="handleArcClick($event)">
 * </app-d3-pie>
 * 
 */
@Component({
  selector: 'app-d3-pie',
  template: `
    <svg #chart [attr.width]="width()" [attr.height]="height()"></svg>
    <div class="tooltip" style="position: absolute; opacity: 0; background: rgba(0,0,0,0.7); color: white; padding: 5px; border-radius: 3px; pointer-events: none;"></div>
  `,
  standalone: true
})
export class D3PieComponent implements OnDestroy {
  /**
   * Reactive input for pie chart data.
   * Each data item can have a label, value, and optional color.
   * 
   * @example
   * 
   * const pieData = [
   *   { label: 'Category A', value: 30, color: '#ff0000' },
   *   { label: 'Category B', value: 50 },
   *   { label: 'Category C', value: 20, color: '#0000ff' }
   * ];
   * 
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
   * Reference to the SVG element in the template.
   * Used to manipulate the chart with D3.
   */
  chartContainer = viewChild<ElementRef<SVGSVGElement>>('chart');

  /**
   * Output event emitted when an arc is clicked.
   * Emits the data object for the clicked arc.
   * 
   * @event
   * @example
   * 
   * handleArcClick(data: { label: string, value: number }) {
   *   console.log(`Clicked on ${data.label} with value ${data.value}`);
   * }
   * 
   */
  arcClick = output<{ label: string, value: number }>();

  /**
   * Effect: redraws the chart whenever any input signal changes.
   * Automatically tracks dependencies on data, width, and height.
   * 
   * @private
   */
  private chartEffect = effect(() => {
    this.drawChart();
  });

  /**
   * Lifecycle hook: cleans up the SVG and D3 event listeners on destroy.
   * Prevents memory leaks by removing all D3 elements and event handlers.
   */
  ngOnDestroy() {
    // On destroy, clear the SVG and remove all D3 event listeners
    const chartRef = this.chartContainer();
    if (chartRef) {
      d3.select(chartRef.nativeElement).selectAll('*').remove();
    }
    // Optionally, destroy the effect if needed (not required in most cases)
    // this.chartEffect.destroy();
  }

  /**
   * Draws or redraws the pie chart using D3.
   * Called automatically by the effect when inputs change.
   * 
   * The chart includes:
   * - Pie segments with colors based on data or D3's color scheme
   * - Text labels positioned at the center of each segment
   * - Hover effects (scaling, opacity changes)
   * - Click handlers for both segments and labels
   * 
   * @private
   */
  private drawChart() {
    const chartRef = this.chartContainer();
    if (!chartRef) return;

    // Get current width, height, and calculate radius
    const width = this.width();
    const height = this.height();
    const radius = Math.min(width, height) / 2;

    // Select the SVG and clear previous content
    const svg = d3.select(chartRef.nativeElement);
    svg.selectAll('*').remove();

    // Create tooltip div
    const tooltip = d3.select(chartRef.nativeElement.parentNode as any)
      .select('.tooltip');

    // Create a group element centered in the SVG
    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    // Set up color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Set up pie layout and arc generator
    const pie = d3.pie<{ label: string, value: number, color?: string }>().value(d => d.value);
    const path = d3.arc<d3.PieArcDatum<{ label: string, value: number, color?: string }>>()
      .outerRadius(radius - 10)
      .innerRadius(0);

    // Bind data and create arc groups
    const arcs = g.selectAll('.arc')
      .data(pie(this.data()))
      .enter().append('g')
      .attr('class', 'arc');

    // Draw arc paths and set up event handlers
    arcs.append('path')
      .attr('d', path)
      .attr('fill', (d, i) => d.data.color ?? color(i.toString()))
      .style('cursor', 'pointer')
      // Emit arcClick event on click
      .on('click', (event, d) => this.arcClick.emit(d.data))
      // Highlight arc on mouseover and show tooltip
      .on('mouseover', function (event, d) {
        // Highlight the arc
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke', d.data.color ?? color(d.index.toString()))
          .attr('stroke-width', 2)
          .attr('opacity', 0.7)
          .attr('transform', 'scale(1.02)');
          
        // Show tooltip
        tooltip
          .style('opacity', 1)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 25) + 'px')
          .style('fill', 'white')
          .style('font-family', 'Helvetica, Arial, sans-serif')
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .html(`<strong>${d.data.label}</strong>: ${d.data.value}`);
      })
      // Remove highlight on mouseout and hide tooltip
      .on('mouseout', function (event, d) {
        // Remove highlight
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke', null)
          .attr('stroke-width', null)
          .attr('opacity', 1)
          .attr('transform', 'scale(1)');
          
        // Hide tooltip
        tooltip.style('opacity', 0);
      })
      // Move tooltip with mouse
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 25) + 'px');
      });

    // Add labels to each arc and emit arcClick on label click
    arcs.append('text')
      .attr('transform', d => `translate(${path.centroid(d)})`)
      .attr('dy', '0.35em')
      .style('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-family', 'Helvetica, Arial, sans-serif')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('cursor', 'pointer')
      .text(d => d.data.label)
      // Emit arcClick event on label click
      .on('click', (event, d) => this.arcClick.emit(d.data))
      // Highlight arc when hovering over label and show tooltip
      .on('mouseover', function (event, d) {
        // Select the corresponding arc path and apply the same highlight
        d3.select(this.parentNode as any).select('path')
          .transition()
          .duration(150)
          .attr('stroke', d.data.color ?? color(d.index.toString()))
          .attr('stroke-width', 2)
          .attr('opacity', 0.7)
          .attr('transform', 'scale(1.02)');
          
        // Show tooltip
        tooltip
          .style('opacity', 1)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 25) + 'px')
          .style('fill', 'white')
          .style('font-family', 'Helvetica, Arial, sans-serif')
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .html(`<strong>${d.data.label}</strong>: ${d.data.value}`);
      })
      // Remove highlight from arc when mouse leaves label and hide tooltip
      .on('mouseout', function (event, d) {
        d3.select(this.parentNode as any).select('path')
          .transition()
          .duration(150)
          .attr('stroke', null)
          .attr('stroke-width', null)
          .attr('opacity', 1)
          .attr('transform', 'scale(1)');
          
        // Hide tooltip
        tooltip.style('opacity', 0);
      })
      // Move tooltip with mouse
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 25) + 'px');
      });
  }
}
