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

  onArcClick(data: { label: string, value: number }) {
    alert(`Clicked: ${data.label} (${data.value})`);
  }
}
