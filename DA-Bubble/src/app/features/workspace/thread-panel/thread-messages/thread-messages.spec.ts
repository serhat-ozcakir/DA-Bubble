import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadMessages } from './thread-messages';

describe('ThreadMessages', () => {
  let component: ThreadMessages;
  let fixture: ComponentFixture<ThreadMessages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreadMessages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreadMessages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
