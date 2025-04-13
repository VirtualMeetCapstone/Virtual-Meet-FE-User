import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VipHistoryComponent } from './vip-history.component';

describe('VipHistoryComponent', () => {
  let component: VipHistoryComponent;
  let fixture: ComponentFixture<VipHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VipHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VipHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
