import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureHighlightsComponent } from './feature-highlights.component';

describe('FeatureHighlightsComponent', () => {
  let component: FeatureHighlightsComponent;
  let fixture: ComponentFixture<FeatureHighlightsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureHighlightsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureHighlightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should render three feature cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const articles = compiled.querySelectorAll('article.feature-card');
    expect(articles.length).toBe(3);
  });

  it('should contain expected feature titles', () => {
    const titles = component['features'].map(feature => feature.title);
    expect(titles).toContain('0 investissement initial');
    expect(titles).toContain('Installation & maintenance incluses');
  });
});

