import { Component, effect } from '@angular/core';
import { D3PieComponent } from './d3-pie/d3-pie.component';
import { ChartjsPieComponent } from './chartjs-pie/chartjs-pie.component';

@Component({
  selector: 'app-root',
  imports: [D3PieComponent, ChartjsPieComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'chart';
  data = [
    { label: 'Category A', value: 30 ,color: '#ff0000' },
    { label: 'Category B', value: 50 , color: '#0000ff' },
    { label: 'Category C', value: 20 , color: '#00ff00' },
  ]
  onArcClick(data: { label: string, value: number }) {
    alert(`Clicked: ${data.label} (${data.value})`);
  }
  constructor() {
   setTimeout(()=>{
    this.data = [
      { label: 'Test', value: 5 ,color: '#ff0780' },
      { label: 'Test2', value: 5 ,color: 'cyan' },
      { label: 'Crud', value: 10 , color: '#0078ff' },
      { label: 'Rate', value: 80 , color: 'green' },
    ]
   },5000)
  }
}
