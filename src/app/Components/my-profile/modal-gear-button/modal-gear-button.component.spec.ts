import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalGearButtonComponent } from './modal-gear-button.component';

describe('ModalGearButtonComponent', () => {
  let component: ModalGearButtonComponent;
  let fixture: ComponentFixture<ModalGearButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalGearButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalGearButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
