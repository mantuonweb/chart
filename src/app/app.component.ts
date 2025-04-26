import { Component } from '@angular/core';
import { D3PieComponent } from './d3-pie/d3-pie.component';

@Component({
  selector: 'app-root',
  imports: [D3PieComponent],
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
}
