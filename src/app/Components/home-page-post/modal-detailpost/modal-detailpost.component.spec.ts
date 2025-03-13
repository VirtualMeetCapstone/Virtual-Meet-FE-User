import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDetailpostComponent } from './modal-detailpost.component';

describe('ModalDetailpostComponent', () => {
  let component: ModalDetailpostComponent;
  let fixture: ComponentFixture<ModalDetailpostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalDetailpostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalDetailpostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
