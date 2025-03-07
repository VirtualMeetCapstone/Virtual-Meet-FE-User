import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDeleteStoryComponent } from './modal-delete-story.component';

describe('ModalDeleteStoryComponent', () => {
  let component: ModalDeleteStoryComponent;
  let fixture: ComponentFixture<ModalDeleteStoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalDeleteStoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalDeleteStoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
