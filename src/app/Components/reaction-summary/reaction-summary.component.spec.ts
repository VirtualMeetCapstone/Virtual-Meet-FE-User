import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReactionSummaryComponent } from './reaction-summary.component';

describe('ReactionSummaryComponent', () => {
  let component: ReactionSummaryComponent;
  let fixture: ComponentFixture<ReactionSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReactionSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReactionSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
