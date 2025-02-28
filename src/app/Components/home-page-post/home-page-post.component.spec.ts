import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePagePostComponent } from './home-page-post.component';

describe('HomePagePostComponent', () => {
  let component: HomePagePostComponent;
  let fixture: ComponentFixture<HomePagePostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomePagePostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomePagePostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
