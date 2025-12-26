import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadCardComponent, UploadCardConfig } from './upload-card.component';

describe('UploadCardComponent', () => {
  let component: UploadCardComponent;
  let fixture: ComponentFixture<UploadCardComponent>;

  const mockConfig: UploadCardConfig = {
    title: 'Test Title',
    subtitle: 'Test Subtitle',
    acceptedTypes: 'image/*,application/pdf',
    maxSizeText: 'Max 10MB',
    extractButtonText: 'Extract Data',
    manualEntryButtonText: 'Manual Entry',
    selectedFileText: 'File Selected',
    changeFileText: 'Change File'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadCardComponent);
    component = fixture.componentInstance;
    component.config = mockConfig;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
