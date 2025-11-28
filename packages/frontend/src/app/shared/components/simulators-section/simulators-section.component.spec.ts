import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimulatorsSectionComponent } from './simulators-section.component';

describe('SimulatorsSectionComponent', () => {
  let component: SimulatorsSectionComponent;
  let fixture: ComponentFixture<SimulatorsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulatorsSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SimulatorsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should render three simulator cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.simulator-card');
    expect(cards.length).toBe(3);
  });
});

