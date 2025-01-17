import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePageRoomComponent } from './home-page-room.component';

describe('HomePageRoomComponent', () => {
  let component: HomePageRoomComponent;
  let fixture: ComponentFixture<HomePageRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomePageRoomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomePageRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
