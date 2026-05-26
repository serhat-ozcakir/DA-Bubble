import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProfileDialog } from './edit-profile-dialog';

describe('EditProfileDialog', () => {
  let component: EditProfileDialog;
  let fixture: ComponentFixture<EditProfileDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProfileDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditProfileDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
