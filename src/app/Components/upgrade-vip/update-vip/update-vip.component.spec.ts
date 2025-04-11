import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateVipComponent } from './update-vip.component';

describe('UpdateVipComponent', () => {
  let component: UpdateVipComponent;
  let fixture: ComponentFixture<UpdateVipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpdateVipComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateVipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
