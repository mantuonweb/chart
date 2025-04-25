import { ComponentFixture, TestBed } from '@angular/core/testing';

import { D3PieComponent } from './d3-pie.component';

describe('D3PieComponent', () => {
  let component: D3PieComponent;
  let fixture: ComponentFixture<D3PieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [D3PieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(D3PieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
