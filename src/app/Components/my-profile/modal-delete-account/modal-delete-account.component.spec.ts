import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDeleteAccountComponent } from './modal-delete-account.component';

describe('ModalDeleteAccountComponent', () => {
  let component: ModalDeleteAccountComponent;
  let fixture: ComponentFixture<ModalDeleteAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalDeleteAccountComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalDeleteAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
