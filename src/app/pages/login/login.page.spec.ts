import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { LoginPage } from './login.page';
import { NvrService } from '../../services/nvr.service';
import { EventServerService } from '../../services/event-server.service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let mockNvrService: jest.Mocked<NvrService>;
  let mockEventServerService: jest.Mocked<EventServerService>;
  let mockRouter: jest.Mocked<Router>;
  let mockStore: jest.Mocked<Store>;

  beforeEach(async () => {
    const nvrSpy = {
      login: jest.fn(),
      setLogin: jest.fn(),
      configureBasicAuth: jest.fn(),
      configureSSL: jest.fn(),
      saveToCloud: jest.fn(),
      loadMonitors: jest.fn(),
      isMobile: jest.fn(),
      validateApi: jest.fn()
    };
    const eventServerSpy = {
      init: jest.fn()
    };
    const routerSpy = {
      navigate: jest.fn()
    };
    const storeSpy = {
      dispatch: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LoginPage, ReactiveFormsModule],
      providers: [
        { provide: NvrService, useValue: nvrSpy },
        { provide: EventServerService, useValue: eventServerSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Store, useValue: storeSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    mockNvrService = TestBed.inject(NvrService) as jest.Mocked<NvrService>;
    mockEventServerService = TestBed.inject(EventServerService) as jest.Mocked<EventServerService>;
    mockRouter = TestBed.inject(Router) as jest.Mocked<Router>;
    mockStore = TestBed.inject(Store) as jest.Mocked<Store>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    component.ngOnInit();
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.get('isUseAuth')?.value).toBe(false); // Demo server preset sets this to false
    expect(component.loginForm.get('keepAwake')?.value).toBe(true);
  });

  it('should show error for invalid form', async () => {
    component.loginForm.patchValue({ serverName: '' });
    await component.saveItems();
    expect(component.toastMessage).toBe('Please fill in required fields');
    expect(component.showToast).toBe(true);
  });

  it('should login successfully with valid data', async () => {
    (mockNvrService.login as jest.Mock).mockReturnValue(of({ access_token: 'test-token' }));
    (mockNvrService.validateApi as jest.Mock).mockReturnValue(of({ success: true }));
    (mockNvrService.loadMonitors as jest.Mock).mockReturnValue(of([]));
    (mockNvrService.configureBasicAuth as jest.Mock).mockResolvedValue(undefined);
    (mockNvrService.configureSSL as jest.Mock).mockResolvedValue(undefined);
    (mockEventServerService.init as jest.Mock).mockResolvedValue(undefined);

    component.loginForm.patchValue({
      serverName: 'test-server',
      username: 'testuser',
      password: 'testpass',
      url: 'http://test.com',
      apiurl: 'http://test.com/api',
      streamingurl: 'http://test.com/stream'
    });

    await component.saveItems();

    expect(mockNvrService.login).toHaveBeenCalled();
    expect(mockStore.dispatch).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/monitors']);
  });
});
