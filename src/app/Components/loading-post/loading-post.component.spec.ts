import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingPostComponent } from './loading-post.component';

describe('LoadingPostComponent', () => {
  let component: LoadingPostComponent;
  let fixture: ComponentFixture<LoadingPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoadingPostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadingPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
