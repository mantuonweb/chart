import { Component, ElementRef, input, viewChild, OnChanges, OnDestroy, output } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-d3-pie',
  template: `<svg #chart [attr.width]="width()" [attr.height]="height()"></svg>`,
  standalone: true
})
export class D3PieComponent implements OnChanges, OnDestroy {
  data = input<{ label: string, value: number, color?: string }[]>([]);
  width = input(300);
  height = input(300);
  chartContainer = viewChild<ElementRef<SVGSVGElement>>('chart');
  arcClick = output<{ label: string, value: number }>();

  ngOnChanges() {
    this.drawChart();
  }

  ngOnDestroy() {
    // Clear the SVG and remove all D3 event listeners
    const chartRef = this.chartContainer();
    if (chartRef) {
      d3.select(chartRef.nativeElement).selectAll('*').remove();
    }
  }

  private drawChart() {
    const chartRef = this.chartContainer();
    if (!chartRef) return;

    const width = this.width();
    const height = this.height();
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(chartRef.nativeElement);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3.pie<{ label: string, value: number, color?: string }>().value(d => d.value);
    const path = d3.arc<d3.PieArcDatum<{ label: string, value: number, color?: string }>>()
      .outerRadius(radius - 10)
      .innerRadius(0);

    const arcs = g.selectAll('.arc')
      .data(pie(this.data()))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', path)
      .attr('fill', (d, i) => d.data.color ?? color(i.toString()))
      .style('cursor', 'pointer') // Set cursor to pointer
      .on('click', (event, d) => this.arcClick.emit(d.data))
      .on('mouseover', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke', d.data.color ?? color(d.index.toString())) // Use arc color for stroke
          .attr('stroke-width', 3)
          .attr('opacity', 0.8);
      })
      .on('mouseout', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke', null)
          .attr('stroke-width', null)
          .attr('opacity', 1);
      });

    arcs.append('text')
      .attr('transform', d => `translate(${path.centroid(d)})`)
      .attr('dy', '0.35em')
      .style('text-anchor', 'middle')
      .text(d => d.data.label);
  }
}
