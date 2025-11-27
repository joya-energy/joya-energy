import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, NavbarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct navigation links', () => {
    expect(component['navLinks']).toHaveLength(4);
    expect(component['navLinks'][0].label).toBe('Simulateurs');
    expect(component['navLinks'][1].label).toBe('Modèle ESCO');
  });

  it('should toggle mobile menu when toggleMobileMenu is called', () => {
    expect(component['isMobileMenuOpen']()).toBe(false);
    
    component['toggleMobileMenu']();
    expect(component['isMobileMenuOpen']()).toBe(true);
    
    component['toggleMobileMenu']();
    expect(component['isMobileMenuOpen']()).toBe(false);
  });

  it('should close mobile menu when closeMobileMenu is called', () => {
    component['isMobileMenuOpen'].set(true);
    expect(component['isMobileMenuOpen']()).toBe(true);
    
    component['closeMobileMenu']();
    expect(component['isMobileMenuOpen']()).toBe(false);
  });

  it('should render navigation links in the template', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('.navbar-link');
    
    expect(navLinks.length).toBe(4);
  });

  it('should have accessible navigation attributes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const nav = compiled.querySelector('nav');
    
    expect(nav?.getAttribute('role')).toBe('navigation');
    expect(nav?.getAttribute('aria-label')).toBe('Main navigation');
  });
});

