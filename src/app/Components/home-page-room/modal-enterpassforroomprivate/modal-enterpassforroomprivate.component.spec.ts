import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalEnterpassforroomprivateComponent } from './modal-enterpassforroomprivate.component';

describe('ModalEnterpassforroomprivateComponent', () => {
  let component: ModalEnterpassforroomprivateComponent;
  let fixture: ComponentFixture<ModalEnterpassforroomprivateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalEnterpassforroomprivateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalEnterpassforroomprivateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
