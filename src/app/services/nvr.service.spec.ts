import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NvrService, LoginData } from './nvr.service';

describe('NvrService', () => {
  let service: NvrService;
  let httpMock: HttpTestingController;

  const mockLoginData: LoginData = {
    serverName: 'test-server',
    username: 'testuser',
    password: 'testpass',
    isUseAuth: true,
    isUseBasicAuth: false,
    basicAuthUser: '',
    basicAuthPassword: '',
    url: 'http://test.com',
    apiurl: 'http://test.com/api',
    streamingurl: 'http://test.com/stream',
    eventServer: 'ws://test.com/events',
    isUseEventServer: false,
    enableStrictSSL: false,
    saveToCloud: false,
    enableLowBandwidth: false,
    autoSwitchBandwidth: false,
    fallbackConfiguration: '',
    usePin: false,
    isKiosk: false,
    keepAwake: true,
    authSession: ''
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NvrService]
    });
    service = TestBed.inject(NvrService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get login data', () => {
    service.setLogin(mockLoginData);
    const retrievedData = service.getLogin();
    expect(retrievedData).toEqual(mockLoginData);
  });

  it('should login successfully', () => {
    service.setLogin(mockLoginData);
    const mockResponse = { access_token: 'test-token' };
    
    service.login('test-server', 'testuser', 'testpass').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://test.com/api/host/login.json');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ user: 'testuser', pass: 'testpass' });
    req.flush(mockResponse);
  });

  it('should load monitors', () => {
    service.setLogin(mockLoginData);
    const mockMonitors = [
      { 
        Monitor: { 
          Id: '1', 
          Name: 'Test Monitor', 
          Function: 'Monitor',
          Enabled: '1',
          Width: '640',
          Height: '480',
          Sequence: '1'
        } 
      }
    ];
    
    service.loadMonitors().subscribe(monitors => {
      expect(monitors).toEqual(mockMonitors);
      expect(monitors[0].Monitor.connKey).toBeDefined();
    });

    const monitorsReq = httpMock.expectOne(req => req.url.includes('monitors.json'));
    expect(monitorsReq.request.method).toBe('GET');
    monitorsReq.flush({ monitors: mockMonitors });

    const daemonReq = httpMock.expectOne(req => req.url.includes('daemonStatus/id:1/daemon:zmc.json'));
    expect(daemonReq.request.method).toBe('GET');
    daemonReq.flush({ statustext: 'running since 2024-01-01' });
  });

  it('should handle login error', () => {
    service.setLogin(mockLoginData);
    
    service.login('test-server', 'testuser', 'wrongpass').subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error).toBeDefined();
      }
    });

    const req = httpMock.expectOne('http://test.com/api/host/login.json');
    req.flush({ error: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should logout successfully', () => {
    service.setLogin(mockLoginData);
    
    service.logout().subscribe(response => {
      expect(response).toBeDefined();
    });

    const req = httpMock.expectOne(req => req.url.includes('logout.json'));
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('should detect mobile platform', () => {
    const isMobile = service.isMobile();
    expect(typeof isMobile).toBe('boolean');
  });
});
