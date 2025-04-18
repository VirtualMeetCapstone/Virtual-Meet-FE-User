import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiChatBoxComponent } from './ai-chat-box.component';

describe('AiChatBoxComponent', () => {
  let component: AiChatBoxComponent;
  let fixture: ComponentFixture<AiChatBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AiChatBoxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiChatBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
