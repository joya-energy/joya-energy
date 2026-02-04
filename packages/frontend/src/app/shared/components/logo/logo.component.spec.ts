import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogoComponent } from './logo.component';

describe('LogoComponent', () => {
  let component: LogoComponent;
  let fixture: ComponentFixture<LogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have default size as md', () => {
    expect(component.size()).toBe('md');
  });

  it('should show text by default', () => {
    expect(component.showText()).toBe(true);
  });

  it('should have default href as /', () => {
    expect(component.href()).toBe('/');
  });

  it('should render the logo icon', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const svg = compiled.querySelector('svg.logo-icon');
    
    expect(svg).toBeTruthy();
  });

  it('should render the logo text when showText is true', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.querySelector('.logo-text');
    
    expect(text?.textContent).toContain('JOYA Energy');
  });

  it('should apply correct size class', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logo = compiled.querySelector('.logo');
    
    expect(logo?.classList.contains('logo-md')).toBe(true);
  });
});

