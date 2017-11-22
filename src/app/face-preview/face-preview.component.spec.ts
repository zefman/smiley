import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FacePreviewComponent } from './face-preview.component';

describe('FacePreviewComponent', () => {
  let component: FacePreviewComponent;
  let fixture: ComponentFixture<FacePreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FacePreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FacePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
