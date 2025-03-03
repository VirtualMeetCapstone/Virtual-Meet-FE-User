import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateStoryDialogComponent } from './create-story-dialog.component';

describe('CreateStoryDialogComponent', () => {
  let component: CreateStoryDialogComponent;
  let fixture: ComponentFixture<CreateStoryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateStoryDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateStoryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
